// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTOSAVE_IDLE_MS, useAutosaveField } from './useAutosaveField';

describe('useAutosaveField', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('does not save immediately when the value changes', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useAutosaveField('', onSave));
    act(() => result.current.onChange('hello'));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves after 5 seconds of no further input', async () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useAutosaveField('', onSave));
    act(() => result.current.onChange('hello'));
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_IDLE_MS));
    expect(onSave).toHaveBeenCalledWith('hello');
  });

  it('resets the idle timer on further input instead of saving early', async () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useAutosaveField('', onSave));
    act(() => result.current.onChange('he'));
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_IDLE_MS - 1000));
    act(() => result.current.onChange('hello'));
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_IDLE_MS - 1000));
    expect(onSave).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('hello');
  });

  it('flushes immediately on blur without waiting for the idle timer', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useAutosaveField('', onSave));
    act(() => result.current.onChange('hello'));
    act(() => result.current.onBlur());
    expect(onSave).toHaveBeenCalledWith('hello');
  });

  it('does not save on blur when the value equals the last saved value', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useAutosaveField('hello', onSave));
    act(() => result.current.onBlur());
    expect(onSave).not.toHaveBeenCalled();
  });

  it('does not save again for the same value after an idle save already ran', async () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useAutosaveField('', onSave));
    act(() => result.current.onChange('hello'));
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_IDLE_MS));
    act(() => result.current.onBlur());
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('flushes a dirty value on unmount (covers route/page transitions)', () => {
    const onSave = vi.fn();
    const { result, unmount } = renderHook(() => useAutosaveField('', onSave));
    act(() => result.current.onChange('hello'));
    unmount();
    expect(onSave).toHaveBeenCalledWith('hello');
  });

  it('does not flush on unmount when nothing changed', () => {
    const onSave = vi.fn();
    const { unmount } = renderHook(() => useAutosaveField('hello', onSave));
    unmount();
    expect(onSave).not.toHaveBeenCalled();
  });
});
