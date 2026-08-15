import { ChevronDown, Edit2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { LearningItem } from "../types/appState";
import { useAppState } from "../app/AppStateProvider";
import { useAuth } from "../app/AuthProvider";
import { useAutosaveField } from "../app/useAutosaveField";
import { getAnswer, type LearningAnswer } from "../services/firebase/answersRepository";
import { localDate } from "../services/readiness/calculations";

export const Badge = ({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) => {
  const value = String(children).toUpperCase();
  const style = value === "PASS" || value === "RETAINED" || value === "INTERVIEW_READY" || value === "DONE" ? "bg-[#dceee6] text-[#176143]" : value === "PARTIAL" || value === "DUE" || value === "LEARNING" || value === "MEDIUM" || value === "IN PROGRESS" ? "bg-[#fff1cf] text-[#765700]" : value === "FAIL" || value === "OVERDUE" || value === "RETRY_DUE" || value === "HIGH" ? "bg-[#f8dfdc] text-[#923d36]" : value === "LOW" ? "bg-[#e5eff5] text-[#285b78]" : "bg-slate-100 text-slate-700";
  return <span className={`inline-flex ${compact ? "" : "min-w-[5.5rem]"} justify-center rounded-full px-2 py-1 text-xs font-semibold ${style}`}>{children}</span>;
};

export const STATUS_LABEL: Record<string, string> = { NOT_STARTED: "Not started", IN_PROGRESS: "In progress", LEARNING: "In progress", RETRY_DUE: "In progress", INTERVIEW_READY: "Done", DONE: "Done" };

export const StatusPicker = ({ title, value, options, onChange }: { title: string; value: string; options: readonly string[]; onChange: (value: string) => void }) => (
  <section className="lc-panel status-panel mb-4 rounded-xl border bg-white p-4">
    <h2 className="font-bold">{title}</h2>
    <div className="status-toggle mt-3 flex flex-wrap gap-2">
      {options.map((option) => (
        <button type="button" key={option} className={`status-toggle__option ${value === option ? "status-toggle__option--active" : ""}`} onClick={() => onChange(option)}>
          {STATUS_LABEL[option] || option}
        </button>
      ))}
    </div>
  </section>
);

export const PageHeader = ({ title, subtitle = "A steady, practical preparation plan.", children }: { title: string; subtitle?: string; children?: React.ReactNode }) => <header className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold text-[#203334]">{title}</h1><p className="text-[#657777]">{subtitle}</p></div>{children}</header>;

export const DomainProgress = ({ name, done, total }: { name: string; done: number; total: number }) => {
  const percentage = total ? Math.round((done / total) * 100) : 0;
  return <section className="lc-panel mb-5 rounded-xl border bg-white p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{name} Progress</strong><span>{done} / {total} interview-ready · {percentage}%</span></div><div className="mt-2 h-2 rounded bg-[#d9e3e0]"><div className="h-2 rounded bg-[#21675d]" style={{ width: `${percentage}%` }} /></div></section>;
};

const displayDate = (date: string | null) => date ? new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

// personalAnswer/notes/followUps are lazily loaded (answers/{itemId}) — this only mounts
// once that fetch resolves, so useAutosaveField always starts from the real saved value.
function AnswerFields({ item, answer, java }: { item: LearningItem; answer: LearningAnswer; java: boolean }) {
  const { dispatch } = useAppState();
  const [editing, setEditing] = useState<"modelAnswer" | "personalAnswer" | "followUps" | null>(null);

  const modelAnswerField = useAutosaveField(item.modelAnswer, (value) => dispatch({ type: "LEARNING_UPDATE", payload: { id: item.id, modelAnswer: value } }));
  const personalAnswerField = useAutosaveField(answer.personalAnswer, (value) => dispatch({ type: "LEARNING_UPDATE", payload: { id: item.id, personalAnswer: value } }));
  const followUpsField = useAutosaveField(answer.followUps, (value) => dispatch({ type: "LEARNING_UPDATE", payload: { id: item.id, followUps: value } }));
  const isBehaviour = item.domain === "BEHAVIOUR";

  // Renders field.value (not the original prop) while not editing too, so a pencil-edit +
  // blur is reflected immediately instead of reverting to the stale prop the parent hasn't
  // re-fetched yet.
  const editableSection = (label: string, key: "modelAnswer" | "personalAnswer" | "followUps", field: ReturnType<typeof useAutosaveField>, fallback: string, editable: boolean) => (
    <section className="mt-3">
      <div className="flex gap-2">
        <h3 className="font-semibold">{label}</h3>
        {editable && <button aria-label={`Edit ${label}`} onClick={() => setEditing(key)}><Edit2 size={16} /></button>}
      </div>
      {editing === key
        ? <textarea autoFocus value={field.value} onChange={(event) => field.onChange(event.target.value)} onBlur={() => { field.onBlur(); setEditing(null); }} className="mt-1 w-full rounded border p-2" />
        : <p>{field.value || fallback}</p>}
    </section>
  );

  return (
    <>
      {!isBehaviour && editableSection("Prepared Answer", "modelAnswer", modelAnswerField, "—", java)}
      {java && item.keyPoints?.length > 0 && <section className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3"><h3 className="font-semibold text-amber-900">Key points to mention</h3><ul className="mt-1 list-disc pl-5 text-sm text-amber-900">{item.keyPoints.map((point, i) => <li key={i}>{point}</li>)}</ul></section>}
      {editableSection("Personal Answer & Notes", "personalAnswer", personalAnswerField, "No notes yet.", true)}
      {isBehaviour
        ? null
        : java
          ? editableSection("Follow-up Questions", "followUps", followUpsField, "—", true)
          : (
            <section className="mt-3">
              <h3 className="font-semibold">Follow-up Questions</h3>
              <p>{answer.followUps || "—"}</p>
            </section>
          )}
    </>
  );
}

export function QuestionRow({ item, java = false }: { item: LearningItem; java?: boolean }) {
  const [open, setOpen] = useState(false);
  const [editingAll, setEditingAll] = useState(false);
  const { dispatch } = useAppState();
  const { user } = useAuth();
  const [answer, setAnswer] = useState<LearningAnswer | null>(null);

  useEffect(() => {
    if (!open || answer || !user) return;
    let cancelled = false;
    getAnswer(user.uid, item.id).then((result) => {
      if (!cancelled) setAnswer(result ?? { personalAnswer: "", notes: "", followUps: "", updatedAt: "" });
    });
    return () => { cancelled = true; };
  }, [open, answer, user, item.id]);

  const isBehaviour = item.domain === "BEHAVIOUR";

  // Personal Answer & Notes and Follow-up Questions are edited inline via their own pencil
  // icon (useAutosaveField), never through this dialog — editing the same field through two
  // independent paths left the dialog's save invisible, since useAutosaveField only honors
  // its initial value on mount and never re-syncs from a prop changed elsewhere.
  const saveAll = (form: HTMLFormElement) => {
    const fields = new FormData(form);
    dispatch({
      type: "LEARNING_UPDATE",
      payload: {
        id: item.id,
        question: String(fields.get("question")), title: String(fields.get("question")),
        category: String(fields.get("category")),
        ...(isBehaviour ? {} : { modelAnswer: String(fields.get("modelAnswer")) }),
        priority: String(fields.get("priority")),
      },
    });
    setEditingAll(false);
  };

  return <article className="lc-panel rounded-xl bg-white">
    <button className="grid w-full grid-cols-[minmax(0,1fr)_auto_7rem_7rem_auto] items-center gap-4 p-4 text-left" aria-expanded={open} onClick={() => setOpen(!open)}>
      <span><span className="block font-semibold">{item.question}</span><span className="mt-1 block text-xs text-[#657777]">{item.category}</span></span>
      <Badge compact>{item.latestResult || "NOT STARTED"}</Badge>
      <span className="text-sm"><small className="block text-xs text-[#657777]">First solved</small>{displayDate(item.lastPractisedAt)}</span>
      <span className="text-sm"><small className="block text-xs text-[#657777]">Last reviewed</small>{displayDate(item.nextReviewAt)}</span>
      <ChevronDown size={18} aria-hidden="true" />
    </button>
    {open && <div className="px-5 pb-5">
      {answer ? <AnswerFields item={item} answer={answer} java={java} /> : <p className="mt-3 text-sm text-[#657777]">Loading…</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {(["PASS", "PARTIAL", "FAIL"] as const).map((result) => {
            const active = item.latestResult === result;
            const activeClass = active ? `result-toggle--${result.toLowerCase()}` : "";
            return (
              <button
                className={`rounded border px-3 py-1 font-semibold ${activeClass}`}
                key={result}
                aria-pressed={active}
                onClick={() => { const today = localDate(); dispatch({ type: "LEARNING_UPDATE", payload: { id: item.id, latestResult: result, lastPractisedAt: today } }); dispatch({ type: "UPSERT", payload: { collection: "activities", item: { id: `activity-${item.id}-${today}`, date: today, domain: item.domain, itemId: item.id, label: item.question, result, durationMinutes: 0 } } }); }}
              >
                {result}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button disabled={!answer} onClick={() => setEditingAll(true)}>Edit question</button>
          <button aria-label="Delete question" title="Delete question" onClick={() => confirm("Delete this question?") && dispatch({ type: "DELETE", payload: { collection: "learningItems", id: item.id } })}><Trash2 size={16} /></button>
        </div>
      </div>
    </div>}
    {editingAll && answer && <dialog open className="lc-modal" aria-labelledby={`edit-${item.id}`}><form onSubmit={(event) => { event.preventDefault(); saveAll(event.currentTarget); }} className="grid gap-2"><div className="flex items-center justify-between"><h2 id={`edit-${item.id}`} className="text-lg font-bold">Edit question</h2><button type="button" aria-label="Close edit question" onClick={() => setEditingAll(false)}>×</button></div><label>Question<input name="question" defaultValue={item.question} required /></label><label>Topic<input name="category" defaultValue={item.category} /></label>{!isBehaviour && <label>Prepared answer<textarea name="modelAnswer" defaultValue={item.modelAnswer} /></label>}<label>Priority<select name="priority" defaultValue={item.priority}><option>P0</option><option>P1</option><option>P2</option></select></label><div className="flex gap-2"><button className="rounded bg-[#21675d] px-3 py-1 text-white">Save</button><button type="button" onClick={() => setEditingAll(false)}>Cancel</button></div></form></dialog>}
  </article>;
}
