import { useState, useCallback, useRef, useEffect } from "react";
import { Play, Plus, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
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
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="jupyter-code-block"><code>$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code class="jupyter-inline-code">$1</code>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="jupyter-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="jupyter-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="jupyter-h1">$1</h1>');
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="jupyter-link">$1</a>');
  html = html.replace(/^[\-\*] (.+)$/gm, '<li class="jupyter-li">$1</li>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="jupyter-li">$1</li>');
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="jupyter-blockquote">$1</blockquote>');
  html = html.replace(/^---+$/gm, '<hr class="jupyter-hr" />');
  html = html.replace(/\n/g, "<br />");
  return html;
}

const PYTHON_CDN = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";

const NOTEBOOK_STYLES = `
  .jupyter-code-block { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 12px 16px; margin: 8px 0; overflow-x: auto; }
  .jupyter-code-block code { color: #e6edf3; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 13px; line-height: 1.5; }
  .jupyter-inline-code { background: rgba(175,184,193,0.2); padding: 0.2em 0.4em; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 85%; }
  .jupyter-h1 { font-size: 1.5em; font-weight: 600; margin: 16px 0 8px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
  .jupyter-h2 { font-size: 1.25em; font-weight: 600; margin: 14px 0 6px; }
  .jupyter-h3 { font-size: 1.1em; font-weight: 600; margin: 12px 0 4px; }
  .jupyter-ul { margin: 4px 0; padding-left: 24px; list-style: disc; }
  .jupyter-ol { margin: 4px 0; padding-left: 24px; list-style: decimal; }
  .jupyter-li { margin: 2px 0; }
  .jupyter-blockquote { border-left: 3px solid var(--accent); padding: 4px 12px; margin: 8px 0; color: var(--text-secondary); background: var(--bg-card); border-radius: 0 6px 6px 0; }
  .jupyter-hr { border: none; border-top: 1px solid var(--border); margin: 16px 0; }
  .jupyter-link { color: var(--accent); text-decoration: underline; }
  .jupyter-link:hover { opacity: 0.8; }
`;

