import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Square,
  Clock,
  Zap,
  Coffee,
} from "lucide-react";
import { useStartFocusSession, useUpdateFocusStatus } from "../../hooks/useQueries";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import type { CoLearningRoomFull, FocusSession } from "../../types";

interface Props {
  room: CoLearningRoomFull;
}

function FocusTimer({ session, roomId }: { session: FocusSession; roomId: string }) {
  const { user } = useAuth();
  const updateStatus = useUpdateFocusStatus(roomId);
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const isOwn = session.user.id === user?.id;

  useEffect(() => {
    const calcRemaining = () => {
      const diff = Math.max(0, Math.floor((new Date(session.endsAt).getTime() - Date.now()) / 1000));
      setRemaining(diff);
      if (diff <= 0 && session.status === "ACTIVE") {
        updateStatus.mutateAsync({ sessionId: session.id, status: "COMPLETED" });
      }
    };
    calcRemaining();
    intervalRef.current = setInterval(calcRemaining, 1000);
    return () => clearInterval(intervalRef.current);
  }, [session.endsAt, session.status, session.id, updateStatus]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = 1 - remaining / (session.duration * 60);
  const isLow = remaining <= 60 && remaining > 0;
  const isDone = remaining === 0;

  return (
    <div
      className={cn(
        "p-5 rounded-xl border transition-all",
        isDone
          ? "bg-green-400/5 border-green-400/30"
          : "bg-[var(--bg-card)] border-[var(--border)]"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: session.user.avatarColor }}
          >
            {session.user.avatarUrl ? (
              <img src={session.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              session.user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {session.task}
            </p>
            {session.status === "PAUSED" && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 text-xs">
                <Pause size={10} />
                Paused
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            {session.user.name} · {session.duration}m session
          </p>
        </div>

        {/* Timer */}
        <div className="shrink-0 text-right">
          <p
            className={cn(
              "text-3xl font-mono font-bold tabular-nums",
              isDone ? "text-green-400" : isLow ? "text-red-400" : "text-[var(--text-primary)]"
            )}
          >
            {String(minutes).padStart(2, "0")}
            <span className={isLow ? "animate-pulse" : ""}>:</span>
            {String(seconds).padStart(2, "0")}
          </p>
          {isDone && (
            <p className="text-xs text-green-400 font-medium">Completed!</p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 h-2 bg-[var(--bg)] rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            isDone ? "bg-green-400" : isLow ? "bg-red-400" : "bg-[var(--accent)]"
          )}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Controls */}
      {isOwn && !isDone && (
        <div className="flex gap-2 mt-4">
          {session.status === "ACTIVE" ? (
            <Button
              variant="ghost"
              onClick={() => updateStatus.mutateAsync({ sessionId: session.id, status: "PAUSED" })}
              className="text-sm gap-2"
            >
              <Pause size={14} />
              Pause
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => updateStatus.mutateAsync({ sessionId: session.id, status: "ACTIVE" })}
              className="text-sm gap-2"
            >
              <Play size={14} />
              Resume
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => updateStatus.mutateAsync({ sessionId: session.id, status: "COMPLETED" })}
            className="text-sm text-red-400 hover:text-red-300 gap-2"
          >
            <Square size={14} />
            End
          </Button>
        </div>
      )}
    </div>
  );
}

export function FocusTab({ room }: Props) {
  const startSession = useStartFocusSession(room.id);
  const [task, setTask] = useState("");
  const [duration, setDuration] = useState(25);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    await startSession.mutateAsync({ task, duration });
    setTask("");
    setDuration(25);
  };

  const activeSessions = room.focusSessions.filter((s) => s.status !== "COMPLETED");
  const completedSessions = room.focusSessions.filter((s) => s.status === "COMPLETED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Focus Sessions
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Study together with synchronized timers
        </p>
      </div>

      {/* Start Form */}
      <form onSubmit={handleStart} className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className="text-[var(--accent)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Start a focus session</span>
        </div>
        <div className="flex gap-3">
          <input
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="What are you focusing on?"
            required
          />
          <select
            className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            <option value={15}>15 min</option>
            <option value={25}>25 min</option>
            <option value={45}>45 min</option>
            <option value={60}>60 min</option>
          </select>
          <Button
            variant="primary"
            type="submit"
            disabled={!task.trim() || startSession.isPending}
            className="gap-2"
          >
            <Play size={14} />
            {startSession.isPending ? "Starting..." : "Start"}
          </Button>
        </div>
      </form>

      {/* Active Sessions */}
      {activeSessions.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              Active ({activeSessions.length})
            </h3>
          </div>
          <div className="space-y-3">
            {activeSessions.map((session) => (
              <FocusTimer key={session.id} session={session} roomId={room.id} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] border-dashed">
          <Clock size={40} className="mx-auto mb-3 text-[var(--text-secondary)] opacity-40" />
          <p className="text-sm text-[var(--text-secondary)]">No active focus sessions</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Start one above to focus together</p>
        </div>
      )}

      {/* Completed Sessions */}
      {completedSessions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
            Completed ({completedSessions.length})
          </h3>
          <div className="space-y-2">
            {completedSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] opacity-60"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: session.user.avatarColor }}
                >
                  {session.user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--text-primary)] truncate">{session.task}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {session.user.name} · {session.duration}m
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <Coffee size={12} />
                  Done
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
