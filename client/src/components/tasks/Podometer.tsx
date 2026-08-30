import { useEffect, useRef, useState } from "react";
import { Clock, Pause, Play, RotateCcw, Save } from "lucide-react";
import { useUpdateTask } from "../../hooks/useQueries";
import { Button } from "../ui/Button";

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface PodometerProps {
  taskId: string;
  taskTitle: string;
  initialHours: number;
  onSaved?: () => void;
}

export function Podometer({ taskId, taskTitle, initialHours, onSaved }: PodometerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const updateTask = useUpdateTask();

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

  const totalHours = initialHours + elapsed / 3600;

  async function handleSave() {
    if (elapsed === 0) return;
    const hoursToAdd = elapsed / 3600;
    const newHours = Math.round((initialHours + hoursToAdd) * 100) / 100;
    try {
      await updateTask.mutateAsync({ id: taskId, data: { actualHours: newHours } });
      setElapsed(0);
      setRunning(false);
      onSaved?.();
    } catch {
      // handled by mutation error UI
    }
  }

  function handleReset() {
    setElapsed(0);
    setRunning(false);
  }

  return (
    <div className="mt-3 rounded-xl border border-accent/20 bg-accent/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-accent-bright">
          <Clock size={12} /> Podometer — {taskTitle}
        </span>
        <span className="font-mono text-xs font-bold text-white">{formatElapsed(elapsed)}</span>
      </div>
      <p className="mt-1 text-[11px] text-ink-faint">
        Tracked: <span className="font-mono text-ink">{totalHours.toFixed(2)}h</span> (saved {initialHours.toFixed(2)}h + this session {(elapsed / 3600).toFixed(2)}h)
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {!running ? (
          <Button variant="outline" onClick={() => setRunning(true)} className="h-7 px-2.5 text-xs">
            <Play size={12} /> Start
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setRunning(false)} className="h-7 px-2.5 text-xs">
            <Pause size={12} /> Pause
          </Button>
        )}
        <Button variant="ghost" onClick={handleReset} disabled={elapsed === 0 && !running} className="h-7 px-2.5 text-xs">
          <RotateCcw size={12} /> Reset
        </Button>
        <Button
          variant="primary"
          onClick={() => void handleSave()}
          disabled={elapsed === 0 || updateTask.isPending}
          className="ml-auto h-7 px-3 text-xs"
        >
          <Save size={12} /> {updateTask.isPending ? "Saving…" : "Finish & Save"}
        </Button>
      </div>
      <p className="mt-2 text-[10px] text-ink-faint">Run the podometer while working — Finish & Save adds this session to the task.</p>
    </div>
  );
}
