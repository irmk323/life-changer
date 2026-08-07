import {
  HashRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router";
import { Calendar, Home, BookOpen, Code2, Network, Brain, Pencil, ArrowUp, ArrowDown, AlarmClock, CalendarDays, CheckCircle2, ClipboardList, Flame, GripVertical, Plus, Sparkles, Target, TrendingUp, Trash2, Save } from "lucide-react";
import { useRef, useState, type ElementType, type FormEvent } from "react";
import {
  DomainProgress,
  PageHeader,
  QuestionRow,
  Badge,
  StatusPicker,
  STATUS_LABEL,
} from "./components/common";
import { Backup } from "./components/Backup";
import { useAppState } from "./app/AppStateProvider";
import { sampleData } from "./data/sampleData";
import {
  dueState,
  progress,
  streak,
  suggested,
  localDate,
  addDays,
} from "./services/readiness/calculations";
const nav = [
  ["/dashboard", "Dashboard", Home],
  ["/motivation", "Motivation", Brain],
  ["/weekly-plan", "Weekly Plan", CalendarDays],
  ["/calendar", "Calendar", Calendar],
  ["/behaviour", "Behaviour", BookOpen],
  ["/java", "Java Theory", BookOpen],
  ["/dsa", "DSA", Code2],
  ["/functional-coding", "Functional Coding", Code2],
  ["/system-design", "System Design", Network],
  ["/backup", "Backup", Save],
] as const;
const DOMAIN_LABELS: Record<string, string> = { DSA: "DSA", JAVA_THEORY: "Java Theory", BEHAVIOUR: "Behaviour", FUNCTIONAL_CODING: "Functional Coding", SYSTEM_DESIGN: "System Design", DDIA: "DDIA" };
const DDIA_CHAPTERS = [
  "Reliable, scalable, maintainable applications",
  "Data models and query languages",
  "Storage and retrieval",
  "Encoding and evolution",
  "Replication",
  "Partitioning",
  "Transactions",
  "Distributed systems",
  "Consistency and consensus",
  "Batch processing",
  "Stream processing",
  "The future of data systems",
];
function Shell({ children }: { children: React.ReactNode }) {
  const { dispatch } = useAppState();
  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#203334]">
      <aside className="fixed hidden h-screen w-60 bg-[#183d3a] p-4 text-[#e8f2ef] md:block">
        <h1 className="mb-2 text-xl font-bold">
          Life <span className="text-[#9bd0c3]">Changer</span>
        </h1>
        <p className="mb-8 text-xs text-[#a8c1bc]">Interview preparation</p>
        {nav.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `mb-1 flex items-center gap-2 rounded px-3 py-2 ${isActive ? "bg-[#2a5d57] font-semibold text-white" : "text-[#dce9e6] hover:bg-[#24514c] hover:text-white"}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        <button
          className="mt-auto w-full rounded border border-[#6f9790] px-3 py-2 text-sm text-[#dce9e6] hover:bg-[#24514c]"
          onClick={() =>
            confirm("Reset all data to the sample data?") &&
            dispatch({ type: "REPLACE", payload: sampleData() })
          }
        >
          Reset sample data
        </button>
      </aside>
      <main className="mx-auto max-w-[1500px] p-4 md:ml-60 md:p-8">{children}</main>
    </div>
  );
}
const domain = (state: any, name: string, key: string) => {
  const taskItems = key === "FUNCTIONAL_CODING" ? state.functionalTasks : key === "SYSTEM_DESIGN" ? state.systemDesignTasks : null;
  const items = key === "DSA" ? state.dsa : taskItems || state.learningItems.filter((x: any) => x.domain === key);
  const x = taskItems
    ? { done: taskItems.filter((item: any) => item.status === "INTERVIEW_READY").length, total: taskItems.length, percentage: taskItems.length ? Math.round(taskItems.filter((item: any) => item.status === "INTERVIEW_READY").length / taskItems.length * 100) : 0 }
    : progress(items, key === "DSA");
  return <DomainProgress name={name} {...x} />;
};
function Dashboard() {
  const { state, dispatch } = useAppState(),
    s = streak(state.activities),
    [text, setText] = useState(""),
    [edit, setEdit] = useState<any | null>(null);
  const newPriorityInput = useRef<HTMLInputElement>(null);
  const dueToday = state.learningItems.filter((x: any) => x.nextReviewAt === localDate()).length;
  const overdue = state.learningItems.filter((x: any) => x.nextReviewAt && x.nextReviewAt < localDate()).length;
  const readiness = progress(state.learningItems).percentage;
  const priorities = [
    ...state.priorities,
    ...suggested(state).map((x: any, index: number) => ({
      id: `auto-${x.id}`,
      title: x.title,
      dueDate: x.nextReviewAt,
      priority: "HIGH",
      completed: false,
      source: "AUTO",
      order: state.priorities.length + index,
      linkedDomain: x.domain,
    })),
  ].sort((a: any, b: any) => a.order - b.order);
  const upsert = (item: any) =>
    dispatch({ type: "UPSERT", payload: { collection: "priorities", item } });
  const manualPriority = (item: any) => ({ ...item, id: crypto.randomUUID(), source: "MANUAL", order: state.priorities.length });
  const persistPriority = (item: any) => {
    if (item.source === "AUTO") {
      dispatch({ type: "DISMISS_AUTO", payload: item.id.replace("auto-", "") });
      upsert(manualPriority(item));
      return;
    }
    upsert(item);
  };
  const movePriority = (item: any, direction: -1 | 1) => {
    const target = item.source === "AUTO" ? manualPriority(item) : item;
    if (item.source === "AUTO") {
      dispatch({ type: "DISMISS_AUTO", payload: item.id.replace("auto-", "") });
      upsert(target);
    }
    dispatch({ type: "PRIORITY_REORDER", payload: { id: target.id, direction } });
  };
  const priorityDomain = (p: any) => {
    if (p.linkedDomain) return DOMAIN_LABELS[p.linkedDomain] || p.linkedDomain;
    const value = String(p.title).toLowerCase();
    if (value.includes("design") || value.includes("url")) return "System Design";
    if (value.includes("java")) return "Java Theory";
    if (value.includes("tree") || value.includes("array") || value.includes("dsa")) return "DSA";
    return "Focus";
  };
  const activityIcon = (domain: string) =>
    domain === "DSA" ? <Code2 size={15} /> : domain === "BEHAVIOUR" ? <Sparkles size={15} /> : <BookOpen size={15} />;
  const statCards: Array<{ label: string; value: string | number; Icon: ElementType; description: string }> = [
    { label: "Overall readiness", value: `${readiness}%`, Icon: Target, description: "Your interview preparation progress" },
    { label: "Reviews due today", value: dueToday, Icon: ClipboardList, description: dueToday ? "Keep the review loop moving" : "All caught up for today" },
    { label: "Overdue reviews", value: overdue, Icon: AlarmClock, description: overdue ? "Clear these first" : "Nothing is waiting" },
    { label: "Weekly sessions", value: state.activities.length, Icon: CalendarDays, description: "Goal: 6 focused sessions" },
    { label: "Retention", value: "Coming soon", Icon: TrendingUp, description: "Track this as you practise" },
    { label: "Study streak", value: `${s.current} days`, Icon: Flame, description: `Longest: ${s.longest} days` },
  ];
  return (
    <>
      <header className="dashboard-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Your daily command center to prepare for your next role.</p>
        </div>
        <button className="dashboard-primary" onClick={() => newPriorityInput.current?.focus()}>
          <Plus size={17} /> Add priority
        </button>
      </header>
      <div className="dashboard-stats">
        {statCards.map(({ label, value, Icon, description }) => (
          <section className="dashboard-stat" key={label}>
            <span className="dashboard-stat__icon"><Icon size={27} strokeWidth={1.7} /></span>
            <div>
              <p>{label}</p>
              <strong>{value}</strong>
              <small>{description}</small>
            </div>
          </section>
        ))}
      </div>
      <div className="dashboard-main-grid">
        <section className="dashboard-panel priority-panel">
          <div className="dashboard-panel__heading">
            <div>
              <h2>Today’s priorities</h2>
              <p>Focus on what moves the needle. Reorder and edit as needed.</p>
            </div>
            <span className="dashboard-panel__hint"><Sparkles size={15} /> Auto-suggested</span>
          </div>
          {priorities.map((p: any) =>
            edit?.id === p.id ? (
              <form
                className="flex flex-wrap gap-2 border-t py-2"
                key={p.id}
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  persistPriority({
                    ...p,
                    title: String(f.get("title")),
                    dueDate: String(f.get("dueDate")),
                    priority: String(f.get("priority")),
                    linkedDomain: String(f.get("linkedDomain")),
                  });
                  setEdit(null);
                }}
              >
                <input name="title" defaultValue={p.title} />
                <input name="dueDate" type="date" defaultValue={p.dueDate} />
                <select name="priority" defaultValue={p.priority}>
                  <option>HIGH</option>
                  <option>MEDIUM</option>
                  <option>LOW</option>
                </select>
                <select name="linkedDomain" defaultValue={p.linkedDomain || Object.keys(DOMAIN_LABELS)[0]}>
                  {Object.entries(DOMAIN_LABELS).map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
                <button>Save</button>
                <button type="button" onClick={() => setEdit(null)}>
                  Cancel
                </button>
                <button
                  className="text-[#923d36]"
                  type="button"
                    onClick={() => {
                      if (confirm(`Delete ${p.title}?`)) {
                      if (p.source === "AUTO") {
                        dispatch({ type: "DISMISS_AUTO", payload: p.id.replace("auto-", "") });
                      } else {
                        dispatch({ type: "DELETE", payload: { collection: "priorities", id: p.id } });
                      }
                      setEdit(null);
                    }
                  }}
                >
                  Delete task
                </button>
              </form>
            ) : (
              <div className={`priority-row ${p.completed ? "priority-row--completed" : ""}`} key={p.id}>
                <input
                  type="checkbox"
                  checked={p.completed}
                  onChange={(e) => persistPriority({ ...p, completed: e.target.checked })}
                />
                <span className="priority-row__title">
                  {p.title}
                </span>
                <span className="priority-row__date"><Calendar size={16} /> {p.dueDate === localDate() ? "Today" : p.dueDate}</span>
                <span className="priority-row__domain">{priorityDomain(p)}</span>
                <Badge>{p.priority}</Badge>
                <button className="icon-button" aria-label={`Edit ${p.title}`} title="Edit" onClick={() => setEdit(p)}><Pencil size={15} /></button>
                <span className="priority-row__move">
                  <button className="icon-button" aria-label={`Move ${p.title} up`} title="Move up" onClick={() => movePriority(p, -1)}><ArrowUp size={14} /></button>
                  <button className="icon-button" aria-label={`Move ${p.title} down`} title="Move down" onClick={() => movePriority(p, 1)}><ArrowDown size={14} /></button>
                  <GripVertical size={16} aria-hidden="true" />
                </span>
              </div>
            ),
          )}
          <form
            className="dashboard-add-priority"
            onSubmit={(e) => {
              e.preventDefault();
              if (text) {
                const linkedDomain = String(new FormData(e.currentTarget).get("linkedDomain"));
                upsert({
                  id: crypto.randomUUID(), title: text, dueDate: localDate(),
                  priority: "MEDIUM", completed: false, source: "MANUAL",
                  order: state.priorities.length,
                  linkedDomain,
                });
                setText("");
              }
            }}
          >
            <input ref={newPriorityInput} value={text} onChange={(e) => setText(e.target.value)} className="flex-1 rounded border p-2" aria-label="New priority" placeholder="Add a priority" />
            <select name="linkedDomain" defaultValue={Object.keys(DOMAIN_LABELS)[0]} aria-label="Category">
              {Object.entries(DOMAIN_LABELS).map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
            <button className="dashboard-primary"><Plus size={16} /> Add priority</button>
          </form>
        </section>
        <section className="dashboard-panel domain-panel">
          <div className="dashboard-panel__heading">
            <div><h2>Domain progress</h2><p>Your progress by key interview domains.</p></div>
          </div>
          {[
            ["Behaviour", "BEHAVIOUR"],
            ["Java Theory", "JAVA_THEORY"],
            ["DSA", "DSA"],
            ["Functional Coding", "FUNCTIONAL_CODING"],
            ["DDIA", "DDIA"],
            ["Hello Interview", "SYSTEM_DESIGN"],
          ].map(([label, x]) => {
            const taskItems = x === "FUNCTIONAL_CODING" ? state.functionalTasks : x === "SYSTEM_DESIGN" ? state.systemDesignTasks : null;
            const ddiaDone = DDIA_CHAPTERS.filter((_, index) => state.ddiaChapters.find((c: any) => c.id === `CHAPTER_${index + 1}`)?.status === "DONE").length;
            const p = x === "DDIA"
              ? { done: ddiaDone, total: DDIA_CHAPTERS.length, percentage: Math.round((ddiaDone / DDIA_CHAPTERS.length) * 100) }
              : taskItems
                ? { done: taskItems.filter((item: any) => item.status === "INTERVIEW_READY").length, total: taskItems.length, percentage: taskItems.length ? Math.round(taskItems.filter((item: any) => item.status === "INTERVIEW_READY").length / taskItems.length * 100) : 0 }
                : progress(x === "DSA" ? state.dsa : state.learningItems.filter((i: any) => i.domain === x), x === "DSA");
            return (
              <div className="domain-progress-row" key={x}>
                <div>
                  <span>{label}</span>
                  <strong>{p.percentage}%</strong>
                </div>
                <div className="mt-1 h-2 rounded bg-[#d9e3e0]">
                  <div
                    className="h-2 rounded bg-[#21675d]"
                    style={{ width: `${p.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          <Link to="/behaviour" className="dashboard-secondary">View all domains</Link>
        </section>
      </div>
      <section className="dashboard-panel dashboard-activity">
        <div className="dashboard-panel__heading"><div><h2>Recent activity</h2><p>Latest actions and results across your preparation.</p></div></div>
        {state.activities.length === 0 ? (
          <p className="text-[#657777]">No activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-wide text-[#657777]">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Domain</th>
                  <th className="p-2">Item</th>
                  <th className="p-2">Result</th>
                  <th className="p-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {state.activities
                  .slice()
                  .sort((a: any, b: any) => b.date.localeCompare(a.date))
                  .slice(0, 5)
                  .map((activity: any) => (
                    <tr key={activity.id}>
                      <td className="dashboard-activity__date"><span>{activityIcon(activity.domain)}</span>{activity.date}</td>
                      <td className="p-2">
                        {activity.domain.replaceAll("_", " ")}
                      </td>
                      <td className="p-2">{activity.label}</td>
                      <td className="p-2">
                        <span className="dashboard-result"><CheckCircle2 size={15} /><Badge>{activity.result}</Badge></span>
                      </td>
                      <td className="p-2">
                        {activity.durationMinutes
                          ? `${activity.durationMinutes} min`
                          : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        <Link to="/calendar" className="dashboard-secondary">View all activity</Link>
      </section>
    </>
  );
}
function Questions({ kind }: { kind: "BEHAVIOUR" | "JAVA_THEORY" | "DDIA" }) {
  const { state, dispatch } = useAppState();
  const { chapterId } = useParams();
  const nav = useNavigate();
  const [tab, setTab] = useState("CORE_JAVA"),
    [text, setText] = useState("");
  const items = state.learningItems.filter(
    (x: any) =>
      x.domain === kind &&
      (kind !== "JAVA_THEORY" || x.track === tab) &&
      (kind !== "DDIA" || x.track === `CHAPTER_${chapterId || "1"}`),
  );
  const title =
    kind === "JAVA_THEORY"
      ? "Java Theory"
      : kind === "DDIA"
        ? "DDIA"
        : "Behaviour";
  const chapterKey = kind === "DDIA" ? `CHAPTER_${chapterId || "1"}` : null;
  const chapterRecord = chapterKey ? state.ddiaChapters.find((c: any) => c.id === chapterKey) : null;
  const saveChapter = (patch: any) => {
    if (!chapterKey) return;
    dispatch({ type: "UPSERT", payload: { collection: "ddiaChapters", item: { id: chapterKey, status: "NOT_STARTED", notes: "", ...chapterRecord, ...patch } } });
  };
  return (
    <>
      {kind === "DDIA" && <button className="mb-3" onClick={() => nav("/system-design")}>← Back</button>}
      <PageHeader title={title} />
      {kind !== "DDIA" && domain(state, title, kind)}
      {kind === "DDIA" && (
        <StatusPicker
          title="Have you read this chapter?"
          value={chapterRecord?.status || "NOT_STARTED"}
          options={["NOT_STARTED", "IN_PROGRESS", "DONE"]}
          onChange={(status) => saveChapter({ status })}
        />
      )}
      {kind === "JAVA_THEORY" && (
        <div className="app-tabs mb-3" role="tablist" aria-label="Java topic">
          <button className={`app-tab ${tab === "CORE_JAVA" ? "app-tab--active" : ""}`} role="tab" aria-selected={tab === "CORE_JAVA"} onClick={() => setTab("CORE_JAVA")}>Core Java</button>
          <button className={`app-tab ${tab === "SPRING_BOOT" ? "app-tab--active" : ""}`} role="tab" aria-selected={tab === "SPRING_BOOT"} onClick={() => setTab("SPRING_BOOT")}>Spring Boot</button>
        </div>
      )}
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (text) {
            dispatch({
              type: "UPSERT",
              payload: {
                collection: "learningItems",
                item: {
                  id: crypto.randomUUID(),
                  domain: kind,
                  track:
                    kind === "JAVA_THEORY"
                      ? tab
                      : kind === "DDIA"
                        ? `CHAPTER_${chapterId || "1"}`
                        : "BEHAVIOUR",
                  title: text,
                  question: text,
                  category: "General",
                  priority: "P1",
                  modelAnswer: "",
                  personalAnswer: "",
                  notes: "",
                  followUps: "",
                  latestResult: null,
                  lastPractisedAt: null,
                  nextReviewAt: null,
                  keyPoints: [],
                },
              },
            });
            setText("");
          }
        }}
      >
        <input
          required
          className="flex-1 rounded border p-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="New interview question"
        />
        <button className="rounded bg-teal-700 px-3 text-white">
          Add question
        </button>
      </form>
      <div className="question-list grid gap-0">
        {items.map((x: any) => (
          <QuestionRow key={x.id} item={x} java={kind === "JAVA_THEORY"} />
        ))}
      </div>
      {kind === "DDIA" && (
        <section className="lc-panel mt-4 rounded-xl border bg-white p-4">
          <h2 className="font-bold">Learning notes</h2>
          <p className="mb-2 text-sm text-[#657777]">Key takeaways and things to revisit from this chapter.</p>
          <textarea
            className="min-h-40 w-full rounded border p-2"
            defaultValue={chapterRecord?.notes || ""}
            placeholder="What stood out in this chapter?"
            onBlur={(e) => saveChapter({ notes: e.target.value })}
          />
        </section>
      )}
    </>
  );
}
function FirstSolvedCell({ p, dispatch }: { p: any; dispatch: any }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const markSolved = (value: string) => {
    if (!value) return;
    const reviews =
      p.reviews && p.reviews.length > 0
        ? p.reviews
        : (["D1", "D4", "D17"] as const).map((stage) => ({
            id: `${p.id}-${stage.toLowerCase()}`,
            stage,
            dueAt: addDays(stage === "D1" ? 1 : stage === "D4" ? 4 : 17, value),
            completed: false,
            completedAt: null,
            note: "",
          }));
    dispatch({ type: "DSA_UPDATE", payload: { ...p, firstSolvedAt: value, reviews } });
  };
  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    if (typeof (el as any).showPicker === "function") (el as any).showPicker();
    else el.focus();
  };
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        className="table-link link-button whitespace-nowrap text-sm"
        onClick={openPicker}
      >
        {p.firstSolvedAt || "Mark as solved"}
      </button>
      <input
        ref={inputRef}
        type="date"
        value={p.firstSolvedAt || ""}
        onChange={(e) => markSolved(e.target.value)}
        className="sr-only"
        aria-label="First solved date"
      />
    </div>
  );
}
function Dsa() {
  const { state, dispatch } = useAppState();
  return (
    <>
      <PageHeader title="DSA" />
      {domain(state, "DSA", "DSA")}
      <div className="lc-panel rounded-xl border bg-white p-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] table-fixed text-left">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[9rem]" />
              <col />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th>Problem</th>
                <th className="whitespace-nowrap pr-8 text-right">First solved</th>
                <th>D+1</th>
                <th>D+4</th>
                <th>D+17</th>
              </tr>
            </thead>
            <tbody>
              {state.dsa.map((p: any) => (
                <tr className="border-t" key={p.id}>
                  <td>
                    <Link className="table-link" to={`/dsa/${p.id}`}>
                      {p.title}
                    </Link>
                    <a
                      className="ml-2 text-sm underline"
                      href={p.leetcodeUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      LeetCode ↗
                    </a>
                  </td>
                  <td className="whitespace-nowrap pr-8 text-right">
                    <FirstSolvedCell p={p} dispatch={dispatch} />
                  </td>
                  {(["D1", "D4", "D17"] as const).map((stage) => {
                    const r = p.reviews.find((x: any) => x.stage === stage);
                    if (!r) {
                      return <td className="p-2 text-[#657777]" key={stage}>—</td>;
                    }
                    const [stateLabel, label] = dueState(r.dueAt, r.completed);
                    return (
                      <td
                        key={stage}
                        className={`dsa-review dsa-review--${stateLabel.toLowerCase()}`}
                      >
                        <label>
                          <input
                            type="checkbox"
                            checked={r.completed}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              dispatch({
                                type: "DSA_UPDATE",
                                payload: {
                                  ...p,
                                  reviews: p.reviews.map((x: any) =>
                                    x.stage === stage
                                      ? {
                                          ...x,
                                          completed: e.target.checked,
                                          completedAt: e.target.checked
                                            ? localDate()
                                            : null,
                                        }
                                      : x,
                                  ),
                                },
                              })
                            }
                          />{" "}
                          {stage}
                        </label>
                        <small className="block">
                          {r.dueAt} · {label}
                        </small>
                        <Link
                          className="table-link text-sm"
                          to={`/dsa/${p.id}`}
                        >
                          Notes
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
function DsaDetail() {
  const { id = "" } = useParams(),
    { state, dispatch } = useAppState(),
    nav = useNavigate();
  const p = state.dsa.find((x: any) => x.id === id);
  if (!p) return <Navigate to="/dsa" />;
  const save = (field: string, value: string) =>
    dispatch({ type: "DSA_UPDATE", payload: { ...p, [field]: value } });
  return (
    <>
      <PageHeader title={p.title}>
        <button onClick={() => nav("/dsa")}>← Back</button>
      </PageHeader>
      <a
        href={p.leetcodeUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Open in LeetCode ↗
      </a>
      <section className="mt-4 rounded-xl border bg-white p-4">
        <label>
          Initial solve notes
          <textarea
            defaultValue={p.initialNotes}
            onBlur={(e) => save("initialNotes", e.target.value)}
            className="mt-1 w-full rounded border p-2"
          />
        </label>
        {p.reviews.map((r: any) => (
          <label className="mt-3 block" key={r.stage}>
            {r.stage} review note
            <textarea
              defaultValue={r.note}
              onBlur={(e) =>
                dispatch({
                  type: "DSA_UPDATE",
                  payload: {
                    ...p,
                    reviews: p.reviews.map((x: any) =>
                      x.stage === r.stage ? { ...x, note: e.target.value } : x,
                    ),
                  },
                })
              }
              className="mt-1 w-full rounded border p-2"
            />
          </label>
        ))}
        <label className="mt-3 block">
          General notes
          <textarea
            defaultValue={p.generalNotes}
            onBlur={(e) => save("generalNotes", e.target.value)}
            className="mt-1 w-full rounded border p-2"
          />
        </label>
      </section>
    </>
  );
}
function WeeklyPlan() {
  const { state, dispatch } = useAppState();
  const weekStart = (date: string) => {
    const value = new Date(`${date}T12:00:00`);
    value.setDate(value.getDate() - ((value.getDay() + 6) % 7));
    return value.toLocaleDateString("en-CA");
  };
  const [activeWeek, setActiveWeek] = useState(() => weekStart(localDate()));
  const [editor, setEditor] = useState<any | null>(null);
  const days = Array.from({ length: 7 }, (_, index) => addDays(index, activeWeek));
  const weekItems = state.weeklyPlanItems.filter((item: any) => item.date >= activeWeek && item.date <= days[6]);
  const completed = weekItems.filter((item: any) => item.status === "INTERVIEW_READY").length;
  const plannedMinutes = weekItems.reduce((total: number, item: any) => total + Number(item.plannedMinutes || 0), 0);
  const domainLabels = DOMAIN_LABELS;
  const openNew = (date = activeWeek, planType = "MAIN") => setEditor({ id: "", date, planType, domain: "DSA", title: "", plannedMinutes: 60, status: "NOT_STARTED", notes: "" });
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    dispatch({ type: "UPSERT", payload: { collection: "weeklyPlanItems", item: { ...editor, id: editor.id || crypto.randomUUID(), date: String(values.get("date")), planType: String(values.get("planType")), domain: String(values.get("domain")), title: String(values.get("title")).trim(), plannedMinutes: Number(values.get("plannedMinutes")), status: editor.status || "NOT_STARTED", notes: String(values.get("notes")).trim() } } });
    setEditor(null);
  };
  const formatDay = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return <>
    <PageHeader title="Weekly Plan"><button className="icon-button bg-[#21675d] text-white" aria-label="Add study item" title="Add study item" onClick={() => openNew()}><Plus size={18} /></button></PageHeader>
    <p className="mb-4 text-slate-600">Plan focused study blocks for the week, then update or remove them as your priorities change.</p>
    <section className="lc-panel mb-4 rounded-xl border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><button onClick={() => setActiveWeek(addDays(-7, activeWeek))}>← Previous</button><strong>{formatDay(activeWeek)} – {formatDay(days[6])}</strong><button onClick={() => setActiveWeek(addDays(7, activeWeek))}>Next →</button></div>
        <button onClick={() => setActiveWeek(weekStart(localDate()))}>This week</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-[#f0f5f3] p-3"><span className="block text-sm text-[#657777]">Planned sessions</span><strong className="text-2xl">{weekItems.length}</strong></div>
        <div className="rounded-lg bg-[#f0f5f3] p-3"><span className="block text-sm text-[#657777]">Planned time</span><strong className="text-2xl">{plannedMinutes ? `${Math.floor(plannedMinutes / 60)}h ${plannedMinutes % 60}m` : "0h"}</strong></div>
        <div className="rounded-lg bg-[#f0f5f3] p-3"><span className="block text-sm text-[#657777]">Completed</span><strong className="text-2xl">{completed} / {weekItems.length}</strong></div>
      </div>
    </section>
    {editor && <section className="lc-panel mb-4 rounded-xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">{editor.id ? "Edit study item" : "Add study item"}</h2><button onClick={() => setEditor(null)}>Cancel</button></div>
      <form key={editor.id || editor.date} className="grid gap-3 md:grid-cols-2" onSubmit={save}>
        <label className="grid gap-1 font-semibold">Date<input name="date" type="date" defaultValue={editor.date} required /></label>
        <label className="grid gap-1 font-semibold">Plan type<select name="planType" value={editor.planType} onChange={(event) => setEditor({ ...editor, planType: event.target.value })}><option value="MAIN">Main subject</option><option value="SUB">Secondary subject</option></select></label>
        <label className="grid gap-1 font-semibold">Study area<select name="domain" defaultValue={editor.domain}>{Object.entries(domainLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label className="grid gap-1 font-semibold md:col-span-2">Study item<input name="title" defaultValue={editor.title} placeholder="e.g. Solve two sliding-window problems" required /></label>
        <label className="grid gap-1 font-semibold">Planned minutes<input name="plannedMinutes" type="number" min="5" step="5" defaultValue={editor.plannedMinutes} required /></label>
        <label className="grid gap-1 font-semibold md:col-span-2">Note <span className="font-normal text-[#657777]">(optional)</span><textarea name="notes" defaultValue={editor.notes} placeholder="What do you want to focus on?" /></label>
        <div className="flex gap-2 md:col-span-2"><button className="bg-[#21675d] text-white">Save item</button><button type="button" onClick={() => setEditor(null)}>Cancel</button></div>
      </form>
    </section>}
    <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
      {days.map((date) => {
        const items = weekItems.filter((item: any) => item.date === date);
        const mainItems = items.filter((item: any) => item.planType !== "SUB");
        const subItems = items.filter((item: any) => item.planType === "SUB");
        return <article className="lc-panel min-w-0 rounded-xl border bg-white p-3" key={date}>
          <h2 className="mb-3 font-bold">{formatDay(date)}</h2>
          <div className="grid gap-3">
            <section><div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-semibold uppercase tracking-wide text-[#657777]">Main subject</h3><button className="icon-button" aria-label={`Add main subject for ${date}`} title="Add main subject" onClick={() => openNew(date, "MAIN")}><Plus size={15} /></button></div>
              <div className="grid gap-2">{mainItems.map((item: any) => <div className={`rounded-lg border border-[#d9e3e0] p-3 ${item.status === "INTERVIEW_READY" ? "bg-[#f1f3f2] text-[#657777]" : ""}`} key={item.id}>
            <div className="flex items-start justify-between gap-2"><span className="text-xs font-semibold text-[#21675d]">{domainLabels[item.domain]}</span><input aria-label={`Mark ${item.title} as completed`} type="checkbox" checked={item.status === "INTERVIEW_READY"} onChange={(event) => dispatch({ type: "UPSERT", payload: { collection: "weeklyPlanItems", item: { ...item, status: event.target.checked ? "INTERVIEW_READY" : "NOT_STARTED" } } })} /></div>
            <h3 className={`mt-2 font-semibold ${item.status === "INTERVIEW_READY" ? "line-through" : ""}`}>{item.title}</h3><p className="mt-1 text-sm text-[#657777]">{item.plannedMinutes} min</p>{item.notes && <p className="mt-2 text-sm text-[#657777]">{item.notes}</p>}
            <div className="mt-3 flex gap-2"><button className="icon-button" aria-label={`Edit ${item.title}`} title="Edit" onClick={() => setEditor(item)}><Pencil size={15} /></button><button className="icon-button text-[#923d36]" aria-label={`Delete ${item.title}`} title="Delete" onClick={() => confirm("Delete this study item?") && dispatch({ type: "DELETE", payload: { collection: "weeklyPlanItems", id: item.id } })}><Trash2 size={15} /></button></div>
          </div>)}{mainItems.length === 0 && <p className="rounded-lg bg-[#f0f5f3] p-3 text-sm text-[#657777]">No main subject planned.</p>}</div></section>
            <section><div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-semibold uppercase tracking-wide text-[#657777]">Secondary subjects</h3><button className="icon-button" aria-label={`Add secondary subject for ${date}`} title="Add secondary subject" onClick={() => openNew(date, "SUB")}><Plus size={15} /></button></div>
              <div className="grid gap-2">{subItems.map((item: any) => <div className={`rounded-lg border border-[#d9e3e0] p-3 ${item.status === "INTERVIEW_READY" ? "bg-[#f1f3f2] text-[#657777]" : ""}`} key={item.id}>
                <div className="flex items-start justify-between gap-2"><span className="text-xs font-semibold text-[#21675d]">{domainLabels[item.domain]}</span><input aria-label={`Mark ${item.title} as completed`} type="checkbox" checked={item.status === "INTERVIEW_READY"} onChange={(event) => dispatch({ type: "UPSERT", payload: { collection: "weeklyPlanItems", item: { ...item, status: event.target.checked ? "INTERVIEW_READY" : "NOT_STARTED" } } })} /></div>
                <h3 className={`mt-2 font-semibold ${item.status === "INTERVIEW_READY" ? "line-through" : ""}`}>{item.title}</h3><p className="mt-1 text-sm text-[#657777]">{item.plannedMinutes} min</p>{item.notes && <p className="mt-2 text-sm text-[#657777]">{item.notes}</p>}
                <div className="mt-3 flex gap-2"><button className="icon-button" aria-label={`Edit ${item.title}`} title="Edit" onClick={() => setEditor(item)}><Pencil size={15} /></button><button className="icon-button text-[#923d36]" aria-label={`Delete ${item.title}`} title="Delete" onClick={() => confirm("Delete this study item?") && dispatch({ type: "DELETE", payload: { collection: "weeklyPlanItems", id: item.id } })}><Trash2 size={15} /></button></div>
              </div>)}{subItems.length === 0 && <p className="rounded-lg bg-[#f0f5f3] p-3 text-sm text-[#657777]">No secondary subjects planned.</p>}</div></section>
          </div>
        </article>;
      })}
    </section>
  </>;
}
function CalendarPage() {
  const { state, dispatch } = useAppState(),
    [day, setDay] = useState(localDate()),
    [month, setMonth] = useState(() => new Date());
  const log = state.dailyLogs.find((x: any) => x.date === day),
    first = new Date(month.getFullYear(), month.getMonth(), 1),
    start = new Date(first);
  start.setDate(1 - first.getDay());
  const colours: any = {
    DSA: "bg-blue-600",
    SYSTEM_DESIGN: "bg-red-600",
    BEHAVIOUR: "bg-purple-600",
    JAVA_THEORY: "bg-green-600",
    FUNCTIONAL_CODING: "bg-orange-500",
  };
  return (
    <>
      <PageHeader title="Calendar" />
      <p className="mb-3 flex flex-wrap gap-3 text-sm">
        <span>
          <i className="inline-block size-2 rounded-full bg-blue-600" /> DSA
        </span>
        <span>
          <i className="inline-block size-2 rounded-full bg-red-600" /> System
          Design
        </span>
        <span>
          <i className="inline-block size-2 rounded-full bg-purple-600" />{" "}
          Behaviour
        </span>
        <span>
          <i className="inline-block size-2 rounded-full bg-green-600" /> Java
          Theory
        </span>
        <span>
          <i className="inline-block size-2 rounded-full bg-orange-500" />{" "}
          Functional Coding
        </span>
      </p>
      <section className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex justify-between">
          <button
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
          >
            Previous
          </button>
          <strong>
            {month.toLocaleString("en-GB", { month: "long", year: "numeric" })}
          </strong>
          <button
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
          >
            Next
          </button>
        </div>
        <div className="grid grid-cols-7 text-center text-xs text-slate-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 42 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const iso = d.toLocaleDateString("en-CA"),
              activityCount = state.activities.filter((a: any) => a.date === iso).length,
              domains = [
                ...new Set(
                  state.activities
                    .filter((a: any) => a.date === iso)
                    .map((a: any) => a.domain),
                ),
              ];
            return (
              <button
                key={iso}
                onClick={() => setDay(iso)}
                className={`calendar-day min-h-16 border p-1 text-left ${iso === day ? "bg-teal-50" : ""} ${d.getMonth() !== month.getMonth() ? "text-slate-400" : ""}`}
              >
                <time>{d.getDate()}</time>
                {activityCount > 0 && <span className="mt-1 block text-[10px] text-[#657777]">{activityCount} {activityCount === 1 ? "activity" : "activities"}</span>}
                <span className="mt-1 flex gap-1">
                  {domains.map((x: any) => (
                    <i
                      key={x}
                      title={`${x} activity`}
                      aria-label={`${x} activity`}
                      className={`inline-block size-2 rounded-full ${colours[x]}`}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <section className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="lc-panel rounded-xl border bg-white p-4">
          <h2 className="font-bold">{day} activities</h2>
          {state.activities.filter((x: any) => x.date === day).length === 0 ? (
            <p className="mt-3 text-[#657777]">
              No learning activity recorded.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-wide text-[#657777]">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Domain</th>
                    <th className="p-2">Item</th>
                    <th className="p-2">Result</th>
                    <th className="p-2">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {state.activities
                    .filter((x: any) => x.date === day)
                    .map((x: any) => (
                      <tr className="border-b" key={x.id}>
                        <td className="p-2">{x.date}</td>
                        <td className="p-2">{x.domain.replaceAll("_", " ")}</td>
                        <td className="p-2">{x.label}</td>
                        <td className="p-2">
                          <Badge>{x.result}</Badge>
                        </td>
                        <td className="p-2">
                          {x.durationMinutes ? `${x.durationMinutes} min` : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="lc-panel rounded-xl border bg-white p-4">
          <label className="block font-semibold">
            Daily note
            <textarea
              defaultValue={log?.note || ""}
              placeholder="What felt clear? What needs repair?"
              onBlur={(e) =>
                dispatch({
                  type: "DAILY_LOG_SAVE",
                  payload: {
                    id: `daily-log-${day}`,
                    date: day,
                    note: e.target.value,
                  },
                })
              }
              className="mt-2 min-h-36 w-full rounded border p-2"
            />
          </label>
          <p className="mt-2 text-sm text-[#657777]">
            Saved automatically when you leave the field.
          </p>
        </div>
      </section>
    </>
  );
}
function SystemDesignPage() {
  const { state } = useAppState();
  const nav = useNavigate();
  const chapters = DDIA_CHAPTERS;
  const chaptersDone = chapters.filter((_, index) => state.ddiaChapters.find((c: any) => c.id === `CHAPTER_${index + 1}`)?.status === "DONE").length;
  return (
    <>
      <PageHeader title="System Design" />
      <DomainProgress name="DDIA" done={chaptersDone} total={chapters.length} />
      <nav className="app-tabs mb-4" aria-label="System Design tabs">
        <span className="app-tab app-tab--active" aria-current="page">DDIA</span>
        <Link className="app-tab" to="/system-design/hello-interview">Hello Interview</Link>
      </nav>
      <section className="lc-panel overflow-x-auto rounded-xl border bg-white p-4">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b text-xs uppercase tracking-wide text-[#657777]">
            <tr>
              <th className="p-2">Chapter</th>
              <th className="p-2">Title</th>
              <th className="p-2">Questions</th>
              <th className="p-2">Passed</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {chapters.map((title, index) => {
              const chapter = index + 1;
              const questions = state.learningItems.filter(
                (x: any) =>
                  x.domain === "DDIA" && x.track === `CHAPTER_${chapter}`,
              );
              const passed = questions.filter(
                (x: any) => x.latestResult === "PASS",
              ).length;
              const chapterStatus = state.ddiaChapters.find((c: any) => c.id === `CHAPTER_${chapter}`)?.status || "NOT_STARTED";
              return (
                <tr className="clickable-row border-b" key={chapter} tabIndex={0} role="link" onClick={() => nav(`/system-design/ddia/${chapter}`)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nav(`/system-design/ddia/${chapter}`); } }}>
                  <td className="p-2 font-semibold">{chapter}</td>
                  <td className="p-2">{title}</td>
                  <td className="p-2">{questions.length}</td>
                  <td className="p-2">{passed}</td>
                  <td className="p-2">
                    <Badge>{STATUS_LABEL[chapterStatus] || chapterStatus}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
function HelloInterviewPage() {
  const { state } = useAppState();
  const nav = useNavigate();
  return (
    <>
      <PageHeader title="System Design" />
      {domain(state, "Hello Interview", "SYSTEM_DESIGN")}
      <nav className="app-tabs mb-4" aria-label="System Design tabs">
        <Link className="app-tab" to="/system-design">DDIA</Link>
        <span className="app-tab app-tab--active" aria-current="page">Hello Interview</span>
      </nav>
      <section className="lc-panel overflow-x-auto rounded-xl border bg-white p-4">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="border-b text-xs uppercase tracking-wide text-[#657777]">
            <tr>
              <th className="p-2">Title</th>
              <th className="p-2">Category</th>
              <th className="p-2">Attempts</th>
              <th className="p-2">Latest result</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {state.systemDesignTasks.map((task: any) => {
              const attempt = task.attempts.at(-1);
              return (
                <tr className="clickable-row border-b" key={task.id} tabIndex={0} role="link" onClick={() => nav(`/system-design/hello-interview/${task.id}`)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nav(`/system-design/hello-interview/${task.id}`); } }}>
                  <td className="p-2 font-semibold">{task.title}</td>
                  <td className="p-2">{task.category}</td>
                  <td className="p-2">{task.attempts.length}</td>
                  <td className="p-2">
                    {attempt ? <Badge>{attempt.result}</Badge> : "—"}
                  </td>
                  <td className="p-2">
                    <Badge>{STATUS_LABEL[task.status] || task.status}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
function Tasks({ system = false }: { system?: boolean }) {
  const { state, dispatch } = useAppState(),
    nav = useNavigate(),
    params = useParams(),
    collection = system ? "systemDesignTasks" : "functionalTasks",
    tasks = system ? state.systemDesignTasks : state.functionalTasks,
    id = params.id;
  const [title, setTitle] = useState(""),
    [editAttempt, setEditAttempt] = useState<string | null>(null);
  const task = tasks.find((x: any) => x.id === id);
  if (id) {
    if (!task)
      return (
        <Navigate
          to={system ? "/system-design/hello-interview" : "/functional-coding"}
        />
      );
    const update = (patch: any) =>
      dispatch({
        type: "UPSERT",
        payload: { collection, item: { ...task, ...patch } },
      });
    const detailFields = system
      ? [
          ["statement", "Problem statement"], ["functional", "Functional requirements"],
          ["nonFunctional", "Non-functional requirements"], ["capacity", "Capacity estimates"],
          ["api", "API design"], ["dataModel", "Data model"], ["highLevel", "High-level design"],
          ["scaling", "Scaling"], ["consistency", "Consistency"], ["reliability", "Reliability"],
          ["observability", "Observability"], ["security", "Security"], ["tradeoffs", "Trade-offs"],
          ["bottlenecks", "Bottlenecks"], ["notes", "Notes"],
        ]
      : [
          ["statement", "Problem statement"], ["requirements", "Functional requirements"],
          ["nonFunctional", "Non-functional requirements"], ["entities", "Entities"],
          ["services", "Services"], ["repositories", "Repositories"], ["api", "API design"],
          ["validation", "Validation"], ["errors", "Error handling"], ["tests", "Test cases"],
          ["notes", "Design notes"], ["link", "Repository link"], ["improvement", "Next improvement"],
        ];
    if (system) return <SystemDesignDetail task={task} update={update} learningItems={state.learningItems} dispatch={dispatch} onDelete={() => confirm("Delete this task?") && dispatch({ type: "DELETE", payload: { collection, id: task.id } })} onBack={() => nav("/system-design/hello-interview")} />;
    return (
      <>
        <PageHeader title={task.title}>
          <button
            onClick={() =>
              nav(
                system
                  ? "/system-design/hello-interview"
                  : "/functional-coding",
              )
            }
          >
            ← Back
          </button>
        </PageHeader>
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
          <div className="lc-panel rounded-xl border bg-white p-5">
            <p className="mb-4 text-sm text-[#657777]">
              Edit the exercise context and design notes. Changes save when you
              leave a field.
            </p>
            <label className="grid gap-1 font-semibold">
              Category
              <input
                defaultValue={task.category}
                onBlur={(e) => update({ category: e.target.value })}
              />
            </label>
            {!system && <label className="mt-4 grid gap-1 font-semibold">Tags<input defaultValue={String(task.tags || "")} onBlur={(e) => update({ tags: e.target.value })} /></label>}
            {detailFields.map(([key, label]) => <label className="mt-4 grid gap-1 font-semibold" key={key}>{label}<textarea className="min-h-28 rounded border p-2" defaultValue={String(task[key] || "")} onBlur={(e) => update({ [key]: e.target.value })} /></label>)}
            <button
              className="mt-5 rounded border px-3 py-2 text-[#923d36]"
              onClick={() =>
                confirm("Delete this task?") &&
                dispatch({
                  type: "DELETE",
                  payload: { collection, id: task.id },
                })
              }
            >
              Delete task
            </button>
          </div>
          <aside className="lc-panel rounded-xl border bg-white p-5">
            <h2 className="font-bold">Attempt history</h2>
            <p className="mb-3 text-sm text-[#657777]">
              Keep a concise record of each practice run.
            </p>
            {task.attempts.map((a: any) =>
              editAttempt === a.id ? (
                <form
                  key={a.id}
                  className="my-2 flex flex-wrap gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    update({
                      attempts: task.attempts.map((x: any) =>
                        x.id === a.id
                          ? {
                              ...x,
                              date: String(f.get("date")),
                              duration: Number(f.get("duration")),
                              result: String(f.get("result")),
                              notes: String(f.get("notes")),
                            }
                          : x,
                      ),
                    });
                    setEditAttempt(null);
                  }}
                >
                  <input name="date" type="date" defaultValue={a.date} />
                  <input
                    name="duration"
                    type="number"
                    defaultValue={a.duration}
                  />
                  <select name="result" defaultValue={a.result}>
                    <option>PASS</option>
                    <option>PARTIAL</option>
                    <option>FAIL</option>
                  </select>
                  <input name="notes" defaultValue={a.notes} />
                  <button>Save</button>
                  <button type="button" onClick={() => setEditAttempt(null)}>
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="my-2 flex gap-2" key={a.id}>
                  <span className="flex-1">
                    {a.date} · {a.result} · {a.duration} min — {a.notes}
                  </span>
                  <button onClick={() => setEditAttempt(a.id)}>Edit</button>
                  <button
                    onClick={() =>
                      confirm("Delete this attempt?") &&
                      update({
                        attempts: task.attempts.filter(
                          (x: any) => x.id !== a.id,
                        ),
                      })
                    }
                  >
                    Delete
                  </button>
                </div>
              ),
            )}
            <button
              className="mt-2 rounded bg-[#21675d] px-3 py-2 text-white"
              onClick={() =>
                update({
                  attempts: [
                    ...task.attempts,
                    {
                      id: crypto.randomUUID(),
                      date: localDate(),
                      duration: 60,
                      result: "PARTIAL",
                      notes: "New attempt",
                    },
                  ],
                })
              }
            >
              Add attempt
            </button>
          </aside>
        </section>
      </>
    );
  }
  return (
    <>
      <PageHeader title={system ? "System Design" : "Functional Coding"} />
      {domain(
        state,
        system ? "System Design" : "Functional Coding",
        system ? "SYSTEM_DESIGN" : "FUNCTIONAL_CODING",
      )}
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (title) {
            const item = {
              id: crypto.randomUUID(),
              title,
              category: system ? "System design" : "Backend exercise",
              status: "NOT_STARTED",
              attempts: [],
              statement: "",
              notes: "",
            };
            dispatch({ type: "UPSERT", payload: { collection, item } });
            setTitle("");
          }
        }}
      >
        <input
          className="rounded border p-2"
          placeholder="New task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="rounded bg-teal-700 px-3 text-white">
          Add task
        </button>
      </form>
      <section className="task-table lc-panel overflow-x-auto rounded-xl border bg-white p-4">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b text-xs uppercase tracking-wide text-[#657777]">
            <tr><th className="p-2">Title</th><th className="p-2">Category</th><th className="p-2">Latest attempt</th><th className="p-2">Result</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr>
          </thead>
          <tbody>
            {tasks.map((x: any) => {
              const attempt = x.attempts.at(-1);
              const destination = `${system ? "/system-design/hello-interview" : "/functional-coding"}/${x.id}`;
              return <tr key={x.id}>
                <td className="p-2"><Link className="table-link font-semibold" to={destination}>{x.title}</Link></td>
                <td className="p-2">{x.category}</td>
                <td className="p-2">{attempt?.date || "—"}</td>
                <td className="p-2">{attempt ? <Badge>{attempt.result}</Badge> : "—"}</td>
                <td className="p-2"><Badge>{x.status}</Badge></td>
                <td className="p-2 whitespace-nowrap"><Link className="table-link mr-3" to={destination}>Edit</Link><button className="text-sm text-[#923d36]" onClick={() => confirm("Delete this task and all its attempts?") && dispatch({ type: "DELETE", payload: { collection, id: x.id } })}>Delete</button></td>
              </tr>;
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}

function SystemDesignDetail({ task, update, onDelete, onBack, learningItems, dispatch }: { task: any; update: (patch: any) => void; onDelete: () => void; onBack: () => void; learningItems: any[]; dispatch: any }) {
  const [questionText, setQuestionText] = useState("");
  const [attemptOpen, setAttemptOpen] = useState(false);
  const attempts = Array.isArray(task.attempts) ? task.attempts : [];
  const questions = learningItems.filter((x: any) => x.domain === "SYSTEM_DESIGN" && x.track === task.id);
  const addQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!questionText.trim()) return;
    dispatch({
      type: "UPSERT",
      payload: {
        collection: "learningItems",
        item: {
          id: crypto.randomUUID(), domain: "SYSTEM_DESIGN", track: task.id,
          title: questionText, question: questionText, category: task.category,
          priority: "P1", modelAnswer: "", personalAnswer: "", notes: "",
          followUps: "", latestResult: null, lastPractisedAt: null,
          nextReviewAt: null, keyPoints: [],
        },
      },
    });
    setQuestionText("");
  };
  const addAttempt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = String(form.get("result"));
    update({ attempts: [...attempts, { id: crypto.randomUUID(), date: String(form.get("date")), duration: Number(form.get("duration")), result, notes: String(form.get("notes")) }], status: result === "PASS" ? "INTERVIEW_READY" : "IN_PROGRESS" });
    setAttemptOpen(false);
  };
  return <>
    <button className="mb-3" onClick={onBack}>← Back to exercises</button>
    <PageHeader title={task.title} />
    <p className="mb-5 text-sm text-[#657777]">{task.category} · Capture what you learned, questions to revisit, and every practice run.</p>
    <StatusPicker
      title="Have you done this mock interview?"
      value={task.status === "LEARNING" || task.status === "RETRY_DUE" ? "IN_PROGRESS" : task.status || "NOT_STARTED"}
      options={["NOT_STARTED", "IN_PROGRESS", "INTERVIEW_READY"]}
      onChange={(status) => update({ status })}
    />
    <section className="lc-panel mb-4 rounded-xl border bg-white p-5">
      <h2 className="font-bold">Questions</h2>
      <p className="mb-3 text-sm text-[#657777]">Add the questions you want to be ready to answer for this design.</p>
      <form className="mb-3 flex gap-2" onSubmit={addQuestion}>
        <input required className="flex-1 rounded border p-2" value={questionText} onChange={(event) => setQuestionText(event.target.value)} placeholder="New interview question" />
        <button className="rounded bg-teal-700 px-3 text-white">Add question</button>
      </form>
      {questions.length ? <div className="question-list grid gap-0">{questions.map((item: any) => <QuestionRow key={item.id} item={item} />)}</div> : <p className="rounded-lg bg-[#f0f5f3] p-3 text-sm text-[#657777]">No questions yet. Add the first one above.</p>}
    </section>
    <section className="lc-panel mb-4 rounded-xl border bg-white p-5">
      <h2 className="font-bold">Learning notes</h2>
      <p className="mb-3 text-sm text-[#657777]">Key decisions, trade-offs, and improvements for next time.</p>
      <textarea aria-label="Learning notes" className="min-h-48 w-full" defaultValue={String(task.notes || "")} placeholder="For example: clarify requirements first, estimate peak traffic, and explain the cache invalidation strategy…" onBlur={(event) => update({ notes: event.target.value })} />
    </section>
    <section className="lc-panel mb-4 rounded-xl border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold">Attempt record</h2><p className="text-sm text-[#657777]">Record the outcome and what to improve after each practice.</p></div><button className="bg-[#21675d] text-white" onClick={() => setAttemptOpen(!attemptOpen)}>{attemptOpen ? "Cancel" : "Record attempt"}</button></div>
      {attemptOpen && <form className="mt-4 grid gap-3 rounded-lg bg-[#f0f5f3] p-4 md:grid-cols-[150px_120px_130px_minmax(0,1fr)_auto] md:items-end" onSubmit={addAttempt}><label className="grid gap-1 font-semibold">Date<input name="date" type="date" defaultValue={localDate()} required /></label><label className="grid gap-1 font-semibold">Minutes<input name="duration" type="number" min="1" defaultValue="60" required /></label><label className="grid gap-1 font-semibold">Result<select name="result" defaultValue="PARTIAL"><option>PASS</option><option>PARTIAL</option><option>FAIL</option></select></label><label className="grid gap-1 font-semibold">Reflection<input name="notes" placeholder="What went well or needs work?" /></label><button className="bg-[#21675d] text-white">Save</button></form>}
      <div className="mt-4 grid gap-2">{attempts.length ? attempts.slice().reverse().map((attempt: any) => <article className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-[#d9e3e0] px-3 py-2" key={attempt.id}><span className="font-semibold">{attempt.date}</span><Badge>{attempt.result}</Badge><span className="text-sm text-[#657777]">{attempt.duration} min</span><span className="min-w-48 flex-1 text-sm">{attempt.notes || "No reflection added."}</span><button className="text-sm text-[#923d36]" onClick={() => update({ attempts: attempts.filter((item: any) => item.id !== attempt.id) })}>Delete</button></article>) : <p className="rounded-lg bg-[#f0f5f3] p-3 text-sm text-[#657777]">No attempts recorded yet.</p>}</div>
    </section>
    <button className="mt-4 text-sm text-[#923d36]" onClick={onDelete}>Delete exercise</button>
  </>;
}
function Motivation() {
  const { state, dispatch } = useAppState(),
    [text, setText] = useState(""),
    [section, setSection] = useState("Benefits of changing jobs"),
    [editing, setEditing] = useState<string | null>(null),
    [draft, setDraft] = useState("");
  const sections = [
    "Benefits of changing jobs",
    "Costs of staying",
    "Costs of changing jobs",
    "Benefits of staying",
  ];
  const add = () => {
    if (!text.trim()) return;
    dispatch({
      type: "UPSERT",
      payload: {
        collection: "motivationEntries",
        item: {
          id: crypto.randomUUID(),
          section,
          text,
          order: state.motivationEntries.length,
        },
      },
    });
    setText("");
  };
  return (
    <>
      <PageHeader title="Motivation" />
      <p className="mb-4 text-slate-600">
        This is a reminder of why the plan matters, not a way to guilt yourself into working.
      </p>
      <form
        className="mb-4 grid gap-2 rounded-xl border bg-white p-4 sm:grid-cols-[1fr_2fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <select value={section} onChange={(e) => setSection(e.target.value)}>
          {sections.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <input
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an entry"
          className="rounded border p-2"
        />
        <button className="rounded bg-teal-700 px-3 text-white">Add</button>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((sectionName) => {
          const entries = state.motivationEntries.filter((entry: any) => entry.section === sectionName).sort((a: any, b: any) => a.order - b.order);
          return <section className="motivation-list rounded-xl border bg-white p-4" key={sectionName}>
            <h2 className="mb-2 font-bold">{sectionName}</h2>
            {entries.length === 0 ? <p className="py-3 text-sm text-[#657777]">No entries yet.</p> : entries.map((x: any) => (
              <div className="flex items-center gap-2 border-b py-3" key={x.id}>
                {editing === x.id ? <><input className="flex-1 rounded border p-1" value={draft} onChange={(e) => setDraft(e.target.value)} /><button onClick={() => { dispatch({ type: "UPSERT", payload: { collection: "motivationEntries", item: { ...x, text: draft } } }); setEditing(null); }}>Save</button><button onClick={() => setEditing(null)}>Cancel</button></> : <><span className="flex-1">{x.text}</span><button onClick={() => { setEditing(x.id); setDraft(x.text); }}>Edit</button><button onClick={() => confirm("Delete this entry?") && dispatch({ type: "DELETE", payload: { collection: "motivationEntries", id: x.id } })}>Delete</button></>}
              </div>
            ))}
          </section>;
        })}
      </div>
    </>
  );
}
export default function App() {
  return (
    <HashRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/motivation" element={<Motivation />} />
          <Route path="/weekly-plan" element={<WeeklyPlan />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/behaviour" element={<Questions kind="BEHAVIOUR" />} />
          <Route path="/java" element={<Questions kind="JAVA_THEORY" />} />
          <Route path="/dsa" element={<Dsa />} />
          <Route path="/dsa/:id" element={<DsaDetail />} />
          <Route path="/functional-coding" element={<Tasks />} />
          <Route path="/functional-coding/:id" element={<Tasks />} />
          <Route path="/system-design" element={<SystemDesignPage />} />
          <Route path="/backup" element={<Backup />} />
          <Route
            path="/system-design/ddia/:chapterId"
            element={<Questions kind="DDIA" />}
          />
          <Route
            path="/system-design/hello-interview"
            element={<HelloInterviewPage />}
          />
          <Route
            path="/system-design/hello-interview/:id"
            element={<Tasks system />}
          />
        </Routes>
      </Shell>
    </HashRouter>
  );
}
