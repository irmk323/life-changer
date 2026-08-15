// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Backup } from './Backup';

// jsdom in this project doesn't implement File.prototype.text() (a standard, broadly
// supported browser API) — polyfill it for the test environment only via FileReader, which
// jsdom does implement.
if (!('text' in File.prototype)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (File.prototype as any).text = function (this: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('../app/AuthProvider', () => ({ useAuth }));

const { useAppState } = vi.hoisted(() => ({ useAppState: vi.fn() }));
vi.mock('../app/AppStateProvider', () => ({ useAppState }));

const { exportUserData, downloadBackupJson } = vi.hoisted(() => ({ exportUserData: vi.fn(), downloadBackupJson: vi.fn() }));
vi.mock('../services/backup/exportUserData', () => ({ exportUserData, downloadBackupJson }));

const { importUserData, InvalidBackupError } = vi.hoisted(() => ({
  importUserData: vi.fn(),
  InvalidBackupError: class InvalidBackupError extends Error {},
}));
vi.mock('../services/backup/importUserData', () => ({ importUserData, InvalidBackupError }));

const reload = vi.fn();

beforeEach(() => {
  useAuth.mockReturnValue({ user: { uid: 'u1' } });
  useAppState.mockReturnValue({ reload });
  exportUserData.mockReset().mockResolvedValue({ version: 1 });
  downloadBackupJson.mockReset();
  importUserData.mockReset().mockResolvedValue(undefined);
  reload.mockReset().mockResolvedValue(undefined);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => cleanup());

describe('Backup', () => {
  it('exports and downloads a backup on click', async () => {
    render(<Backup />);
    fireEvent.click(screen.getByText('Export my data'));
    await waitFor(() => expect(downloadBackupJson).toHaveBeenCalledWith({ version: 1 }));
    expect(exportUserData).toHaveBeenCalledWith('u1');
  });

  it('imports a selected file after confirming, then reloads app state', async () => {
    render(<Backup />);
    const file = new File([JSON.stringify({ version: 1 })], 'backup.json', { type: 'application/json' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    fireEvent.change(input);
    await waitFor(() => expect(importUserData).toHaveBeenCalledWith('u1', { version: 1 }));
    await waitFor(() => expect(reload).toHaveBeenCalled());
    expect(await screen.findByText('Backup imported.')).toBeInTheDocument();
  });

  it('shows an error message when the imported file is invalid', async () => {
    importUserData.mockRejectedValue(new InvalidBackupError('Unsupported backup version: 99'));
    render(<Backup />);
    const file = new File([JSON.stringify({ version: 99 })], 'backup.json', { type: 'application/json' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    fireEvent.change(input);
    expect(await screen.findByText('Unsupported backup version: 99')).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
  });
});
