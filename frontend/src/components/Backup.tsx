import { useEffect, useRef, useState } from "react";
import { FolderOpen, Download, Upload } from "lucide-react";
import { PageHeader } from "./common";
import { useAppState } from "../app/AppStateProvider";
import {
  chooseBackupFolder,
  getBackupFolderName,
  backupToFolder,
  downloadBackup,
  importBackup,
  lastBackupAt,
  supportsFileSystemAccess,
} from "../services/storage/backupRepository";

const formatTimestamp = (date: Date | null) =>
  date ? date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Never";

export function Backup() {
  const { state, dispatch } = useAppState();
  const [folderName, setFolderName] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<Date | null>(lastBackupAt());
  const [message, setMessage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const supported = supportsFileSystemAccess();

  useEffect(() => {
    getBackupFolderName().then(setFolderName);
  }, []);

  const chooseFolder = async () => {
    const name = await chooseBackupFolder();
    setFolderName(name);
    setMessage(name ? `Backup folder set to "${name}".` : null);
  };

  const backupNow = async () => {
    if (!supported) {
      downloadBackup(state);
      setMessage("Downloaded a backup file.");
      return;
    }
    if (!folderName) {
      await chooseFolder();
    }
    const result = await backupToFolder(state, true);
    if (result === "wrote") {
      setLastBackup(lastBackupAt());
      setMessage("Backup saved to your folder.");
    } else if (result === "no-permission") {
      setMessage("Permission to write to the backup folder was denied.");
    } else if (result === "no-folder") {
      setMessage("Choose a backup folder first.");
    }
  };

  const onImportClick = () => fileInput.current?.click();

  const onImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!confirm("Importing will replace all current data with this backup. Continue?")) return;
    try {
      const imported = await importBackup(file);
      dispatch({ type: "REPLACE", payload: imported });
      setMessage("Backup imported.");
    } catch {
      setMessage("That file could not be read as a backup.");
    }
  };

  return (
    <>
      <PageHeader title="Backup" />
      <section className="lc-panel mb-5 rounded-xl border bg-white p-4">
        <p className="text-sm text-[#657777]">
          Last backup: <strong>{formatTimestamp(lastBackup)}</strong>
        </p>
        {supported && (
          <p className="mt-1 text-sm text-[#657777]">
            Backup folder: <strong>{folderName ?? "Not set"}</strong>
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {supported && (
            <button className="inline-flex items-center gap-2 rounded border px-3 py-2" onClick={chooseFolder}>
              <FolderOpen size={16} /> {folderName ? "Change backup folder" : "Choose backup folder"}
            </button>
          )}
          <button className="inline-flex items-center gap-2 rounded bg-[#21675d] px-3 py-2 text-white" onClick={backupNow}>
            <Download size={16} /> Backup now
          </button>
          <button className="inline-flex items-center gap-2 rounded border px-3 py-2" onClick={onImportClick}>
            <Upload size={16} /> Import backup
          </button>
          <input ref={fileInput} type="file" accept="application/json" className="hidden" onChange={onImportFile} />
        </div>
        {message && <p className="mt-3 text-sm text-[#21675d]">{message}</p>}
        <p className="mt-4 text-xs text-[#657777]">
          {supported
            ? "Automatic backups run in the background once a day, rotating between 3 files in your chosen folder."
            : "This browser doesn't support writing directly to a folder, so \"Backup now\" downloads a JSON file instead."}
        </p>
      </section>
    </>
  );
}
