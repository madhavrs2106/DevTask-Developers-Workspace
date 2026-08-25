import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Square, Terminal, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

interface Props {
  code: string;
  language: string;
  fileName?: string;
}

interface ConsoleLine {
  type: "log" | "error" | "warn" | "info" | "result";
  content: string;
  timestamp: number;
}

const PYTHON_CDN = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";

function getLanguageFromFileName(fileName?: string): string {
  if (!fileName) return "unknown";
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    html: "html",
    htm: "html",
    css: "css",
    json: "json",
    sh: "shell",
    bash: "shell",
  };
  return map[ext] || ext;
}

function ConsoleOutput({ lines }: { lines: ConsoleLine[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  if (lines.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-secondary)] text-xs">
        <Terminal size={14} className="mr-1.5 opacity-50" />
        Output will appear here
      </div>
    );
  }

  return (
    <div className="p-3 space-y-1 overflow-auto h-full font-mono text-xs">
      {lines.map((line, i) => (
        <div
          key={i}
          className={cn(
            "whitespace-pre-wrap break-all",
            line.type === "error" && "text-red-400",
            line.type === "warn" && "text-yellow-400",
            line.type === "info" && "text-blue-400",
            line.type === "log" && "text-[var(--text-primary)]",
            line.type === "result" && "text-green-400"
          )}
        >
          {line.content}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

export function CodeRunner({ code, language, fileName }: Props) {
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [outputHeight, setOutputHeight] = useState(150);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pyodideRef = useRef<any>(null);

  const lang = language === "unknown" ? getLanguageFromFileName(fileName) : language;

  const addLine = useCallback((type: ConsoleLine["type"], content: string) => {
    setConsoleLines((prev) => [...prev, { type, content, timestamp: Date.now() }]);
  }, []);

  const clearConsole = useCallback(() => {
    setConsoleLines([]);
  }, []);

  const stopExecution = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = "";
    }
    setIsRunning(false);
  }, []);

  // JavaScript execution
  const runJavaScript = useCallback(() => {
    clearConsole();
    setIsRunning(true);

    const html = `<!DOCTYPE html>
<html><head><script>
(function() {
  const send = (type, msg) => {
    parent.postMessage({ type: 'console', level: type, message: String(msg) }, '*');
  };
  
  const handlers = {
    log: (...args) => send('log', args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
    error: (...args) => send('error', args.map(a => String(a)).join(' ')),
    warn: (...args) => send('warn', args.map(a => String(a)).join(' ')),
    info: (...args) => send('info', args.map(a => String(a)).join(' ')),
  };
  
  console.log = handlers.log;
  console.error = handlers.error;
  console.warn = handlers.warn;
  console.info = handlers.info;
  
  window.onerror = (msg, url, line, col, err) => {
    send('error', msg + (line ? ' (line ' + line + ')' : ''));
  };
  
  try {
    const result = ${JSON.stringify(code)};
    const executed = new Function(result)();
    if (executed !== undefined) {
      send('result', typeof executed === 'object' ? JSON.stringify(executed, null, 2) : String(executed));
    }
    send('log', '\\n--- Execution complete ---');
  } catch(e) {
    send('error', e.message);
  }
  
  parent.postMessage({ type: 'done' }, '*');
})();
</script></head><body></body></html>`;

    if (iframeRef.current) {
      iframeRef.current.srcdoc = html;
    }
  }, [code, clearConsole]);

  // HTML execution
  const runHtml = useCallback(() => {
    clearConsole();
    setIsRunning(true);

    const html = `<!DOCTYPE html>
<html><head>
<style>${lang === "html" ? "" : ""}</style>
</head><body>
<script>
  const send = (type, msg) => parent.postMessage({ type: 'console', level: type, message: String(msg) }, '*');
  console.log = (...args) => send('log', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  console.error = (...args) => send('error', args.map(a => String(a)).join(' '));
  window.onerror = (msg) => { send('error', msg); };
</script>
${code}
<script>parent.postMessage({ type: 'done' }, '*');</script>
</body></html>`;

    if (iframeRef.current) {
      iframeRef.current.srcdoc = html;
    }
  }, [code, clearConsole, lang]);

  // Python execution via Pyodide
  const runPython = useCallback(async () => {
    clearConsole();
    setIsRunning(true);
    addLine("info", "Loading Python runtime (Pyodide)...");

    try {
      if (!pyodideRef.current) {
        // Load Pyodide if not already loaded
        if (!(window as any).loadPyodide) {
          const script = document.createElement("script");
          script.src = PYTHON_CDN;
          document.head.appendChild(script);
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error("Failed to load Pyodide"));
          });
        }
        pyodideRef.current = await (window as any).loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
        });
      }

      addLine("info", "Running Python...");

      // Capture stdout/stderr
      pyodideRef.current.setStdout({ batched: (msg: string) => addLine("log", msg) });
      pyodideRef.current.setStderr({ batched: (msg: string) => addLine("error", msg) });

      const result = await pyodideRef.current.runPythonAsync(code);
      if (result !== undefined) {
        addLine("result", String(result));
      }
      addLine("log", "\n--- Execution complete ---");
    } catch (e: any) {
      addLine("error", e.message);
    } finally {
      setIsRunning(false);
    }
  }, [code, clearConsole, addLine]);

  // Message handler for JS/HTML execution
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "console") {
        addLine(e.data.level, e.data.message);
      }
      if (e.data?.type === "done") {
        setIsRunning(false);
        addLine("log", "\n--- Execution complete ---");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [addLine]);

  const handleRun = () => {
    switch (lang) {
      case "javascript":
      case "js":
      case "typescript":
      case "ts":
        runJavaScript();
        break;
      case "html":
      case "htm":
        runHtml();
        break;
      case "python":
      case "py":
        runPython();
        break;
      default:
        clearConsole();
        addLine("warn", `Execution not supported for "${lang}" yet. Supported: JavaScript, HTML, Python.`);
    }
  };

  const canRun = ["javascript", "js", "typescript", "ts", "html", "htm", "python", "py"].includes(lang);

  if (!canRun) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs">
        <AlertTriangle size={14} />
        Run not available for {lang}. Supported: JavaScript, HTML, Python.
      </div>
    );
  }

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Controls */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-card)] border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-[var(--text-secondary)]" />
          <span className="text-xs text-[var(--text-secondary)]">Console</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={clearConsole}
            className="text-xs px-2 py-1"
          >
            Clear
          </Button>
          {isRunning ? (
            <Button
              variant="ghost"
              onClick={stopExecution}
              className="text-xs px-2 py-1 text-red-400 gap-1"
            >
              <Square size={12} />
              Stop
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleRun}
              className="text-xs px-3 py-1 gap-1.5"
            >
              <Play size={12} />
              Run
            </Button>
          )}
        </div>
      </div>

      {/* Console output */}
      <div
        className="bg-[var(--bg)] border-b border-[var(--border)]"
        style={{ height: outputHeight }}
      >
        <ConsoleOutput lines={consoleLines} />
      </div>

      {/* Resize handle */}
      <div
        className="h-1 bg-[var(--bg-card)] hover:bg-[var(--accent)]/30 cursor-ns-resize transition-colors"
        onMouseDown={(e) => {
          e.preventDefault();
          const startY = e.clientY;
          const startHeight = outputHeight;
          const onMove = (e: MouseEvent) => {
            const delta = e.clientY - startY;
            setOutputHeight(Math.max(80, Math.min(400, startHeight + delta)));
          };
          const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
          };
          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }}
      />

      {/* Hidden iframe for JS/HTML execution */}
      <iframe
        ref={iframeRef}
        className="hidden"
        sandbox="allow-scripts"
        title="code-executor"
      />
    </div>
  );
}
