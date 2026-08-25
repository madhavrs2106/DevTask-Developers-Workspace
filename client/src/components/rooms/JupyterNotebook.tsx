import { useState, useCallback, useRef, useEffect } from "react";
import { Play, Plus, Trash2, ChevronUp, ChevronDown, Loader2, Square, Copy, Check } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

interface Cell {
  id: string;
  source: string;
  cellType: "code" | "markdown";
  output?: string;
  error?: string;
  running: boolean;
}

interface JupyterNotebookProps {
  initialContent?: string;
  readOnly?: boolean;
}

function parseNotebook(content: string): Cell[] {
  try {
    const nb = JSON.parse(content);
    if (nb.cells && Array.isArray(nb.cells)) {
      return nb.cells.map((cell: any, i: number) => ({
        id: `cell-${i}`,
        source: Array.isArray(cell.source) ? cell.source.join("") : cell.source || "",
        cellType: cell.cell_type === "markdown" ? "markdown" : "code",
        running: false,
      }));
    }
  } catch {}
  return [{ id: "cell-0", source: content || "", cellType: "code", running: false }];
}

function cellsToNotebook(cells: Cell[]): string {
  return JSON.stringify(
    {
      nbformat: 4,
      nbformat_minor: 5,
      metadata: {
        kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
        language_info: { name: "python", version: "3.10.0" },
      },
      cells: cells.map((c) => ({
        cell_type: c.cellType,
        source: c.source.split("\n").map((line, i, arr) => (i < arr.length - 1 ? line + "\n" : line)),
        metadata: {},
        outputs: [],
      })),
    },
    null,
    2
  );
}

function renderMarkdown(text: string): string {
  let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="pycharm-md-code"><code>$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code class="pycharm-md-inline">$1</code>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="pycharm-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="pycharm-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="pycharm-h1">$1</h1>');
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="pycharm-link">$1</a>');
  html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="pycharm-quote">$1</blockquote>');
  html = html.replace(/^---+$/gm, '<hr class="pycharm-hr" />');
  html = html.replace(/\n/g, "<br />");
  return html;
}

const PYTHON_CDN = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";

const PYCHARM_STYLES = `
  .pycharm-md-code { background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; padding: 10px 14px; margin: 6px 0; font-family: 'JetBrains Mono', monospace; font-size: 13px; overflow-x: auto; }
  .pycharm-md-code code { color: #333; }
  .pycharm-md-inline { background: #f0f0f0; padding: 1px 5px; border-radius: 3px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #c7254e; }
  .pycharm-h1 { font-size: 1.4em; font-weight: 600; margin: 12px 0 6px; color: #1a1a1a; }
  .pycharm-h2 { font-size: 1.2em; font-weight: 600; margin: 10px 0 5px; color: #1a1a1a; }
  .pycharm-h3 { font-size: 1.05em; font-weight: 600; margin: 8px 0 4px; color: #1a1a1a; }
  .pycharm-link { color: #1a73e8; text-decoration: none; }
  .pycharm-link:hover { text-decoration: underline; }
  .pycharm-quote { border-left: 3px solid #4caf50; padding: 4px 12px; margin: 6px 0; color: #555; background: #f9f9f0; border-radius: 0 4px 4px 0; }
  .pycharm-hr { border: none; border-top: 1px solid #e0e0e0; margin: 12px 0; }
`;

const KERNEL_STYLES = `
  .kernel-dot { width: 8px; height: 8px; border-radius: 50%; }
  .kernel-dot-idle { background: #4caf50; }
  .kernel-dot-busy { background: #ff9800; animation: kernel-pulse 1s infinite; }
  .kernel-dot-dead { background: #f44336; }
  @keyframes kernel-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
`;

