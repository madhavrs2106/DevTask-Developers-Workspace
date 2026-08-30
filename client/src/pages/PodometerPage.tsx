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
    <div className="flex flex-col items-center gap-1 sm:gap-2">
      <div className="relative flex gap-0.5 sm:gap-1">
        {value.split("").map((digit, i) => (
          <div
            key={i}
            className="relative flex h-16 w-10 items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 shadow-lg sm:h-24 sm:w-16 md:h-32 md:w-20 lg:h-40 lg:w-28"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)" }}
          >
            {/* flip line */}
            <div className="absolute left-0 right-0 top-1/2 h-px bg-black/40" />
            <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60 sm:h-2 sm:w-2" />
            <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60 sm:h-2 sm:w-2" style={{ left: "auto", right: "50%" }} />
            <span className="font-mono text-2xl font-black tracking-wider text-white sm:text-4xl md:text-5xl lg:text-6xl" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
              {digit}
            </span>
          </div>
        ))}
      </div>
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint sm:text-[10px]">{label}</span>
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
  const selectableTasks = useMemo(() => tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "REVIEW"), [tasks]);

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
          {selectableTasks.length === 0 ? (
            <option disabled>No In Progress or Review tasks — move a task to In Progress or Review first</option>
          ) : (
            <>
              <optgroup label="In Progress">
                {selectableTasks
                  .filter((t) => t.status === "IN_PROGRESS")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Review">
                {selectableTasks
                  .filter((t) => t.status === "REVIEW")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </optgroup>
            </>
          )}
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
      <div className="mt-10 flex flex-nowrap items-center justify-center gap-1 sm:gap-2 md:gap-3">
        <FlipUnit value={h} label="Hours" />
        <span className="pb-4 font-mono text-xl font-black text-white/20 sm:pb-6 sm:text-3xl md:text-4xl">:</span>
        <FlipUnit value={m} label="Minutes" />
        <span className="pb-4 font-mono text-xl font-black text-white/20 sm:pb-6 sm:text-3xl md:text-4xl">:</span>
        <FlipUnit value={s} label="Seconds" />
      </div>

      {/* Controls */}
      <div className="mt-8 flex flex-nowrap items-center justify-center gap-1.5 sm:gap-3">
        {!running ? (
          <Button onClick={() => setRunning(true)} disabled={!selectedTask} className="h-9 gap-1 px-3 text-xs sm:h-11 sm:gap-2 sm:px-8 sm:text-sm">
            <Play size={14} className="sm:h-4 sm:w-4" /> Start
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setRunning(false)} className="h-9 gap-1 px-3 text-xs sm:h-11 sm:gap-2 sm:px-8 sm:text-sm">
            <Pause size={14} className="sm:h-4 sm:w-4" /> Pause
          </Button>
        )}
        <Button variant="ghost" onClick={() => { setElapsed(0); setRunning(false); }} disabled={elapsed === 0 && !running} className="h-9 gap-1 px-3 text-xs sm:h-11 sm:gap-2 sm:px-6 sm:text-sm">
          <RotateCcw size={14} className="sm:h-4 sm:w-4" /> Reset
        </Button>
        <Button
          variant="primary"
          onClick={() => void handleSave()}
          disabled={!selectedTask || elapsed === 0 || updateTask.isPending}
          className="h-9 gap-1 px-3 text-xs sm:h-11 sm:gap-2 sm:px-8 sm:text-sm"
        >
          <Save size={14} className="sm:h-4 sm:w-4" /> {updateTask.isPending ? "Saving…" : "Finish & Save"}
        </Button>
      </div>

      {!selectedTask && <p className="mt-6 text-xs text-amber-300">Select a task above to start the podometer.</p>}

      <p className="mt-8 max-w-xl text-center text-[11px] leading-relaxed text-ink-faint">
        <Clock size={12} className="mr-1 inline" /> Tip: Keep this page open while you work. The timer runs only while you keep it running — pause when you take a break. Finish & Save adds this session to the task's tracked hours.
      </p>
    </div>
  );
}
