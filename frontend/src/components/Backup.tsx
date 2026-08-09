import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { PageHeader } from "./common";
import { useAppState } from "../app/AppStateProvider";
import { useAuth } from "../app/AuthProvider";
import { exportUserData, downloadBackupJson } from "../services/backup/exportUserData";
import { importUserData, InvalidBackupError } from "../services/backup/importUserData";

export function Backup() {
  const { user } = useAuth();
  const { reload } = useAppState();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const exportNow = async () => {
    if (!user) return;
    setBusy(true);
    setMessage(null);
    try {
      downloadBackupJson(await exportUserData(user.uid));
      setMessage("Downloaded a backup of your data.");
    } catch {
      setMessage("Could not export your data. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onImportClick = () => fileInput.current?.click();

  const onImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user) return;
    if (!confirm("Importing will replace all your current data with this backup. Continue?")) return;
    setBusy(true);
    setMessage(null);
    try {
      const parsed = JSON.parse(await file.text());
      await importUserData(user.uid, parsed);
      await reload();
      setMessage("Backup imported.");
    } catch (err) {
      setMessage(err instanceof InvalidBackupError ? err.message : "That file could not be imported.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Backup" />
      <section className="lc-panel mb-5 rounded-xl border bg-white p-4">
        <p className="text-sm text-[#657777]">
          Your data is saved automatically to your account. Use this page to download a personal copy, or to
          restore your data from a previously downloaded file.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button disabled={busy} className="inline-flex items-center gap-2 rounded bg-[#21675d] px-3 py-2 text-white disabled:opacity-60" onClick={exportNow}>
            <Download size={16} /> Export my data
          </button>
          <button disabled={busy} className="inline-flex items-center gap-2 rounded border px-3 py-2 disabled:opacity-60" onClick={onImportClick}>
            <Upload size={16} /> Import my data
          </button>
          <input ref={fileInput} type="file" accept="application/json" className="hidden" onChange={onImportFile} />
        </div>
        {message && <p className="mt-3 text-sm text-[#21675d]">{message}</p>}
      </section>
    </>
  );
}
