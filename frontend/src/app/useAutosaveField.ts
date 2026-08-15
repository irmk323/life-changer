import { useEffect, useRef, useState } from 'react';

export const AUTOSAVE_IDLE_MS = 5000;

export interface AutosaveField {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

// Shared behaviour for every "no Save button" free-text field (Java Theory inline edits,
// Functional/System Design detail fields, DDIA/Hello Interview notes, DSA notes, Daily
// Memo): save 5s after the user stops typing, or immediately on blur — whichever comes
// first — but never write when the value hasn't actually changed since the last save.
export function useAutosaveField(initialValue: string, onSave: (value: string) => void): AutosaveField {
  const [value, setValue] = useState(initialValue);
  const valueRef = useRef(initialValue);
  const lastSavedRef = useRef(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const flush = (next: string) => {
    clearTimer();
    if (next === lastSavedRef.current) return;
    lastSavedRef.current = next;
    onSaveRef.current(next);
  };

  const onChange = (next: string) => {
    setValue(next);
    valueRef.current = next;
    clearTimer();
    timeoutRef.current = setTimeout(() => flush(next), AUTOSAVE_IDLE_MS);
  };

  const onBlur = () => flush(valueRef.current);

  // Flush on unmount too (covers route/page transitions away from a dirty field).
  useEffect(() => () => flush(valueRef.current), []);

  return { value, onChange, onBlur };
}
