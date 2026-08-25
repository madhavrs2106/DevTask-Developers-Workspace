import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Square, Terminal, Loader2, AlertTriangle } from "lucide-react";
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
    js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    py: "python", html: "html", htm: "html", css: "css", json: "json", sh: "shell", bash: "shell",
  };
  return map[ext] || ext;
}

export function CodeRunner({ code, language, fileName }: Props) {
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [outputHeight, setOutputHeight] = useState(160);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pyodideRef = useRef<any>(null);

  const lang = language === "unknown" ? getLanguageFromFileName(fileName) : language;

  const addLine = useCallback((type: ConsoleLine["type"], content: string) => {
    setConsoleLines((prev) => [...prev, { type, content, timestamp: Date.now() }]);
  }, []);

  const clearConsole = useCallback(() => setConsoleLines([]), []);

  const stopExecution = useCallback(() => {
    if (iframeRef.current) iframeRef.current.srcdoc = "";
    setIsRunning(false);
  }, []);

  // JavaScript
  const runJavaScript = useCallback(() => {
    clearConsole();
    setIsRunning(true);
    const html = `<!DOCTYPE html><html><head><script>
(function() {
  const send = (t, m) => parent.postMessage({ type: 'console', level: t, message: String(m) }, '*');
  console.log = (...a) => send('log', a.map(x => typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x)).join(' '));
  console.error = (...a) => send('error', a.map(String).join(' '));
  console.warn = (...a) => send('warn', a.map(String).join(' '));
  console.info = (...a) => send('info', a.map(String).join(' '));
  window.onerror = (m, u, l) => send('error', m + (l ? ' (line ' + l + ')' : ''));
  try {
    const code = ${JSON.stringify(code)};
    const fn = new Function(code);
    const result = fn();
    if (result !== undefined) send('result', typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
  } catch(e) { send('error', e.message); }
  parent.postMessage({ type: 'done' }, '*');
})();
</script></head><body></body></html>`;
    if (iframeRef.current) iframeRef.current.srcdoc = html;
  }, [code, clearConsole]);

  // HTML
  const runHtml = useCallback(() => {
    clearConsole();
    setIsRunning(true);
    const html = `<!DOCTYPE html><html><head></head><body>
<script>
  const send = (t, m) => parent.postMessage({ type: 'console', level: t, message: String(m) }, '*');
  console.log = (...a) => send('log', a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' '));
  console.error = (...a) => send('error', a.map(String).join(' '));
  window.onerror = (m) => send('error', m);
</script>
${code}
<script>parent.postMessage({ type: 'done' }, '*');</script>
</body></html>`;
    if (iframeRef.current) iframeRef.current.srcdoc = html;
  }, [code, clearConsole]);

  // Python with auto-install via micropip
  const runPython = useCallback(async () => {
    clearConsole();
    setIsRunning(true);
    addLine("info", "Loading Python runtime (Pyodide)...");
    try {
      if (!pyodideRef.current) {
        if (!(window as any).loadPyodide) {
          const s = document.createElement("script");
          s.src = PYTHON_CDN;
          document.head.appendChild(s);
          await new Promise((r, j) => { s.onload = r; s.onerror = () => j(new Error("Failed to load Pyodide")); });
        }
        pyodideRef.current = await (window as any).loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
        });
        // Load micropip for auto-installing packages
        await pyodideRef.current.loadPackage("micropip");
        addLine("info", "Python runtime ready. Auto-installing packages if needed...");
      }

      // Wrap code with auto-import handler
      const wrappedCode = `
import micropip
import sys
import importlib

# Known Pyodide built-in packages
_builtins = [
    "js", "pyodide", "micropip", "numpy", "pandas", "matplotlib",
    "scipy", "sympy", "scikit-learn", "requests", "beautifulsoup4",
    "lxml", "regex", "pillow", "openpyxl", "xlrd", "bokeh",
    "h5py", "numba", "astropy", "statsmodels", "networkx",
    "joblib", "threadpoolctl", "cv2", "imageio", "nltk", "spacy",
    "cloudpickle", "dask", "fsspec", "zarr", "xarray",
    "pytz", "dateutil", "six", "attr", "werkzeug", "click",
    "jinja2", "markupsafe", "itsdangerous", "flask", "bottle",
    "fastapi", "starlette", "httpx", "aiohttp", "tqdm",
    "tabulate", "rich", "colorama", "pygments", "ipython",
    "matplotlib_inline", "jupyter_core", "nbformat", "nbconvert",
    "ipywidgets", "traitlets", "json5", "yaml", "tomli", "tomllib",
]

# Override import to auto-install missing packages via micropip
_real_import = builtins.__import__ if hasattr(builtins, '__import__') else __builtins__.__import__

class AutoImporter:
    def find_module(self, name, path=None):
        if name in _builtins:
            return None
        return self
    
    def load_module(self, name):
        if name in sys.modules:
            return sys.modules[name]
        # Try to install via micropip
        import asyncio
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Create a new loop for installation
            loop2 = asyncio.new_event_loop()
            try:
                loop2.run_until_complete(micropip.install(name))
            finally:
                loop2.close()
        else:
            loop.run_until_complete(micropip.install(name))
        return importlib.import_module(name)

# Register the importer
sys.meta_path.insert(0, AutoImporter())

${code}
`;
      addLine("info", "Running...");
      pyodideRef.current.setStdout({ batched: (m: string) => addLine("log", m) });
      pyodideRef.current.setStderr({ batched: (m: string) => addLine("error", m) });
      const result = await pyodideRef.current.runPythonAsync(wrappedCode);
      if (result !== undefined) addLine("result", String(result));
      addLine("log", "\n--- Execution complete ---");
    } catch (e: any) {
      addLine("error", e.message);
    } finally {
      setIsRunning(false);
    }
  }, [code, clearConsole, addLine]);

  // Message handler
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "console") addLine(e.data.level, e.data.message);
      if (e.data?.type === "done") { setIsRunning(false); addLine("log", "\n--- Execution complete ---"); }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [addLine]);

  const handleRun = () => {
    switch (lang) {
      case "javascript": case "js": case "typescript": case "ts": runJavaScript(); break;
      case "html": case "htm": runHtml(); break;
      case "python": case "py": runPython(); break;
      default: clearConsole(); addLine("warn", `Not supported for "${lang}". Use JS, HTML, or Python.`);
    }
  };

  const canRun = ["javascript", "js", "typescript", "ts", "html", "htm", "python", "py"].includes(lang);

  if (!canRun) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-[#252526] text-[#cca700] text-[12px]">
        <AlertTriangle size={14} />
        Run not available for {lang}
      </div>
    );
  }

  return (
    <div className="bg-[#1e1e1e]">
      {/* Controls bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-t border-[#3c3c3c]">
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-[#858585]" />
          <span className="text-[11px] text-[#858585]">Console</span>
          <span className="text-[10px] text-[#555]">({consoleLines.length} lines)</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearConsole} className="px-2 py-0.5 text-[11px] text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c] rounded transition-colors">
            Clear
          </button>
          {isRunning ? (
            <button onClick={stopExecution} className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-[#f44336] hover:bg-[#3c3c3c] rounded transition-colors">
              <Square size={11} fill="currentColor" /> Stop
            </button>
          ) : (
            <button onClick={handleRun} className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-[#4caf50] hover:bg-[#3c3c3c] rounded transition-colors">
              <Play size={11} fill="currentColor" /> Run
            </button>
          )}
        </div>
      </div>

      {/* Output area */}
      <div className="bg-[#1e1e1e] border-t border-[#3c3c3c] overflow-hidden" style={{ height: outputHeight }}>
        <div className="h-full overflow-auto p-3 font-mono text-[12px] leading-[1.6]">
          {consoleLines.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[#555] text-[11px]">
              Output will appear here
            </div>
          ) : (
            consoleLines.map((line, i) => (
              <div key={i} className={cn("whitespace-pre-wrap break-all",
                line.type === "error" && "text-[#f44336]",
                line.type === "warn" && "text-[#e8a317]",
                line.type === "info" && "text-[#3794ff]",
                line.type === "log" && "text-[#cccccc]",
                line.type === "result" && "text-[#4ec9b0]"
              )}>
                {line.content}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Resize handle */}
      <div
        className="h-1 bg-[#252526] hover:bg-[#007acc]/40 cursor-ns-resize transition-colors"
        onMouseDown={(e) => {
          e.preventDefault();
          const startY = e.clientY;
          const startH = outputHeight;
          const onMove = (ev: MouseEvent) => setOutputHeight(Math.max(60, Math.min(400, startH + (ev.clientY - startY))));
          const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }}
      />

      {/* Hidden iframe */}
      <iframe ref={iframeRef} className="hidden" sandbox="allow-scripts" title="runner" />
    </div>
  );
}
