import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetMyData } from './resetUserData';

const { setDomainState } = vi.hoisted(() => ({ setDomainState: vi.fn() }));
vi.mock('../services/firebase/userDataRepository', () => ({ setDomainState }));

const { listUserEntities, deleteUserEntity, listAllDailyLogs, deleteDailyLog } = vi.hoisted(() => ({
  listUserEntities: vi.fn(),
  deleteUserEntity: vi.fn(),
  listAllDailyLogs: vi.fn(),
  deleteDailyLog: vi.fn(),
}));
vi.mock('../services/firebase/userEntityRepository', () => ({ listUserEntities, deleteUserEntity, listAllDailyLogs, deleteDailyLog }));

const { listAllAnswers, deleteAnswer } = vi.hoisted(() => ({ listAllAnswers: vi.fn(), deleteAnswer: vi.fn() }));
vi.mock('../services/firebase/answersRepository', () => ({ listAllAnswers, deleteAnswer }));

const { listAllDsaNotes, deleteDsaNotes } = vi.hoisted(() => ({ listAllDsaNotes: vi.fn(), deleteDsaNotes: vi.fn() }));
vi.mock('../services/firebase/dsaNotesRepository', () => ({ listAllDsaNotes, deleteDsaNotes }));

beforeEach(() => {
  setDomainState.mockReset().mockResolvedValue(undefined);
  listUserEntities.mockReset().mockResolvedValue([]);
  deleteUserEntity.mockReset().mockResolvedValue(undefined);
  listAllDailyLogs.mockReset().mockResolvedValue({});
  deleteDailyLog.mockReset().mockResolvedValue(undefined);
  listAllAnswers.mockReset().mockResolvedValue({});
  deleteAnswer.mockReset().mockResolvedValue(undefined);
  listAllDsaNotes.mockReset().mockResolvedValue({});
  deleteDsaNotes.mockReset().mockResolvedValue(undefined);
});

describe('resetMyData', () => {
  it('clears every domainState document back to its empty default', async () => {
    await resetMyData('u1');
    expect(setDomainState).toHaveBeenCalledWith('u1', 'dsa', {});
    expect(setDomainState).toHaveBeenCalledWith('u1', 'ddia', { chapters: {}, questions: {} });
    expect(setDomainState).toHaveBeenCalledWith('u1', 'dashboard', { dismissedAutomaticPriorities: [] });
  });

  it('deletes every existing entity across all entity collections', async () => {
    listUserEntities.mockImplementation((_uid: string, name: string) =>
      Promise.resolve(name === 'priorities' ? [{ id: 'p1' }, { id: 'p2' }] : []));
    await resetMyData('u1');
    expect(deleteUserEntity).toHaveBeenCalledWith('u1', 'priorities', 'p1');
    expect(deleteUserEntity).toHaveBeenCalledWith('u1', 'priorities', 'p2');
  });

  it('clears functionalTasks/systemDesignTasks too (they get re-seeded on the next load, not here)', async () => {
    listUserEntities.mockImplementation((_uid: string, name: string) =>
      Promise.resolve(name === 'systemDesignTasks' ? [{ id: 'design-1' }] : []));
    await resetMyData('u1');
    expect(deleteUserEntity).toHaveBeenCalledWith('u1', 'systemDesignTasks', 'design-1');
  });

  it('clears free-text answers, dsaNotes, and dailyLogs collections too', async () => {
    listAllAnswers.mockResolvedValue({ 'java-core-1': {}, 'behaviour-2': {} });
    listAllDsaNotes.mockResolvedValue({ 'dsa-3': {} });
    listAllDailyLogs.mockResolvedValue({ '2026-08-01': {} });
    await resetMyData('u1');
    expect(deleteAnswer).toHaveBeenCalledWith('u1', 'java-core-1');
    expect(deleteAnswer).toHaveBeenCalledWith('u1', 'behaviour-2');
    expect(deleteDsaNotes).toHaveBeenCalledWith('u1', 'dsa-3');
    expect(deleteDailyLog).toHaveBeenCalledWith('u1', '2026-08-01');
  });
});
