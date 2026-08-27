import { useState } from "react";
import {
  Code2,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Play,
  ListChecks,
  Loader2,
  Terminal,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { EmptyState } from "../ui/EmptyState";
import {
  useProblems,
  useProblem,
  useCreateProblem,
  useDeleteProblem,
  useSubmitSolution,
  useProblemSubmissions,
  type ProblemInput,
} from "../../hooks/useQueries";
import type {
  ProblemDetail,
  RoomProblem,
  RoomProblemSubmission,
  SubmissionResult,
  ProblemLanguage,
} from "../../types";

const DIFFICULTY_COLOR: Record<string, string> = {
  EASY: "text-green-400",
  MEDIUM: "text-yellow-400",
  HARD: "text-red-400",
};

function difficultyBadge(d: string) {
  return <span className={`text-xs font-semibold ${DIFFICULTY_COLOR[d] || "text-[var(--text-secondary)]"}`}>{d}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: JSX.Element; label: string }> = {
    ACCEPTED: { color: "text-green-400", icon: <CheckCircle2 size={14} />, label: "Accepted" },
    WRONG: { color: "text-red-400", icon: <XCircle size={14} />, label: "Wrong Answer" },
    TIME_LIMIT: { color: "text-yellow-400", icon: <Clock size={14} />, label: "Time Limit" },
    RUNTIME_ERROR: { color: "text-orange-400", icon: <AlertTriangle size={14} />, label: "Runtime Error" },
    PENDING: { color: "text-[var(--text-secondary)]", icon: <Loader2 size={14} />, label: "Pending" },
  };
  const s = map[status] || map.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${s.color}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

function CodeEditor({ value, onChange, language }: { value: string; onChange: (v: string) => void; language: string }) {
  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const t = e.currentTarget;
      const start = t.selectionStart;
      const end = t.selectionEnd;
      const next = value.slice(0, start) + "  " + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        t.selectionStart = t.selectionEnd = start + 2;
      });
    }
  };
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKey}
      spellCheck={false}
      className="w-full h-full min-h-[320px] resize-none bg-[#0d1117] text-[var(--text-primary)] font-mono text-sm p-4 rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] leading-relaxed"
      placeholder={`Write your ${language} solution here. Read input from standard input, print the answer to standard output.`}
    />
  );
}

