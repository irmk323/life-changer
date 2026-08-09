import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

// ctx.firestore() returns the firebase/compat client SDK's Firestore type (not
// firebase-admin, which this package doesn't depend on) — infer it instead of importing
// a type from a package we don't have.
type AdminFirestore = ReturnType<RulesTestContext['firestore']>;

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'life-changer-rules-test',
    firestore: {
      rules: readFileSync(resolve(__dirname, '../../../../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

const validProfile = (uid: string) => ({
  uid, displayName: 'Maki', createdAt: '2026-08-08T00:00:00.000Z', updatedAt: '2026-08-08T00:00:00.000Z',
});

const validProgress = (uid: string) => ({
  uid,
  dsa: { completed: 1, total: 150, percentage: 1 },
  ddia: { completed: 1, total: 12, percentage: 8 },
  helloInterview: { completed: 0, total: 31, percentage: 0 },
  updatedAt: '2026-08-08T00:00:00.000Z',
});

const validActivity = (uid: string) => ({
  uid, domain: 'DDIA', label: 'DDIA Chapter 3', occurredAt: '2026-08-08T00:00:00.000Z',
});

const seed = (fn: (adminDb: AdminFirestore) => Promise<void>): Promise<void> =>
  testEnv.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));

describe('firestore.rules: profiles/{uid}', () => {
  it('lets any signed-in user read a profile', async () => {
    await seed((db) => db.doc('profiles/bob').set(validProfile('bob')));
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(alice.doc('profiles/bob').get());
  });

  it('denies reads while signed out', async () => {
    await seed((db) => db.doc('profiles/bob').set(validProfile('bob')));
    const anon = testEnv.unauthenticatedContext().firestore();
    await assertFails(anon.doc('profiles/bob').get());
  });

  it('lets a user create their own profile', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(alice.doc('profiles/alice').set(validProfile('alice')));
  });

  it("denies writing another user's profile", async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertFails(alice.doc('profiles/bob').set(validProfile('bob')));
  });

  it('rejects extra fields such as notes', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertFails(alice.doc('profiles/alice').set({ ...validProfile('alice'), notes: 'private notes' }));
  });

  it('rejects a payload whose uid does not match the document id', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertFails(alice.doc('profiles/alice').set(validProfile('someone-else')));
  });

  it('rejects a non-string displayName', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertFails(alice.doc('profiles/alice').set({ ...validProfile('alice'), displayName: 123 }));
  });
});

describe('firestore.rules: leaderboardProgress/{uid}', () => {
  it("lets any signed-in user read someone else's progress", async () => {
    await seed((db) => db.doc('leaderboardProgress/bob').set(validProgress('bob')));
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(alice.doc('leaderboardProgress/bob').get());
  });

  it('denies reads while signed out', async () => {
    await seed((db) => db.doc('leaderboardProgress/bob').set(validProgress('bob')));
    const anon = testEnv.unauthenticatedContext().firestore();
    await assertFails(anon.doc('leaderboardProgress/bob').get());
  });

  it('lets a user write their own progress', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(alice.doc('leaderboardProgress/alice').set(validProgress('alice')));
  });

  it("denies writing another user's progress document", async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertFails(alice.doc('leaderboardProgress/bob').set(validProgress('bob')));
  });

  it('denies a payload whose uid field does not match request.auth.uid', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertFails(alice.doc('leaderboardProgress/alice').set(validProgress('someone-else')));
  });

  it('rejects extra fields such as notes', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertFails(alice.doc('leaderboardProgress/alice').set({ ...validProgress('alice'), notes: 'secret' }));
  });

  it('rejects a malformed domain progress shape (missing keys)', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertFails(alice.doc('leaderboardProgress/alice').set({ ...validProgress('alice'), dsa: { completed: 1 } }));
  });

  it('rejects non-numeric progress values', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const bad = { ...validProgress('alice'), dsa: { completed: '1', total: 150, percentage: 1 } };
    await assertFails(alice.doc('leaderboardProgress/alice').set(bad));
  });
});

