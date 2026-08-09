// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const item: any = { id: 'java-1', domain: 'JAVA_THEORY', track: 'CORE_JAVA', title: 'Question', question: 'Question', category: 'Core', priority: 'P1', modelAnswer: 'Prepared', personalAnswer: '', notes: '', followUps: 'A follow-up', latestResult: null, lastPractisedAt: null, nextReviewAt: null };

describe('QuestionRow', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: { uid: 'u1', displayName: 'Maki' } });
    getDomainState.mockReset().mockResolvedValue({});
    listUserEntities.mockReset().mockResolvedValue([]);
    createUserEntity.mockReset().mockResolvedValue(undefined);
    getAnswer.mockReset().mockResolvedValue({ personalAnswer: '', notes: '', followUps: 'A follow-up', updatedAt: '' });
  });

  it('keeps follow-up questions hidden initially and updates aria-expanded', async () => {
    render(<AppStateProvider><QuestionRow item={item} java /></AppStateProvider>);
    await waitFor(() => expect(screen.getByText('Question')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Question'));
    const toggle = await screen.findByRole('button', { name: 'Show follow-up questions' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(screen.getByText('A follow-up')).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
