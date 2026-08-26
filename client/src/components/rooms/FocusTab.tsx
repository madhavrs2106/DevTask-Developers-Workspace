import { useState, useEffect, useRef } from "react";
import { useStartFocusSession, useUpdateFocusStatus } from "../../hooks/useQueries";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
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
  }, [session.endsAt, session.status, session.id]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = 1 - remaining / (session.duration * 60);

  return (
    <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
      <div className="flex items-center gap-3">
        {session.user.avatarUrl ? (
          <img
            src={session.user.avatarUrl}
            alt={session.user.username}
            className="w-8 h-8 rounded-full object-cover shrink-0"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ backgroundColor: session.user.avatarColor }}
          >
            {session.user.username[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{session.task}</p>
          <p className="text-xs text-[var(--text-secondary)]">{session.user.username}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-lg font-mono font-bold ${remaining <= 60 ? "text-red-400" : "text-[var(--accent)]"}`}>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
          {session.status === "PAUSED" && (
            <span className="text-xs text-yellow-400">Paused</span>
          )}
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-2 h-1 bg-[var(--bg)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-1000"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      {/* Controls for own session */}
      {isOwn && session.status !== "COMPLETED" && (
        <div className="flex gap-2 mt-2">
          {session.status === "ACTIVE" ? (
            <Button
              variant="ghost"
              onClick={() => updateStatus.mutateAsync({ sessionId: session.id, status: "PAUSED" })}
              className="text-xs px-2 py-1"
            >
              Pause
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => updateStatus.mutateAsync({ sessionId: session.id, status: "ACTIVE" })}
              className="text-xs px-2 py-1"
            >
              Resume
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => updateStatus.mutateAsync({ sessionId: session.id, status: "COMPLETED" })}
            className="text-xs px-2 py-1 text-red-400"
          >
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

  return (
    <div>
      <h2 className="font-semibold text-[var(--text-primary)] mb-4">Synchronized Focus Sessions</h2>

      <form onSubmit={handleStart} className="mb-6 flex gap-2">
        <input
          className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="What are you focusing on?"
          required
        />
        <select
          className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        >
          <option value={15}>15m</option>
          <option value={25}>25m</option>
          <option value={45}>45m</option>
          <option value={60}>60m</option>
        </select>
        <Button variant="primary" type="submit" disabled={!task.trim() || startSession.isPending} className="text-sm shrink-0">
          {startSession.isPending ? "Starting..." : "Start"}
        </Button>
      </form>

      {activeSessions.length === 0 ? (
        <p className="text-[var(--text-secondary)] text-sm py-8 text-center">
          No active focus sessions. Start one to focus together with your group.
        </p>
      ) : (
        <div className="space-y-2">
          {activeSessions.map((session) => (
            <FocusTimer key={session.id} session={session} roomId={room.id} />
          ))}
        </div>
      )}
    </div>
  );
}