describe('firestore.rules: leaderboardActivities/{activityId}', () => {
  it('lets any signed-in user read activities', async () => {
    await seed((db) => db.collection('leaderboardActivities').doc('a1').set(validActivity('bob')));
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(alice.collection('leaderboardActivities').doc('a1').get());
  });

  it('denies reads while signed out', async () => {
    await seed((db) => db.collection('leaderboardActivities').doc('a1').set(validActivity('bob')));
    const anon = testEnv.unauthenticatedContext().firestore();
    await assertFails(anon.collection('leaderboardActivities').doc('a1').get());
  });

  it('lets a user create an activity for themself', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(alice.collection('leaderboardActivities').add(validActivity('alice')));
  });

  it('denies creating an activity on behalf of someone else', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertFails(alice.collection('leaderboardActivities').add(validActivity('bob')));
  });

  it('rejects an invalid domain value', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertFails(alice.collection('leaderboardActivities').add({ ...validActivity('alice'), domain: 'NOT_A_DOMAIN' }));
  });

  it('rejects extra fields such as notes', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertFails(alice.collection('leaderboardActivities').add({ ...validActivity('alice'), notes: 'secret' }));
  });

  it('denies updating an existing activity (append-only)', async () => {
    await seed((db) => db.doc('leaderboardActivities/a1').set(validActivity('alice')));
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertFails(alice.doc('leaderboardActivities/a1').update({ label: 'changed' }));
  });

  it('denies deleting an existing activity', async () => {
    await seed((db) => db.doc('leaderboardActivities/a1').set(validActivity('alice')));
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertFails(alice.doc('leaderboardActivities/a1').delete());
  });
});

describe('firestore.rules: everything else stays default-denied', () => {
  it('denies writing to collections outside the Leaderboard allowlist (e.g. learningItems)', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertFails(alice.collection('learningItems').add({ personalAnswer: 'secret', notes: 'secret' }));
  });

  it('denies writing raw AppState-shaped data anywhere', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertFails(alice.collection('appState').doc('alice').set({ dsa: [], learningItems: [] }));
  });
});

describe('firestore.rules: userData/{uid}/** (Phase 2G private personal data)', () => {
  it('lets the owner read their own domainState document', async () => {
    await seed((db) => db.doc('userData/alice/domainState/dsa').set({ 'dsa-1': { firstSolvedAt: '2026-08-01', reviews: [] } }));
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(alice.doc('userData/alice/domainState/dsa').get());
  });

  it('lets the owner write their own domainState document', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(alice.doc('userData/alice/domainState/dsa').set({ 'dsa-1.firstSolvedAt': '2026-08-08' }, { merge: true }));
  });

  it('lets the owner write deeply nested private documents too (answers/dsaNotes/entities)', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(alice.doc('userData/alice/answers/java-core-1').set({ personalAnswer: 'my answer', notes: '', followUps: '', updatedAt: '2026-08-08' }));
    await assertSucceeds(alice.doc('userData/alice/priorities/p1').set({ id: 'p1', title: 'Study DSA' }));
  });

  it("denies another signed-in user from reading someone else's private userData", async () => {
    await seed((db) => db.doc('userData/alice/domainState/dsa').set({ 'dsa-1': { firstSolvedAt: '2026-08-01', reviews: [] } }));
    const bob = testEnv.authenticatedContext('bob').firestore();
    await assertFails(bob.doc('userData/alice/domainState/dsa').get());
  });

  it("denies another signed-in user from writing to someone else's private userData", async () => {
    const bob = testEnv.authenticatedContext('bob').firestore();
    await assertFails(bob.doc('userData/alice/domainState/dsa').set({ 'dsa-1': { firstSolvedAt: '2026-08-08', reviews: [] } }));
  });

  it('denies reads while signed out', async () => {
    await seed((db) => db.doc('userData/alice/domainState/dsa').set({ 'dsa-1': { firstSolvedAt: '2026-08-01', reviews: [] } }));
    const anon = testEnv.unauthenticatedContext().firestore();
    await assertFails(anon.doc('userData/alice/domainState/dsa').get());
  });

  it('denies writes while signed out', async () => {
    const anon = testEnv.unauthenticatedContext().firestore();
    await assertFails(anon.doc('userData/alice/domainState/dsa').set({ 'dsa-1': { firstSolvedAt: '2026-08-08', reviews: [] } }));
  });

  it('lets the owner delete their own private documents (e.g. removing a priority)', async () => {
    await seed((db) => db.doc('userData/alice/priorities/p1').set({ id: 'p1', title: 'x' }));
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(alice.doc('userData/alice/priorities/p1').delete());
  });

  it("denies another signed-in user from deleting someone else's private documents", async () => {
    await seed((db) => db.doc('userData/alice/priorities/p1').set({ id: 'p1', title: 'x' }));
    const bob = testEnv.authenticatedContext('bob').firestore();
    await assertFails(bob.doc('userData/alice/priorities/p1').delete());
  });
});
