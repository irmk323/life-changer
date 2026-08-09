import type { AppState } from '../types/appState';
import { learningItemLocation } from './assembleAppState';
import {
  deleteDomainStateField,
  updateDomainStateField,
} from '../services/firebase/userDataRepository';
import { saveAnswer } from '../services/firebase/answersRepository';
import {
  createUserEntity,
  deleteUserEntity,
  updateUserEntityFields,
  type UserEntityCollection,
} from '../services/firebase/userEntityRepository';
import { saveDailyLog } from '../services/firebase/userEntityRepository';

export interface AppAction { type: string; payload?: unknown }

const warn = (label: string) => (err: unknown) => console.warn(`Failed to sync ${label} to Firestore:`, err);

const ENTITY_COLLECTIONS: readonly string[] = ['priorities', 'weeklyPlanItems', 'motivationEntries', 'activities', 'functionalTasks', 'systemDesignTasks'];

const LIGHTWEIGHT_LEARNING_KEYS = ['latestResult', 'lastPractisedAt', 'nextReviewAt'] as const;
const ANSWER_KEYS = ['personalAnswer', 'notes', 'followUps'] as const;
const OVERRIDE_KEYS = ['title', 'question', 'category', 'modelAnswer'] as const;

const pick = <T extends Record<string, unknown>>(obj: T, keys: readonly string[]): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const key of keys) if (obj[key] !== undefined) result[key] = obj[key];
  return result;
};

// Fire-and-forget Firestore writes derived from a dispatched action, run using the state
// *before* the reducer applies it locally (so item lookups like domain/track still work).
// Never does a whole-AppState write — every branch targets one field, one entity document,
// or one dot-path, matching the hybrid schema in docs/firebase-leaderboard-tasks.md.
export const syncActionToFirestore = (uid: string, stateBefore: AppState, action: AppAction): void => {
  const p = action.payload as any;

  switch (action.type) {
    case 'UPSERT': {
      const { collection, item } = p as { collection: string; item: any };

      if (collection === 'ddiaChapters') {
        const { id, ...patch } = item;
        Object.entries(patch).forEach(([key, value]) => {
          updateDomainStateField(uid, 'ddia', `chapters.${id}.${key}`, value).catch(warn('ddiaChapters'));
        });
        return;
      }

      if (collection === 'learningItems') {
        // Current UI only ever UPSERTs learningItems to create a brand-new custom question.
        const { doc, pathPrefix } = learningItemLocation(item.domain, item.track);
        updateDomainStateField(uid, doc, `${pathPrefix}${item.id}`, {
          latestResult: item.latestResult ?? null,
          lastPractisedAt: item.lastPractisedAt ?? null,
          nextReviewAt: item.nextReviewAt ?? null,
          track: item.track,
          custom: { title: item.title, question: item.question, category: item.category },
        }).catch(warn('learningItems'));
        return;
      }

      if (ENTITY_COLLECTIONS.includes(collection)) {
        const list = (stateBefore as any)[collection] as { id: string }[];
        const exists = list.some((x) => x.id === item.id);
        const name = collection as UserEntityCollection;
        if (exists) {
          const { id, ...patch } = item;
          updateUserEntityFields(uid, name, id, patch).catch(warn(collection));
        } else {
          createUserEntity(uid, name, item).catch(warn(collection));
        }
        return;
      }
      return;
    }

    case 'DELETE': {
      const { collection, id } = p as { collection: string; id: string };
      if (ENTITY_COLLECTIONS.includes(collection)) {
        deleteUserEntity(uid, collection as UserEntityCollection, id).catch(warn(collection));
        return;
      }
      if (collection === 'learningItems') {
        const item = stateBefore.learningItems.find((x) => x.id === id);
        if (!item) return;
        const { doc, pathPrefix } = learningItemLocation(item.domain, item.track);
        deleteDomainStateField(uid, doc, `${pathPrefix}${id}`).catch(warn('learningItems'));
      }
      return;
    }

    case 'DISMISS_AUTO': {
      const dismissed = [...stateBefore.dismissedAutomaticPriorities, p as string];
      updateDomainStateField(uid, 'dashboard', 'dismissedAutomaticPriorities', dismissed).catch(warn('dismissedAutomaticPriorities'));
      return;
    }

    case 'PRIORITY_REORDER': {
      const { id, direction } = p as { id: string; direction: -1 | 1 };
      const list = stateBefore.priorities;
      const index = list.findIndex((x) => x.id === id);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= list.length) return;
      updateUserEntityFields(uid, 'priorities', list[index].id, { order: next }).catch(warn('priorities'));
      updateUserEntityFields(uid, 'priorities', list[next].id, { order: index }).catch(warn('priorities'));
      return;
    }

    case 'LEARNING_UPDATE': {
      const { id, ...patch } = p as { id: string } & Record<string, unknown>;
      const item = stateBefore.learningItems.find((x) => x.id === id);
      if (!item) return;
      const { doc, pathPrefix } = learningItemLocation(item.domain, item.track);

      const lightweight = pick(patch, LIGHTWEIGHT_LEARNING_KEYS);
      Object.entries(lightweight).forEach(([key, value]) => {
        updateDomainStateField(uid, doc, `${pathPrefix}${id}.${key}`, value).catch(warn('learningItem state'));
      });

      const answer = pick(patch, ANSWER_KEYS);
      if (Object.keys(answer).length) saveAnswer(uid, id, answer).catch(warn('answer'));

      const override = pick(patch, OVERRIDE_KEYS);
      if (Object.keys(override).length) {
        Object.entries(override).forEach(([key, value]) => {
          updateDomainStateField(uid, doc, `${pathPrefix}${id}.custom.${key}`, value).catch(warn('learningItem override'));
        });
        // Custom overrides need the item to always resolve back to the right domain/track.
        updateDomainStateField(uid, doc, `${pathPrefix}${id}.track`, item.track).catch(warn('learningItem override'));
      }
      return;
    }

    case 'DSA_UPDATE': {
      const { id, ...patch } = p as { id: string } & Record<string, unknown>;
      if (patch.firstSolvedAt !== undefined) {
        updateDomainStateField(uid, 'dsa', `${id}.firstSolvedAt`, patch.firstSolvedAt).catch(warn('dsa'));
      }
      if (patch.reviews !== undefined) {
        // Review note *text* is long free text and lives in dsaNotes/{problemId} instead
        // (saved directly by DsaDetail via saveDsaNotes) — never duplicate it into the
        // lightweight domainState/dsa document.
        const reviewsWithoutNotes = (patch.reviews as { note?: string }[]).map(({ note: _note, ...rest }) => rest);
        updateDomainStateField(uid, 'dsa', `${id}.reviews`, reviewsWithoutNotes).catch(warn('dsa'));
      }
      return;
    }

    case 'DAILY_LOG_SAVE': {
      const { date, note } = p as { date: string; note: string };
      saveDailyLog(uid, date, note).catch(warn('dailyLog'));
      return;
    }

    // REPLACE is handled by dedicated reset/import flows, never by this generic sync.
    default:
      return;
  }
};
