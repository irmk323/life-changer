// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function Boom(): never {
  throw new Error('kaboom');
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // React logs the caught error to console too; silence it for this test's expected output.
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    consoleErrorSpy.mockRestore();
  });

  it('renders children normally when nothing throws', () => {
    render(<ErrorBoundary><p>All good</p></ErrorBoundary>);
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('shows a recoverable fallback instead of a blank screen when a child throws', () => {
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.getByText('kaboom')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('the Reload button reloads the page', () => {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', { value: { ...window.location, reload }, writable: true });
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    screen.getByRole('button', { name: 'Reload' }).click();
    expect(reload).toHaveBeenCalled();
  });
});