function CreateProblemForm({ roomId, onDone }: { roomId: string; onDone: () => void }) {
  const create = useCreateProblem(roomId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("EASY");
  const [languages, setLanguages] = useState<ProblemLanguage[]>(["javascript", "python"]);
  const [starter, setStarter] = useState<Record<string, string>>({ javascript: "", python: "" });
  const [testCases, setTestCases] = useState<{ input: string; expected: string; hidden: boolean }[]>([
    { input: "", expected: "", hidden: false },
  ]);

  const toggleLang = (l: ProblemLanguage) =>
    setLanguages((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));

  const submit = () => {
    if (!title.trim() || !description.trim() || languages.length === 0) return;
    const valid = testCases.filter((t) => t.input.length > 0 && t.expected.length > 0);
    if (valid.length === 0) return;
    const input: ProblemInput = {
      title: title.trim(),
      description: description.trim(),
      difficulty,
      languages,
      starterCode: starter,
      testCases: valid,
    };
    create.mutate(input, { onSuccess: onDone });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
          placeholder="e.g. Add Two Numbers"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description / Problem Statement</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
          placeholder="Describe the problem. Members should read input from stdin and print output."
        />
      </div>

      <div className="flex gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as "EASY" | "MEDIUM" | "HARD")}
            className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="EASY">EASY</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HARD">HARD</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Languages</label>
          <div className="flex gap-3 mt-2">
            {(["javascript", "python"] as ProblemLanguage[]).map((l) => (
              <label key={l} className="flex items-center gap-1 text-sm text-[var(--text-primary)] cursor-pointer">
                <input type="checkbox" checked={languages.includes(l)} onChange={() => toggleLang(l)} />
                {l}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Starter Code (optional, per language)</label>
        {languages.map((l) => (
          <div key={l} className="mb-2">
            <span className="text-xs text-[var(--text-secondary)]">{l}</span>
            <textarea
              value={starter[l] || ""}
              onChange={(e) => setStarter((p) => ({ ...p, [l]: e.target.value }))}
              rows={2}
              className="w-full mt-1 bg-[#0d1117] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:border-[var(--accent)]"
              placeholder={`// starter for ${l}`}
            />
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">Test Cases (input → expected output)</label>
          <button
            type="button"
            onClick={() => setTestCases((p) => [...p, { input: "", expected: "", hidden: false }])}
            className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
          >
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="space-y-2">
          {testCases.map((tc, i) => (
            <div key={i} className="flex gap-2 items-start bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2">
              <div className="flex-1">
                <span className="text-[10px] text-[var(--text-secondary)]">INPUT</span>
                <textarea
                  value={tc.input}
                  onChange={(e) => setTestCases((p) => p.map((x, j) => (j === i ? { ...x, input: e.target.value } : x)))}
                  rows={2}
                  className="w-full mt-0.5 bg-[#0d1117] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-primary)] font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-[var(--text-secondary)]">EXPECTED OUTPUT</span>
                <textarea
                  value={tc.expected}
                  onChange={(e) => setTestCases((p) => p.map((x, j) => (j === i ? { ...x, expected: e.target.value } : x)))}
                  rows={2}
                  className="w-full mt-0.5 bg-[#0d1117] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-primary)] font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="flex flex-col items-center gap-1 pt-4">
                <label className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] cursor-pointer" title="Hidden test cases are not visible to members">
                  <input type="checkbox" checked={tc.hidden} onChange={(e) => setTestCases((p) => p.map((x, j) => (j === i ? { ...x, hidden: e.target.checked } : x)))} />
                  hidden
                </label>
                <button
                  type="button"
                  onClick={() => setTestCases((p) => p.filter((_, j) => j !== i))}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {create.isError && <p className="text-xs text-red-400">Failed to create problem.</p>}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>Cancel</Button>
        <Button variant="primary" onClick={submit} disabled={create.isPending}>
          {create.isPending ? "Creating..." : "Create Problem"}
        </Button>
      </div>
    </div>
  );
}

function SolveView({ roomId, problemId, isAdmin, onBack }: { roomId: string; problemId: string; isAdmin: boolean; onBack: () => void }) {
  const { data: problem, isLoading } = useProblem(roomId, problemId);
  const submit = useSubmitSolution(roomId, problemId);
  const [lang, setLang] = useState<ProblemLanguage>("javascript");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ status: string; passed: number; total: number; results: SubmissionResult[] } | null>(null);

  if (isLoading || !problem) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[var(--accent)]" /></div>;
  }

  const activeLangs = problem.languages;
  const effectiveLang = activeLangs.includes(lang) ? lang : activeLangs[0];
  const editorValue = code || problem.starterCode[effectiveLang] || "";

  const handleSubmit = () => {
    submit.mutate(
      { code: editorValue, language: effectiveLang },
      {
        onSuccess: (res) => setResult({ status: res.status, passed: res.passed, total: res.total, results: res.results }),
      }
    );
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
        <ArrowLeft size={16} /> Back to problems
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Problem statement */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{problem.title}</h3>
            {difficultyBadge(problem.difficulty)}
          </div>
          <div className="flex gap-2 flex-wrap">
            {activeLangs.map((l) => (
              <span key={l} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg)] text-[var(--text-secondary)] border border-[var(--border)]">{l}</span>
            ))}
          </div>
          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{problem.description}</p>

          {problem.testCases.some((t) => !t.hidden) && (
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-2">
                <ListChecks size={14} /> Sample Test Cases
              </h4>
              <div className="space-y-2">
                {problem.testCases.filter((t) => !t.hidden).map((tc, i) => (
                  <div key={i} className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-xs font-mono">
                    <div className="text-[var(--text-secondary)]">Input:</div>
                    <pre className="whitespace-pre-wrap text-[var(--text-primary)]">{tc.input}</pre>
                    <div className="text-[var(--text-secondary)] mt-1">Expected:</div>
                    <pre className="whitespace-pre-wrap text-[var(--text-primary)]">{tc.expected}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {activeLangs.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLang(l);
                    setCode("");
                  }}
                  className={`px-3 py-1 text-xs rounded-lg ${effectiveLang === l ? "bg-[var(--accent)] text-white" : "bg-[var(--bg)] text-[var(--text-secondary)] border border-[var(--border)]"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <Button variant="primary" onClick={handleSubmit} disabled={submit.isPending} className="flex items-center gap-1">
              {submit.isPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {submit.isPending ? "Running..." : "Submit"}
            </Button>
          </div>

          <CodeEditor value={editorValue} onChange={setCode} language={effectiveLang} />

          {result && (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                <StatusBadge status={result.status} />
                <span className="text-xs text-[var(--text-secondary)]">
                  {result.passed}/{result.total} passed
                </span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {result.results.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2">
                    {r.passed ? <CheckCircle2 size={14} className="text-green-400 mt-0.5 shrink-0" /> : <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />}
                    <div className="font-mono flex-1">
                      <div className="text-[var(--text-secondary)]">{r.hidden ? "Hidden test case" : `Test case ${i + 1}`}{r.error ? ` — ${r.error}` : ""}</div>
                      {!r.hidden && (
                        <>
                          <div className="text-[var(--text-primary)]">in: {r.input}</div>
                          <div className="text-[var(--text-primary)]">exp: {r.expected}</div>
                          <div className="text-[var(--text-primary)]">got: {r.actual}</div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {submit.isError && <p className="text-xs text-red-400">Submission failed. Try again.</p>}
        </div>
      </div>
    </div>
  );
}

function SubmissionsView({ roomId, problemId, isAdmin, onBack }: { roomId: string; problemId: string; isAdmin: boolean; onBack: () => void }) {
  const { data, isLoading } = useProblemSubmissions(roomId, problemId);
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
        <ArrowLeft size={16} /> Back
      </button>
      <h3 className="text-lg font-bold text-[var(--text-primary)]">Submissions</h3>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[var(--accent)]" /></div>
      ) : !data || data.length === 0 ? (
        <EmptyState icon={Terminal} title="No submissions yet" hint="Be the first to solve this problem." />
      ) : (
        <div className="space-y-2">
          {data.map((s: RoomProblemSubmission) => (
            <div key={s.id} className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                {isAdmin && s.user && <span className="text-sm text-[var(--text-primary)]">{s.user.name}</span>}
                <span className="text-xs text-[var(--text-secondary)]">@{s.user?.username}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary)]">{s.language}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-secondary)]">{s.passed}/{s.total}</span>
                <StatusBadge status={s.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProblemsTab({ roomId, isAdmin }: { roomId: string; isAdmin: boolean }) {
  const { data: problems, isLoading } = useProblems(roomId);
  const [view, setView] = useState<"list" | "create" | "solve" | "submissions">("list");
  const [selected, setSelected] = useState<string | null>(null);
  const del = useDeleteProblem(roomId);

  if (view === "create") {
    return (
      <div className="max-w-3xl mx-auto">
        <button onClick={() => setView("list")} className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-3">
          <ArrowLeft size={16} /> Cancel
        </button>
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">Create Coding Problem</h3>
        <CreateProblemForm roomId={roomId} onDone={() => setView("list")} />
      </div>
    );
  }

  if (view === "solve" && selected) {
    return <SolveView roomId={roomId} problemId={selected} isAdmin={isAdmin} onBack={() => { setView("list"); setSelected(null); }} />;
  }

  if (view === "submissions" && selected) {
    return <SubmissionsView roomId={roomId} problemId={selected} isAdmin={isAdmin} onBack={() => { setView("list"); setSelected(null); }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Code2 size={18} /> Coding Problems
        </h3>
        {isAdmin && (
          <Button variant="primary" onClick={() => setView("create")} className="flex items-center gap-1">
            <Plus size={14} /> Add Problem
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[var(--accent)]" /></div>
      ) : !problems || problems.length === 0 ? (
        <EmptyState
          icon={Code2}
          title="No coding problems yet"
          hint={isAdmin ? "Create a problem and add test cases with expected outputs." : "Admins haven't added any problems."}
        />
      ) : (
        <div className="space-y-2">
          {problems.map((p: RoomProblem) => (
            <div key={p.id} className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <Code2 size={18} className="text-[var(--accent)]" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--text-primary)]">{p.title}</span>
                    {p.solved && <CheckCircle2 size={14} className="text-green-400" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {difficultyBadge(p.difficulty)}
                    <span className="text-[10px] text-[var(--text-secondary)]">{p.languages.join(", ")}</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">· {p.submissionsCount} submissions</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button variant="ghost" onClick={() => { setSelected(p.id); setView("submissions"); }} className="text-xs flex items-center gap-1">
                    <ListChecks size={14} /> Subs
                  </Button>
                )}
                <Button variant="primary" onClick={() => { setSelected(p.id); setView("solve"); }} className="text-xs">
                  Solve
                </Button>
                {isAdmin && (
                  <button
                    onClick={() => del.mutate(p.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Delete problem"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
