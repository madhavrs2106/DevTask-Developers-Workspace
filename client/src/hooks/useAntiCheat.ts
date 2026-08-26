import { useEffect, useState, useCallback } from "react";

interface AntiCheatOptions {
  quizId: string;
  enabled: boolean;
  onViolation?: () => void;
}

function getStorageKey(quizId: string) {
  return `quiz_violations_${quizId}`;
}

function getLockedKey(quizId: string) {
  return `quiz_locked_${quizId}`;
}

export function useAntiCheat({ quizId, enabled, onViolation }: AntiCheatOptions) {
  const [violations, setViolations] = useState(() => {
    try {
      return parseInt(localStorage.getItem(getStorageKey(quizId)) ?? "0", 10);
    } catch {
      return 0;
    }
  });
  const [isLocked, setIsLocked] = useState(() => {
    try {
      return localStorage.getItem(getLockedKey(quizId)) === "true";
    } catch {
      return false;
    }
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  const persistViolations = useCallback(
    (count: number) => {
      try {
        localStorage.setItem(getStorageKey(quizId), String(count));
      } catch {}
    },
    [quizId]
  );

  const persistLocked = useCallback(
    (locked: boolean) => {
      try {
        localStorage.setItem(getLockedKey(quizId), locked ? "true" : "false");
      } catch {}
    },
    [quizId]
  );

  const triggerViolation = useCallback(
    (message: string) => {
      if (!enabled || isLocked) return;
      const next = violations + 1;
      setViolations(next);
      persistViolations(next);
      setWarningMessage(message);
      setShowWarning(true);
      onViolation?.();
      if (next >= 1) {
        setIsLocked(true);
        persistLocked(true);
      }
      setTimeout(() => setShowWarning(false), 3000);
    },
    [enabled, isLocked, violations, persistViolations, persistLocked, onViolation]
  );

  // Tab visibility detection
  useEffect(() => {
    if (!enabled || isLocked) return;

    const handleVisibility = () => {
      if (document.hidden) {
        triggerViolation("Tab switch detected! Stay on this tab during the quiz.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled, isLocked, triggerViolation]);

  // Window blur detection (switching to another window)
  useEffect(() => {
    if (!enabled || isLocked) return;

    const handleBlur = () => {
      triggerViolation("Window focus lost! Do not switch windows during the quiz.");
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [enabled, isLocked, triggerViolation]);

  // Block keyboard shortcuts for screenshots and dev tools
  useEffect(() => {
    if (!enabled || isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        triggerViolation("Screenshots are not allowed during the quiz.");
        return;
      }

      // Block Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault();
        triggerViolation("Developer tools are not allowed during the quiz.");
        return;
      }

      // Block Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === "J") {
        e.preventDefault();
        triggerViolation("Console access is not allowed during the quiz.");
        return;
      }

      // Block Ctrl+U (View Source)
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
        triggerViolation("View source is not allowed during the quiz.");
        return;
      }

      // Block Ctrl+P (Print)
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        triggerViolation("Printing is not allowed during the quiz.");
        return;
      }

      // Block Ctrl+S (Save)
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        triggerViolation("Saving is not allowed during the quiz.");
        return;
      }

      // Block Alt+PrintScreen
      if (e.altKey && e.key === "PrintScreen") {
        e.preventDefault();
        triggerViolation("Screenshots are not allowed during the quiz.");
        return;
      }

      // Block Win key (meta)
      if (e.key === "Meta") {
        e.preventDefault();
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, isLocked, triggerViolation]);

  // Block right-click context menu
  useEffect(() => {
    if (!enabled || isLocked) return;

    const handleContextMenu = (e: Event) => {
      e.preventDefault();
      triggerViolation("Right-click is disabled during the quiz.");
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, [enabled, isLocked, triggerViolation]);

  // Block text selection on quiz content (reduces Google Lens usage)
  useEffect(() => {
    if (!enabled || isLocked) return;

    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
        e.preventDefault();
      }
    };

    document.addEventListener("selectstart", handleSelectStart);
    return () => document.removeEventListener("selectstart", handleSelectStart);
  }, [enabled, isLocked]);

  // Request fullscreen
  const requestFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch {
      // Fullscreen not supported or denied
    }
  }, []);

  // Exit fullscreen
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Clear lock/violations when quiz is submitted successfully
  const clearLock = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey(quizId));
      localStorage.removeItem(getLockedKey(quizId));
    } catch {}
    setViolations(0);
    setIsLocked(false);
  }, [quizId]);

  return {
    violations,
    isLocked,
    showWarning,
    warningMessage,
    isFullscreen,
    requestFullscreen,
    exitFullscreen,
    clearLock,
  };
}
