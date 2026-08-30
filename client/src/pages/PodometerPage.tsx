import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock, Pause, Play, RotateCcw, Save, Timer } from "lucide-react";
import { useTasks, useUpdateTask } from "../hooks/useQueries";
import { Button } from "../components/ui/Button";

function formatFlip(totalSeconds: number): { h: string; m: string; s: string } {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
  };
}

function FlipUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex gap-1">
        {value.split("").map((digit, i) => (
          <div
            key={i}
            className="relative flex h-24 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 shadow-lg sm:h-32 sm:w-20 md:h-40 md:w-28"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)" }}
          >
            {/* flip line */}
            <div className="absolute left-0 right-0 top-1/2 h-px bg-black/40" />
            <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60" />
            <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60" style={{ left: "auto", right: "50%" }} />
            <span className="font-mono text-4xl font-black tracking-wider text-white sm:text-5xl md:text-6xl" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
              {digit}
            </span>
          </div>
        ))}
      </div>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">{label}</span>
    </div>
  );
}

export function PodometerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: tasks = [] } = useTasks();
  const updateTask = useUpdateTask();

  const initialTaskId = searchParams.get("taskId") ?? "";
  const [selectedId, setSelectedId] = useState(initialTaskId);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const selectedTask = useMemo(() => tasks.find((t) => t.id === selectedId) ?? null, [tasks, selectedId]);
  const inProgressTasks = useMemo(() => tasks.filter((t) => t.status === "IN_PROGRESS"), [tasks]);

  useEffect(() => {
    if (initialTaskId) setSelectedId(initialTaskId);
  }, [initialTaskId]);

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    } else if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  const { h, m, s } = formatFlip(elapsed);
  const totalHours = selectedTask ? selectedTask.actualHours + elapsed / 3600 : elapsed / 3600;

  async function handleSave() {
    if (!selectedTask || elapsed === 0) return;
    const newHours = Math.round((selectedTask.actualHours + elapsed / 3600) * 100) / 100;
    await updateTask.mutateAsync({ id: selectedTask.id, data: { actualHours: newHours } });
    setElapsed(0);
    setRunning(false);
  }

  function handleTaskChange(id: string) {
    setSelectedId(id);
    setSearchParams(id ? { taskId: id } : {}, { replace: true });
    setElapsed(0);
    setRunning(false);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl flex-col items-center px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
          <Timer size={24} className="text-accent-bright" /> Podometer
        </h1>
        <p className="mt-1 text-xs text-ink-faint">Choose a task, run the flip clock while you work, then Finish & Save.</p>
      </div>

      {/* Task chooser */}
      <div className="w-full max-w-xl">
        <label className="label-dark">Choose task for podometer</label>
        <select
          className="input-dark w-full"
          value={selectedId}
          onChange={(e) => handleTaskChange(e.target.value)}
        >
          <option value="">— Select a task —</option>
          {inProgressTasks.length > 0 && (
            <optgroup label="In Progress">
              {inProgressTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.actualHours.toFixed(2)}h tracked)
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="All tasks">
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} — {t.status} ({t.actualHours.toFixed(2)}h)
              </option>
            ))}
          </optgroup>
        </select>
        {selectedTask && (
          <p className="mt-2 text-center text-xs text-ink-faint">
            Tracking: <span className="font-medium text-white">{selectedTask.title}</span> · Already tracked{" "}
            <span className="font-mono text-ink">{selectedTask.actualHours.toFixed(2)}h</span> · This session{" "}
            <span className="font-mono text-accent-bright">{(elapsed / 3600).toFixed(2)}h</span> · Total{" "}
            <span className="font-mono text-white">{totalHours.toFixed(2)}h</span>
          </p>
        )}
      </div>

      {/* Flip Clock */}
      <div className="mt-10 flex items-center justify-center gap-2 sm:gap-3">
        <FlipUnit value={h} label="Hours" />
        <span className="pb-6 font-mono text-3xl font-black text-white/20 sm:text-4xl">:</span>
        <FlipUnit value={m} label="Minutes" />
        <span className="pb-6 font-mono text-3xl font-black text-white/20 sm:text-4xl">:</span>
        <FlipUnit value={s} label="Seconds" />
      </div>

      {/* Controls */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {!running ? (
          <Button onClick={() => setRunning(true)} disabled={!selectedTask} className="h-11 gap-2 px-8 text-sm">
            <Play size={16} /> Start
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setRunning(false)} className="h-11 gap-2 px-8 text-sm">
            <Pause size={16} /> Pause
          </Button>
        )}
        <Button variant="ghost" onClick={() => { setElapsed(0); setRunning(false); }} disabled={elapsed === 0 && !running} className="h-11 gap-2 px-6 text-sm">
          <RotateCcw size={16} /> Reset
        </Button>
        <Button
          variant="primary"
          onClick={() => void handleSave()}
          disabled={!selectedTask || elapsed === 0 || updateTask.isPending}
          className="h-11 gap-2 px-8 text-sm"
        >
          <Save size={16} /> {updateTask.isPending ? "Saving…" : "Finish & Save"}
        </Button>
      </div>

      {!selectedTask && <p className="mt-6 text-xs text-amber-300">Select a task above to start the podometer.</p>}

      <p className="mt-8 max-w-xl text-center text-[11px] leading-relaxed text-ink-faint">
        <Clock size={12} className="mr-1 inline" /> Tip: Keep this page open while you work. The timer runs only while you keep it running — pause when you take a break. Finish & Save adds this session to the task's tracked hours.
      </p>
    </div>
  );
}
