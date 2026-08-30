import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

interface PodometerContextValue {
  selectedTaskId: string;
  setSelectedTaskId: (id: string) => void;
  elapsed: number;
  running: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setElapsed: (n: number) => void;
}

const PodometerContext = createContext<PodometerContextValue | undefined>(undefined);

const STORAGE_KEY = "devtask.podometer";

function load(): { selectedTaskId: string; elapsed: number; running: boolean; startTime: number | null } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function PodometerProvider({ children }: { children: ReactNode }) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(() => load()?.selectedTaskId ?? "");
  const [baseElapsed, setBaseElapsed] = useState<number>(() => load()?.elapsed ?? 0);
  const [running, setRunning] = useState<boolean>(() => load()?.running ?? false);
  const [startTime, setStartTime] = useState<number | null>(() => load()?.startTime ?? null);
  const [elapsed, setElapsed] = useState<number>(() => {
    const saved = load();
    if (saved?.running && saved.startTime) {
      return saved.elapsed + Math.floor((Date.now() - saved.startTime) / 1000);
    }
    return saved?.elapsed ?? 0;
  });

  const intervalRef = useRef<number | null>(null);

  // Persist to localStorage
  useEffect(() => {
    const data = { selectedTaskId, elapsed: baseElapsed, running, startTime };
    // For running, store baseElapsed and startTime; elapsed is derived
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [selectedTaskId, baseElapsed, running, startTime]);

  // Keep elapsed in sync when running (using wall time, survives tab switches)
  useEffect(() => {
    if (running && startTime !== null) {
      const tick = () => {
        setElapsed(baseElapsed + Math.floor((Date.now() - startTime) / 1000));
      };
      tick();
      intervalRef.current = window.setInterval(tick, 1000);
    } else if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, [running, startTime, baseElapsed]);

  // Android background: recalculate immediately when tab becomes visible / window regains focus
  useEffect(() => {
    if (!running || startTime === null) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setElapsed(baseElapsed + Math.floor((Date.now() - startTime) / 1000));
      }
    };
    const onFocus = () => {
      setElapsed(baseElapsed + Math.floor((Date.now() - startTime) / 1000));
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onFocus);
    };
  }, [running, startTime, baseElapsed]);

  // Keep screen awake on Android while running (Wake Lock API)
  useEffect(() => {
    let wakeLock: { release: () => Promise<void> } | null = null;
    if (running && "wakeLock" in navigator) {
      (navigator as unknown as { wakeLock: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock
        .request("screen")
        .then((wl) => {
          wakeLock = wl;
        })
        .catch(() => {});
    }
    return () => {
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, [running]);

  const start = useCallback(() => {
    if (running) return;
    setStartTime(Date.now());
    setRunning(true);
  }, [running]);

  const pause = useCallback(() => {
    if (!running || startTime === null) {
      setRunning(false);
      return;
    }
    const delta = Math.floor((Date.now() - startTime) / 1000);
    setBaseElapsed((b) => b + delta);
    setElapsed((e) => e); // will be recalculated, but keep
    setRunning(false);
    setStartTime(null);
  }, [running, startTime]);

  const reset = useCallback(() => {
    setBaseElapsed(0);
    setElapsed(0);
    setRunning(false);
    setStartTime(null);
  }, []);

  const setSelected = useCallback((id: string) => {
    setSelectedTaskId(id);
    // Do not reset elapsed when switching tasks? Reset to avoid carrying time to wrong task.
    // Keep elapsed/running as is, but user can reset manually. We reset elapsed when task changes to avoid confusion.
    // Uncomment to auto-reset on task switch:
    // setBaseElapsed(0); setElapsed(0); setRunning(false); setStartTime(null);
  }, []);

  // Wrapper to keep elapsed in sync for external set
  const setElapsedExternal = useCallback((n: number) => {
    setBaseElapsed(n);
    setElapsed(n);
    setRunning(false);
    setStartTime(null);
  }, []);

  return (
    <PodometerContext.Provider
      value={{
        selectedTaskId,
        setSelectedTaskId: setSelected,
        elapsed,
        running,
        start,
        pause,
        reset,
        setElapsed: setElapsedExternal,
      }}
    >
      {children}
    </PodometerContext.Provider>
  );
}

export function usePodometer(): PodometerContextValue {
  const ctx = useContext(PodometerContext);
  if (!ctx) throw new Error("usePodometer must be used inside PodometerProvider");
  return ctx;
}
