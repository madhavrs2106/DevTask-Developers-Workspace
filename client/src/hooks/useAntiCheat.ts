import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";

interface AntiCheatOptions {
  roomId: string;
  quizId: string;
  enabled: boolean;
  isLocked: boolean;
  onViolation?: () => void;
}

export function useAntiCheat({ roomId, quizId, enabled, isLocked: backendLocked, onViolation }: AntiCheatOptions) {
  const [isLocked, setIsLocked] = useState(backendLocked);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  // Sync with backend lock state
  useEffect(() => {
    if (backendLocked) {
      setIsLocked(true);
    }
  }, [backendLocked]);

  const triggerViolation = useCallback(
    async (message: string) => {
      if (!enabled || isLocked) return;
      try {
        await api.post(`/rooms/${roomId}/quizzes/${quizId}/lock`);
      } catch {}
      setIsLocked(true);
      setWarningMessage(message);
      setShowWarning(true);
      onViolation?.();
      setTimeout(() => setShowWarning(false), 3000);
    },
    [enabled, isLocked, roomId, quizId, onViolation]
  );

  // Tab visibility detection
  useEffect(() => {
    if (!enabled || isLocked) return;

    const handleVisibility = () => {
      if (document.hidden) {
        triggerViolation("Tab switch detected! Quiz locked. Contact admin to unlock.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled, isLocked, triggerViolation]);

  // Window blur detection
  useEffect(() => {
    if (!enabled || isLocked) return;

    const handleBlur = () => {
      triggerViolation("Window focus lost! Quiz locked. Contact admin to unlock.");
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [enabled, isLocked, triggerViolation]);

  // Block keyboard shortcuts
  useEffect(() => {
    if (!enabled || isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        e.preventDefault();
        triggerViolation("Screenshots blocked! Quiz locked. Contact admin to unlock.");
        return;
      }
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault();
        triggerViolation("DevTools blocked! Quiz locked. Contact admin to unlock.");
        return;
      }
      if (e.ctrlKey && e.shiftKey && e.key === "J") {
        e.preventDefault();
        triggerViolation("Console blocked! Quiz locked. Contact admin to unlock.");
        return;
      }
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
        triggerViolation("View source blocked! Quiz locked. Contact admin to unlock.");
        return;
      }
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        triggerViolation("Print blocked! Quiz locked. Contact admin to unlock.");
        return;
      }
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        triggerViolation("Save blocked! Quiz locked. Contact admin to unlock.");
        return;
      }
      if (e.altKey && e.key === "PrintScreen") {
        e.preventDefault();
        triggerViolation("Screenshots blocked! Quiz locked. Contact admin to unlock.");
        return;
      }
      if (e.key === "Meta") {
        e.preventDefault();
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, isLocked, triggerViolation]);

  // Block right-click
  useEffect(() => {
    if (!enabled || isLocked) return;

    const handleContextMenu = (e: Event) => {
      e.preventDefault();
      triggerViolation("Right-click blocked! Quiz locked. Contact admin to unlock.");
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, [enabled, isLocked, triggerViolation]);

  // Block text selection
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
    } catch {}
  }, []);

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return {
    isLocked,
    showWarning,
    warningMessage,
    isFullscreen,
    requestFullscreen,
  };
}
