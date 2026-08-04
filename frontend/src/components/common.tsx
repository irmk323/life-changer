import { ChevronDown, Edit2 } from "lucide-react";
import { useState } from "react";
import type { LearningItem } from "../types/appState";
import { useAppState } from "../app/AppStateProvider";

export const Badge = ({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) => {
  const value = String(children).toUpperCase();
  const style = value === "PASS" || value === "RETAINED" || value === "INTERVIEW_READY" ? "bg-[#dceee6] text-[#176143]" : value === "PARTIAL" || value === "DUE" || value === "LEARNING" || value === "MEDIUM" ? "bg-[#fff1cf] text-[#765700]" : value === "FAIL" || value === "OVERDUE" || value === "RETRY_DUE" || value === "HIGH" ? "bg-[#f8dfdc] text-[#923d36]" : value === "LOW" ? "bg-[#e5eff5] text-[#285b78]" : "bg-slate-100 text-slate-700";
  return <span className={`inline-flex ${compact ? "" : "min-w-[5.5rem]"} justify-center rounded-full px-2 py-1 text-xs font-semibold ${style}`}>{children}</span>;
};

export const PageHeader = ({ title, children }: { title: string; children?: React.ReactNode }) => <header className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold text-[#203334]">{title}</h1><p className="text-[#657777]">A steady, practical preparation plan.</p></div>{children}</header>;

export const DomainProgress = ({ name, done, total }: { name: string; done: number; total: number }) => {
  const percentage = total ? Math.round((done / total) * 100) : 0;
  return <section className="lc-panel mb-5 rounded-xl border bg-white p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{name} Progress</strong><span>{done} / {total} interview-ready · {percentage}%</span></div><div className="mt-2 h-2 rounded bg-[#d9e3e0]"><div className="h-2 rounded bg-[#21675d]" style={{ width: `${percentage}%` }} /></div></section>;
};

const displayDate = (date: string | null) => date ? new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export function QuestionRow({ item, java = false }: { item: LearningItem; java?: boolean }) {
  const [open, setOpen] = useState(false);
  const [follow, setFollow] = useState(false);
  const [editing, setEditing] = useState<keyof LearningItem | null>(null);
  const [editingAll, setEditingAll] = useState(false);
  const { dispatch } = useAppState();
  const save = (key: keyof LearningItem, value: string) => { dispatch({ type: "LEARNING_UPDATE", payload: { id: item.id, [key]: value } }); setEditing(null); };
  const section = (label: string, key: keyof LearningItem, fallback: string) => <section className="mt-3"><div className="flex gap-2"><h3 className="font-semibold">{label}</h3>{java && <button aria-label={`Edit ${label}`} onClick={() => setEditing(key)}><Edit2 size={16} /></button>}</div>{editing === key ? <textarea autoFocus defaultValue={String(item[key] || "")} onBlur={(event) => save(key, event.target.value)} className="mt-1 w-full rounded border p-2" /> : <p>{String(item[key] || fallback)}</p>}</section>;
  const saveAll = (form: HTMLFormElement) => { const fields = new FormData(form); dispatch({ type: "LEARNING_UPDATE", payload: { ...item, question: String(fields.get("question")), title: String(fields.get("question")), category: String(fields.get("category")), modelAnswer: String(fields.get("modelAnswer")), personalAnswer: String(fields.get("personalAnswer")), notes: String(fields.get("notes")), followUps: String(fields.get("followUps")), priority: String(fields.get("priority")) } }); setEditingAll(false); };
  return <article className="lc-panel rounded-xl bg-white">
    <button className="grid w-full grid-cols-[minmax(0,1fr)_auto_7rem_7rem_auto] items-center gap-4 p-4 text-left" aria-expanded={open} onClick={() => setOpen(!open)}>
      <span><span className="block font-semibold">{item.question}</span><span className="mt-1 block text-xs text-[#657777]">{item.category}</span></span>
      <Badge compact>{item.latestResult || "NOT STARTED"}</Badge>
      <span className="text-sm"><small className="block text-xs text-[#657777]">First solved</small>{displayDate(item.lastPractisedAt)}</span>
      <span className="text-sm"><small className="block text-xs text-[#657777]">Last reviewed</small>{displayDate(item.nextReviewAt)}</span>
      <ChevronDown size={18} aria-hidden="true" />
    </button>
    {open && <div className="px-5 pb-5">{section("Prepared Answer", "modelAnswer", "—")}{section("Personal Answer & Notes", "personalAnswer", "No notes yet.")}{java ? <><button className="mt-3 text-[#21675d] underline" aria-expanded={follow} onClick={() => setFollow(!follow)}>{follow ? "Hide follow-up questions" : "Show follow-up questions"}</button>{follow && <section><h3 className="mt-3 font-semibold">Follow-up Questions</h3><p>{item.followUps || "—"}</p></section>}</> : section("Follow-up Questions", "followUps", "—")}<div className="mt-4 flex flex-wrap gap-2">{(["PASS", "PARTIAL", "FAIL"] as const).map((result) => <button className="rounded border px-3 py-1" key={result} onClick={() => dispatch({ type: "LEARNING_UPDATE", payload: { id: item.id, latestResult: result, lastPractisedAt: new Date().toLocaleDateString("en-CA") } })}>{result}</button>)}<button onClick={() => setEditingAll(true)}>Edit question</button><button onClick={() => confirm("Delete this question?") && dispatch({ type: "DELETE", payload: { collection: "learningItems", id: item.id } })}>Delete question</button></div></div>}
    {editingAll && <dialog open className="lc-modal" aria-labelledby={`edit-${item.id}`}><form onSubmit={(event) => { event.preventDefault(); saveAll(event.currentTarget); }} className="grid gap-2"><div className="flex items-center justify-between"><h2 id={`edit-${item.id}`} className="text-lg font-bold">Edit question</h2><button type="button" aria-label="Close edit question" onClick={() => setEditingAll(false)}>×</button></div><label>Question<input name="question" defaultValue={item.question} required /></label><label>Topic<input name="category" defaultValue={item.category} /></label><label>Prepared answer<textarea name="modelAnswer" defaultValue={item.modelAnswer} /></label><label>Personal answer<textarea name="personalAnswer" defaultValue={item.personalAnswer} /></label><label>Notes<textarea name="notes" defaultValue={item.notes} /></label><label>Follow-up questions<textarea name="followUps" defaultValue={item.followUps} /></label><label>Priority<select name="priority" defaultValue={item.priority}><option>P0</option><option>P1</option><option>P2</option></select></label><div className="flex gap-2"><button className="rounded bg-[#21675d] px-3 py-1 text-white">Save</button><button type="button" onClick={() => setEditingAll(false)}>Cancel</button></div></form></dialog>}
  </article>;
}
