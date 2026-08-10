// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppStateProvider } from '../app/AppStateProvider';
import { QuestionRow } from './common';

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('../app/AuthProvider', () => ({ useAuth }));

const { getDomainState } = vi.hoisted(() => ({ getDomainState: vi.fn() }));
vi.mock('../services/firebase/userDataRepository', () => ({ getDomainState }));

const { listUserEntities, createUserEntity } = vi.hoisted(() => ({
  listUserEntities: vi.fn(),
  createUserEntity: vi.fn(),
}));
vi.mock('../services/firebase/userEntityRepository', () => ({ listUserEntities, createUserEntity }));

const { getAnswer } = vi.hoisted(() => ({ getAnswer: vi.fn() }));
vi.mock('../services/firebase/answersRepository', () => ({ getAnswer }));

const javaItem: any = { id: 'java-1', domain: 'JAVA_THEORY', track: 'CORE_JAVA', title: 'Question', question: 'Question', category: 'Core', priority: 'P1', modelAnswer: 'Prepared', personalAnswer: '', notes: '', followUps: 'A follow-up', latestResult: null, lastPractisedAt: null, nextReviewAt: null };
const behaviourItem: any = { id: 'behaviour-1', domain: 'BEHAVIOUR', track: 'BEHAVIOUR', title: 'Question', question: 'Question', category: 'Core', priority: 'P1', modelAnswer: '', personalAnswer: '', notes: '', followUps: '', latestResult: null, lastPractisedAt: null, nextReviewAt: null };

describe('QuestionRow', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: { uid: 'u1', displayName: 'Maki' } });
    getDomainState.mockReset().mockResolvedValue({});
    listUserEntities.mockReset().mockResolvedValue([]);
    createUserEntity.mockReset().mockResolvedValue(undefined);
    getAnswer.mockReset().mockResolvedValue({ personalAnswer: '', notes: '', followUps: 'A follow-up', updatedAt: '' });
  });

  afterEach(() => cleanup());

  it('shows Follow-up Questions immediately (no show/hide toggle) with an edit pencil for Java Theory', async () => {
    render(<AppStateProvider><QuestionRow item={javaItem} java /></AppStateProvider>);
    await waitFor(() => expect(screen.getByText('Question')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Question'));
    await waitFor(() => expect(screen.getByText('A follow-up')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Show follow-up questions' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit Follow-up Questions' })).toBeInTheDocument();
  });

  it('shows a Personal Answer & Notes edit pencil for Behaviour too (not just Java Theory)', async () => {
    getAnswer.mockResolvedValue({ personalAnswer: '', notes: '', followUps: '', updatedAt: '' });
    render(<AppStateProvider><QuestionRow item={behaviourItem} /></AppStateProvider>);
    await waitFor(() => expect(screen.getByText('Question')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Question'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit Personal Answer & Notes' })).toBeInTheDocument());
    expect(screen.queryByText('Prepared Answer')).not.toBeInTheDocument();
    expect(screen.queryByText('Follow-up Questions')).not.toBeInTheDocument();
  });

  it('renders Delete question as an icon button on the right, next to Edit question', async () => {
    render(<AppStateProvider><QuestionRow item={javaItem} java /></AppStateProvider>);
    await waitFor(() => expect(screen.getByText('Question')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Question'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit question' })).toBeInTheDocument());
    const deleteButton = screen.getByRole('button', { name: 'Delete question' });
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton.textContent?.trim()).toBe('');
  });
});
