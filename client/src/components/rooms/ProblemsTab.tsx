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

const LANG_OPTIONS: { id: ProblemLanguage; label: string; note: string }[] = [
  { id: "javascript", label: "JavaScript", note: "Node.js" },
  { id: "python", label: "Python", note: "Python 3" },
  { id: "c", label: "C", note: "GCC" },
  { id: "cpp", label: "C++", note: "G++" },
  { id: "java", label: "Java", note: "JDK" },
  { id: "go", label: "Go", note: "Go" },
  { id: "ruby", label: "Ruby", note: "Ruby" },
];

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
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Languages members can solve in
          </label>
          <p className="text-xs text-[var(--text-secondary)] mb-2">
            Select the programming language(s) this problem accepts. Members will only be able to submit in the chosen languages.
          </p>
          <div className="flex gap-2 mt-1 flex-wrap">
            {LANG_OPTIONS.map((opt) => {
              const active = languages.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleLang(opt.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)]"
                      : "border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                  }`}
                >
                  <Code2 size={14} className={active ? "text-[var(--accent)]" : ""} />
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-[10px] opacity-70">{opt.note}</span>
                  {active && <CheckCircle2 size={14} className="text-[var(--accent)]" />}
                </button>
              );
            })}
          </div>
          {languages.length === 0 && (
            <p className="text-xs text-red-400 mt-1">Choose at least one language.</p>
          )}
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
  const [result, setResult] = useState<{ status: string; passed: number; total: number; results: SubmissionResult[]; run?: boolean } | null>(null);

  if (isLoading || !problem) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[var(--accent)]" /></div>;
  }

  const activeLangs = problem.languages;
  const effectiveLang = activeLangs.includes(lang) ? lang : activeLangs[0];
  const editorValue = code || problem.starterCode[effectiveLang] || "";
  const langLabel = (l: ProblemLanguage) => LANG_OPTIONS.find((o) => o.id === l)?.label || l;

  const runWith = (mode: "run" | "submit") =>
    submit.mutate(
      { code: editorValue, language: effectiveLang, runMode: mode },
      { onSuccess: (res) => setResult(res as { status: string; passed: number; total: number; results: SubmissionResult[]; run?: boolean }) }
    );

  const sampleCases = problem.testCases.filter((t) => !t.hidden);
  const rightItems =
    result?.results ??
    sampleCases.map((t) => ({ hidden: false, input: t.input, expected: t.expected, actual: "", passed: false, error: null }));

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
        <ArrowLeft size={16} /> Back to problems
      </button>

      {/* Top bar: language selector + Run / Submit */}
      <div className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2">
        <div className="flex items-center gap-3">
          <select
            value={effectiveLang}
            onChange={(e) => {
              setLang(e.target.value as ProblemLanguage);
              setCode("");
            }}
            className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          >
            {activeLangs.map((l) => (
              <option key={l} value={l}>{langLabel(l)}</option>
            ))}
          </select>
          {effectiveLang === "python" && (
            <span className="hidden md:inline text-[11px] text-[var(--text-secondary)]">
              numpy · pandas · scipy · sympy · matplotlib
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => runWith("run")} disabled={submit.isPending} className="flex items-center gap-1">
            <Play size={14} /> Run
          </Button>
          <Button variant="primary" onClick={() => runWith("submit")} disabled={submit.isPending} className="flex items-center gap-1">
            {submit.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {submit.isPending ? "Running..." : "Submit"}
          </Button>
        </div>
      </div>

      {/* Three-column workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        {/* Left: problem statement */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 space-y-4 lg:h-[72vh] overflow-y-auto">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{problem.title}</h3>
            {difficultyBadge(problem.difficulty)}
          </div>
          <div className="flex gap-2 flex-wrap">
            {activeLangs.map((l) => (
              <span key={l} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg)] text-[var(--text-secondary)] border border-[var(--border)]">{l}</span>
            ))}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Problem Description</h4>
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">{problem.description}</p>
          </div>

          {sampleCases.length > 0 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Sample Input</h4>
                <div className="space-y-2">
                  {sampleCases.map((tc, i) => (
                    <div key={i}>
                      <div className="text-[11px] text-[var(--text-secondary)] mb-0.5">Sample {i + 1}</div>
                      <pre className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-xs font-mono text-[var(--text-primary)] whitespace-pre-wrap">{tc.input}</pre>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Sample Output</h4>
                <div className="space-y-2">
                  {sampleCases.map((tc, i) => (
                    <div key={i}>
                      <div className="text-[11px] text-[var(--text-secondary)] mb-0.5">Sample {i + 1}</div>
                      <pre className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2 text-xs font-mono text-[var(--text-primary)] whitespace-pre-wrap">{tc.expected}</pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Middle: editor */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-0 overflow-hidden lg:h-[72vh] flex flex-col">
          <CodeEditor value={editorValue} onChange={setCode} language={effectiveLang} />
        </div>

        {/* Right: test results console */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 space-y-3 lg:h-[72vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Terminal size={14} /> Test Results
            </h4>
            {result && (
              <div className="flex items-center gap-2">
                <StatusBadge status={result.status} />
                <span className="text-xs text-[var(--text-secondary)]">{result.passed}/{result.total}</span>
              </div>
            )}
          </div>

          {rightItems.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">This problem has no visible sample cases. Use Submit to run the hidden tests.</p>
          ) : (
            <div className="space-y-3">
              {rightItems.map((r, i) => (
                <div key={i} className="border border-[var(--border)] rounded-lg p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[var(--text-primary)]">
                      {r.hidden ? "Hidden Test Case" : `Sample ${i + 1}`}
                    </span>
                    {result && (r.passed ? <CheckCircle2 size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-400" />)}
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">Input</div>
                    <pre className="mt-0.5 text-xs font-mono text-[var(--text-primary)] whitespace-pre-wrap">{r.hidden ? "••••••" : r.input}</pre>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">Expected Output</div>
                    <pre className="mt-0.5 text-xs font-mono text-[var(--text-primary)] whitespace-pre-wrap">{r.hidden ? "••••••" : r.expected}</pre>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">Your Output</div>
                    <pre className={`mt-0.5 text-xs font-mono whitespace-pre-wrap ${result && !r.passed ? "text-red-400" : "text-[var(--text-primary)]"}`}>
                      {r.error ? `Error: ${r.error}` : r.actual || (result ? "(no output)" : "—")}
                    </pre>
                  </div>
                </div>
              ))}
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
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {difficultyBadge(p.difficulty)}
                    <span className="text-[10px] text-[var(--text-secondary)]">Solve in:</span>
                    {p.languages.map((l) => (
                      <span key={l} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary)]">
                        {l}
                      </span>
                    ))}
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