export function JupyterNotebook({ initialContent, readOnly = false }: JupyterNotebookProps) {
  const [cells, setCells] = useState<Cell[]>(() => parseNotebook(initialContent || ""));
  const [pyodide, setPyodide] = useState<any>(null);
  const [loadingPyodide, setLoadingPyodide] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const pyodideRef = useRef<any>(null);

  useEffect(() => {
    setCells(parseNotebook(initialContent || ""));
  }, [initialContent]);

  const ensurePyodide = useCallback(async () => {
    if (pyodideRef.current) return pyodideRef.current;
    setLoadingPyodide(true);
    try {
      if (!(window as any).loadPyodide) {
        const script = document.createElement("script");
        script.src = PYTHON_CDN;
        document.head.appendChild(script);
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error("Failed to load Pyodide"));
        });
      }
      const py = await (window as any).loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
      });
      pyodideRef.current = py;
      setPyodide(py);
      return py;
    } finally {
      setLoadingPyodide(false);
    }
  }, []);

  const runCell = useCallback(
    async (cellId: string) => {
      const cell = cells.find((c) => c.id === cellId);
      if (!cell || cell.cellType !== "code" || !cell.source.trim()) return;

      setCells((prev) =>
        prev.map((c) => (c.id === cellId ? { ...c, running: true, output: undefined, error: undefined } : c))
      );

      try {
        const py = await ensurePyodide();
        let output = "";
        let error = "";

        py.setStdout({ batched: (msg: string) => { output += msg + "\n"; } });
        py.setStderr({ batched: (msg: string) => { error += msg + "\n"; } });

        try {
          const result = await py.runPythonAsync(cell.source);
          if (result !== undefined && result !== "") {
            output += String(result) + "\n";
          }
        } catch (e: any) {
          error += e.message;
        }

        setCells((prev) =>
          prev.map((c) =>
            c.id === cellId
              ? { ...c, running: false, output: output.trim() || undefined, error: error.trim() || undefined }
              : c
          )
        );
      } catch (e: any) {
        setCells((prev) =>
          prev.map((c) => (c.id === cellId ? { ...c, running: false, error: e.message } : c))
        );
      }
    },
    [cells, ensurePyodide]
  );

  const stopCell = useCallback((cellId: string) => {
    setCells((prev) =>
      prev.map((c) => (c.id === cellId ? { ...c, running: false } : c))
    );
  }, []);

  const runAllCells = useCallback(async () => {
    for (const cell of cells) {
      if (cell.cellType === "code" && cell.source.trim()) {
        await runCell(cell.id);
      }
    }
  }, [cells, runCell]);

  const addCell = useCallback((afterIndex: number, cellType: "code" | "markdown" = "code") => {
    setCells((prev) => {
      const next = [...prev];
      next.splice(afterIndex + 1, 0, { id: `cell-${Date.now()}`, source: "", cellType, running: false });
      return next;
    });
  }, []);

  const deleteCell = useCallback((cellId: string) => {
    setCells((prev) => prev.filter((c) => c.id !== cellId));
  }, []);

  const moveCell = useCallback((cellId: string, direction: "up" | "down") => {
    setCells((prev) => {
      const idx = prev.findIndex((c) => c.id === cellId);
      if (idx === -1) return prev;
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, []);

  const updateCellSource = useCallback((cellId: string, source: string) => {
    setCells((prev) => prev.map((c) => (c.id === cellId ? { ...c, source } : c)));
  }, []);

  const copyCell = useCallback((cellId: string) => {
    const cell = cells.find((c) => c.id === cellId);
    if (cell) {
      navigator.clipboard.writeText(cell.source);
      setCopiedCell(cellId);
      setTimeout(() => setCopiedCell(null), 1500);
    }
  }, [cells]);

  const exportNotebook = useCallback(() => {
    const blob = new Blob([cellsToNotebook(cells)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notebook.ipynb";
    a.click();
    URL.revokeObjectURL(url);
  }, [cells]);

  const isRunning = cells.some((c) => c.running);

  return (
    <div className="flex flex-col h-full bg-white">
      <style>{PYCHARM_STYLES}{KERNEL_STYLES}</style>

      {/* Toolbar — PyCharm style */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-[#f8f8f8] border-b border-[#e0e0e0]">
        {/* Kernel status */}
        <div className="flex items-center gap-1.5 px-2 py-1 mr-2">
          <div className={cn("kernel-dot", loadingPyodide ? "kernel-dot-busy" : pyodide ? "kernel-dot-idle" : "kernel-dot-dead")} />
          <span className="text-[11px] text-[#666]">
            {loadingPyodide ? "Starting..." : pyodide ? "Python 3" : "Not connected"}
          </span>
        </div>

        <div className="w-px h-4 bg-[#ddd] mx-1" />

        {/* Run controls */}
        <button
          onClick={() => { const activeCell = cells.find(c => c.running); if (activeCell) stopCell(activeCell.id); else { const firstCode = cells.find(c => c.cellType === "code"); if (firstCode) runCell(firstCode.id); } }}
          className={cn("flex items-center gap-1 px-2 py-1 rounded text-[12px] transition-colors",
            isRunning ? "bg-[#fff3e0] text-[#e65100] hover:bg-[#ffe0b2]" : "text-[#333] hover:bg-[#e8e8e8]")}
          title={isRunning ? "Interrupt" : "Run"}
        >
          {isRunning ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" className="text-[#4caf50]" />}
        </button>

        <button onClick={runAllCells} disabled={loadingPyodide || isRunning}
          className="flex items-center gap-1 px-2 py-1 rounded text-[12px] text-[#333] hover:bg-[#e8e8e8] disabled:opacity-50"
          title="Run All">
          <Play size={12} className="text-[#4caf50]" />
          <span>Run All</span>
        </button>

        <div className="w-px h-4 bg-[#ddd] mx-1" />

        {/* Add cell */}
        <button onClick={() => addCell(cells.length - 1, "code")}
          className="flex items-center gap-1 px-2 py-1 rounded text-[12px] text-[#333] hover:bg-[#e8e8e8]"
          title="Add Code Cell">
          <Plus size={13} />
          <span>Code</span>
        </button>
        <button onClick={() => addCell(cells.length - 1, "markdown")}
          className="flex items-center gap-1 px-2 py-1 rounded text-[12px] text-[#333] hover:bg-[#e8e8e8]"
          title="Add Markdown Cell">
          <Plus size={13} />
          <span>Text</span>
        </button>

        <div className="flex-1" />

        {/* Export */}
        <button onClick={exportNotebook}
          className="flex items-center gap-1 px-2 py-1 rounded text-[12px] text-[#666] hover:bg-[#e8e8e8]">
          Export
        </button>
      </div>

      {/* Cells */}
      <div className="flex-1 overflow-auto bg-[#ffffff]">
        <div className="max-w-[900px] mx-auto py-2">
          {cells.map((cell, index) => (
            <div
              key={cell.id}
              className="group"
              onMouseEnter={() => setHoveredCell(cell.id)}
              onMouseLeave={() => setHoveredCell(null)}
            >
              {cell.cellType === "code" ? (
                /* ── Code Cell (PyCharm style) ── */
                <div className={cn("mx-2 mb-2 border rounded-md overflow-hidden transition-shadow",
                  cell.running ? "border-[#ff9800] shadow-[0_0_0_1px_#ff9800]" : "border-[#e0e0e0] hover:border-[#bbb]")}>
                  {/* Cell toolbar */}
                  <div className="flex items-center h-[28px] px-2 bg-[#f8f8f8] border-b border-[#e0e0e0]">
                    <span className="text-[11px] font-mono text-[#888] mr-2">[{index + 1}]</span>

                    {/* Run button */}
                    {!readOnly && (
                      <button
                        onClick={() => cell.running ? stopCell(cell.id) : runCell(cell.id)}
                        disabled={loadingPyodide}
                        className={cn("p-0.5 rounded transition-colors", cell.running ? "text-[#e65100] hover:bg-[#fff3e0]" : "text-[#4caf50] hover:bg-[#e8f5e9]")}
                        title={cell.running ? "Stop" : "Run"}
                      >
                        {cell.running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} fill="currentColor" />}
                      </button>
                    )}

                    <div className="flex-1" />

                    {/* Cell actions — visible on hover */}
                    <div className={cn("flex items-center gap-0.5 transition-opacity", hoveredCell === cell.id ? "opacity-100" : "opacity-0")}>
                      <button onClick={() => copyCell(cell.id)} className="p-0.5 rounded text-[#888] hover:text-[#333] hover:bg-[#e8e8e8]" title="Copy cell">
                        {copiedCell === cell.id ? <Check size={12} className="text-[#4caf50]" /> : <Copy size={12} />}
                      </button>
                      <button onClick={() => moveCell(cell.id, "up")} disabled={index === 0} className="p-0.5 rounded text-[#888] hover:text-[#333] hover:bg-[#e8e8e8] disabled:opacity-30" title="Move up">
                        <ChevronUp size={12} />
                      </button>
                      <button onClick={() => moveCell(cell.id, "down")} disabled={index === cells.length - 1} className="p-0.5 rounded text-[#888] hover:text-[#333] hover:bg-[#e8e8e8] disabled:opacity-30" title="Move down">
                        <ChevronDown size={12} />
                      </button>
                      <button onClick={() => addCell(index, "code")} className="p-0.5 rounded text-[#888] hover:text-[#333] hover:bg-[#e8e8e8]" title="Add cell below">
                        <Plus size={12} />
                      </button>
                      {cells.length > 1 && (
                        <button onClick={() => deleteCell(cell.id)} className="p-0.5 rounded text-[#888] hover:text-[#d32f2f] hover:bg-[#ffebee]" title="Delete cell">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Code content */}
                  <textarea
                    className="w-full p-3 bg-white text-[#1a1a1a] resize-none focus:outline-none font-mono text-[13px] leading-[1.5]"
                    style={{ tabSize: 4, minHeight: "40px" }}
                    value={cell.source}
                    onChange={(e) => updateCellSource(cell.id, e.target.value)}
                    readOnly={readOnly}
                    rows={Math.max(1, cell.source.split("\n").length)}
                    spellCheck={false}
                    placeholder="Type code here..."
                  />

                  {/* Output */}
                  {(cell.output || cell.error) && (
                    <div className="border-t border-[#e0e0e0] bg-[#fafafa]">
                      <div className="flex items-center gap-1 px-3 py-1 text-[10px] text-[#888] border-b border-[#eee]">
                        <span>Out [{index + 1}]</span>
                      </div>
                      {cell.output && (
                        <pre className="p-3 text-[13px] font-mono text-[#333] whitespace-pre-wrap overflow-x-auto leading-relaxed">
                          {cell.output}
                        </pre>
                      )}
                      {cell.error && (
                        <pre className="p-3 text-[13px] font-mono text-[#d32f2f] whitespace-pre-wrap overflow-x-auto leading-relaxed bg-[#fff5f5]">
                          {cell.error}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* ── Markdown Cell ── */
                <div className="mx-2 mb-2 group/md relative">
                  <div className="border border-transparent group-hover/md:border-[#e0e0e0] rounded-md transition-colors">
                    {/* Markdown toolbar */}
                    <div className={cn("flex items-center h-[28px] px-2 bg-[#f8f8f8] border-b border-[#e0e0e0] rounded-t-md transition-opacity",
                      hoveredCell === cell.id ? "opacity-100" : "opacity-0")}>
                      <span className="text-[11px] text-[#888] mr-2">Markdown</span>
                      <div className="flex-1" />
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => copyCell(cell.id)} className="p-0.5 rounded text-[#888] hover:text-[#333] hover:bg-[#e8e8e8]" title="Copy">
                          {copiedCell === cell.id ? <Check size={12} className="text-[#4caf50]" /> : <Copy size={12} />}
                        </button>
                        <button onClick={() => moveCell(cell.id, "up")} disabled={index === 0} className="p-0.5 rounded text-[#888] hover:text-[#333] hover:bg-[#e8e8e8] disabled:opacity-30">
                          <ChevronUp size={12} />
                        </button>
                        <button onClick={() => moveCell(cell.id, "down")} disabled={index === cells.length - 1} className="p-0.5 rounded text-[#888] hover:text-[#333] hover:bg-[#e8e8e8] disabled:opacity-30">
                          <ChevronDown size={12} />
                        </button>
                        <button onClick={() => addCell(index, "markdown")} className="p-0.5 rounded text-[#888] hover:text-[#333] hover:bg-[#e8e8e8]">
                          <Plus size={12} />
                        </button>
                        {cells.length > 1 && (
                          <button onClick={() => deleteCell(cell.id)} className="p-0.5 rounded text-[#888] hover:text-[#d32f2f] hover:bg-[#ffebee]">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Rendered markdown */}
                    <div className="px-4 py-3">
                      <div
                        className="text-[14px] text-[#333] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(cell.source || "*Double-click to edit*") }}
                      />
                    </div>

                    {/* Hidden edit textarea */}
                    {!readOnly && (
                      <textarea
                        className="absolute inset-0 w-full h-full px-4 py-3 bg-white text-[#333] text-[14px] resize-none focus:outline-none opacity-0 focus:opacity-100 transition-opacity font-sans"
                        style={{ minHeight: "60px" }}
                        value={cell.source}
                        onChange={(e) => updateCellSource(cell.id, e.target.value)}
                        readOnly={readOnly}
                        rows={Math.max(2, cell.source.split("\n").length)}
                        spellCheck={false}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Add cell between */}
              {!readOnly && hoveredCell === cell.id && (
                <div className="flex items-center justify-center h-0 relative z-10">
                  <div className="absolute -top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => addCell(index, "code")}
                      className="flex items-center gap-1 px-2 py-0.5 bg-[#f0f0f0] hover:bg-[#e0e0e0] border border-[#ddd] rounded text-[10px] text-[#666] shadow-sm">
                      <Plus size={10} /> Code
                    </button>
                    <button onClick={() => addCell(index, "markdown")}
                      className="flex items-center gap-1 px-2 py-0.5 bg-[#f0f0f0] hover:bg-[#e0e0e0] border border-[#ddd] rounded text-[10px] text-[#666] shadow-sm">
                      <Plus size={10} /> Text
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add cell at bottom */}
          {!readOnly && (
            <div className="flex items-center justify-center gap-2 py-4 mx-2 border border-dashed border-[#ddd] rounded-md hover:border-[#bbb] hover:bg-[#fafafa] transition-colors cursor-pointer group"
              onClick={() => addCell(cells.length - 1, "code")}>
              <Plus size={14} className="text-[#aaa] group-hover:text-[#666]" />
              <span className="text-[12px] text-[#aaa] group-hover:text-[#666]">Add cell</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