export function JupyterNotebook({ initialContent, readOnly = false }: JupyterNotebookProps) {
  const [cells, setCells] = useState<Cell[]>(() => parseNotebook(initialContent || ""));
  const [pyodide, setPyodide] = useState<any>(null);
  const [loadingPyodide, setLoadingPyodide] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
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

  const exportNotebook = useCallback(() => {
    const blob = new Blob([cellsToNotebook(cells)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notebook.ipynb";
    a.click();
    URL.revokeObjectURL(url);
  }, [cells]);

  return (
    <div className="flex flex-col">
      <style>{NOTEBOOK_STYLES}</style>

      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-1 px-3 py-2 border-b border-[var(--border)]">
          <Button variant="ghost" onClick={runAllCells} disabled={loadingPyodide} className="text-xs gap-1.5 h-7">
            {loadingPyodide ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            Run All
          </Button>
          <div className="w-px h-4 bg-[var(--border)] mx-1" />
          <Button variant="ghost" onClick={() => addCell(cells.length - 1, "code")} className="text-xs gap-1.5 h-7">
            <Plus size={13} />
            Code
          </Button>
          <Button variant="ghost" onClick={() => addCell(cells.length - 1, "markdown")} className="text-xs gap-1.5 h-7">
            <Plus size={13} />
            Markdown
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={exportNotebook} className="text-xs h-7">
            Export
          </Button>
        </div>
      )}

      {/* Cells */}
      <div className="divide-y divide-[var(--border)]">
        {cells.map((cell, index) => (
          <div
            key={cell.id}
            className="relative group"
            onMouseEnter={() => setHoveredCell(cell.id)}
            onMouseLeave={() => setHoveredCell(null)}
          >
            {/* Move buttons on hover */}
            {!readOnly && hoveredCell === cell.id && (
              <div className="absolute -left-1 top-2 flex flex-col gap-0.5 z-10">
                <button
                  onClick={() => moveCell(cell.id, "up")}
                  disabled={index === 0}
                  className="p-0.5 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30"
                >
                  <ChevronUp size={10} />
                </button>
                <button
                  onClick={() => moveCell(cell.id, "down")}
                  disabled={index === cells.length - 1}
                  className="p-0.5 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30"
                >
                  <ChevronDown size={10} />
                </button>
              </div>
            )}

            {cell.cellType === "code" ? (
              /* Code cell — GitHub dark style */
              <div className={cn("flex", cell.running && "opacity-60")}>
                {/* Line number + run */}
                <div className="w-16 shrink-0 flex flex-col items-center pt-3 text-[var(--text-secondary)]">
                  {!readOnly && (
                    <button
                      onClick={() => runCell(cell.id)}
                      disabled={cell.running || loadingPyodide}
                      className="p-1 rounded hover:bg-[var(--accent)]/10 text-[var(--text-secondary)] hover:text-green-400 mb-1 disabled:opacity-50"
                      title="Run cell"
                    >
                      {cell.running ? <Loader2 size={14} className="animate-spin text-[var(--accent)]" /> : <Play size={14} />}
                    </button>
                  )}
                  <span className="text-[10px] font-mono opacity-50">[{index + 1}]</span>
                </div>

                {/* Code */}
                <div className="flex-1 min-w-0">
                  <div className="bg-[#161b22] border-l-2 border-l-[var(--border)] group-hover:border-l-[var(--accent)] transition-colors">
                    <pre className="p-4 overflow-x-auto">
                      <code className="text-[#e6edf3] text-[13px] leading-[1.6] font-mono whitespace-pre">{cell.source || " "}</code>
                    </pre>
                  </div>

                  {/* Output */}
                  {(cell.output || cell.error) && (
                    <div className="bg-[var(--bg-card)] border-l-2 border-l-[var(--border)]">
                      {cell.output && (
                        <pre className="px-4 py-3 text-[13px] font-mono text-[var(--text-primary)] whitespace-pre-wrap overflow-x-auto leading-relaxed">
                          {cell.output}
                        </pre>
                      )}
                      {cell.error && (
                        <pre className="px-4 py-3 text-[13px] font-mono text-red-400 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                          {cell.error}
                        </pre>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!readOnly && hoveredCell === cell.id && (
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button onClick={() => addCell(index, "code")} className="p-1 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Add cell below">
                      <Plus size={12} />
                    </button>
                    {cells.length > 1 && (
                      <button onClick={() => deleteCell(cell.id)} className="p-1 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-red-400" title="Delete cell">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Markdown cell */
              <div className="relative">
                <div className="px-16 py-4">
                  <div
                    className="text-[var(--text-primary)] text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(cell.source || "*Empty cell*") }}
                  />
                </div>

                {/* Hidden textarea — shows on hover for editing */}
                {!readOnly && (
                  <textarea
                    className="absolute inset-0 w-full h-full px-16 py-4 bg-[var(--bg)] text-[var(--text-primary)] text-sm resize-none focus:outline-none focus:bg-[var(--bg-card)] opacity-0 focus:opacity-100 transition-opacity"
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", lineHeight: "20px", minHeight: "60px" }}
                    value={cell.source}
                    onChange={(e) => updateCellSource(cell.id, e.target.value)}
                    readOnly={readOnly}
                    rows={Math.max(2, cell.source.split("\n").length)}
                    spellCheck={false}
                  />
                )}

                {/* Actions */}
                {!readOnly && hoveredCell === cell.id && (
                  <div className="absolute right-2 top-2 flex gap-1 z-10">
                    <button onClick={() => addCell(index, "markdown")} className="p-1 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Add cell below">
                      <Plus size={12} />
                    </button>
                    {cells.length > 1 && (
                      <button onClick={() => deleteCell(cell.id)} className="p-1 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-red-400" title="Delete cell">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add cell at bottom */}
      {!readOnly && (
        <button
          onClick={() => addCell(cells.length - 1, "code")}
          className="flex items-center justify-center gap-2 py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-dashed border-[var(--border)] rounded-lg mt-3 transition-colors"
        >
          <Plus size={14} />
          <span className="text-xs">Add cell</span>
        </button>
      )}
    </div>
  );
}
