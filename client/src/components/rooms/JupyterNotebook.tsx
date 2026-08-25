import { useState, useCallback, useRef, useEffect } from "react";
import {
  Play,
  Square,
  Plus,
  Trash2,
  Code2,
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
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
      metadata: { kernelspec: { display_name: "Python 3", language: "python", name: "python3" }, language_info: { name: "python", version: "3.10.0" } },
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

const PYTHON_CDN = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";

export function JupyterNotebook({ initialContent, readOnly = false }: JupyterNotebookProps) {
  const [cells, setCells] = useState<Cell[]>(() => parseNotebook(initialContent || ""));
  const [pyodide, setPyodide] = useState<any>(null);
  const [loadingPyodide, setLoadingPyodide] = useState(false);
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

      setCells((prev) => prev.map((c) => (c.id === cellId ? { ...c, running: true, output: undefined, error: undefined } : c)));

      try {
        const py = await ensurePyodide();
        let output = "";
        let error = "";

        py.setStdout({
          batched: (msg: string) => {
            output += msg + "\n";
          },
        });
        py.setStderr({
          batched: (msg: string) => {
            error += msg + "\n";
          },
        });

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
              ? {
                  ...c,
                  running: false,
                  output: output.trim() || undefined,
                  error: error.trim() || undefined,
                }
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
    const newCell: Cell = {
      id: `cell-${Date.now()}`,
      source: "",
      cellType,
      running: false,
    };
    setCells((prev) => {
      const next = [...prev];
      next.splice(afterIndex + 1, 0, newCell);
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
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-[var(--bg-card)] rounded-lg border border-[var(--border)]">
          <Button variant="ghost" onClick={runAllCells} disabled={loadingPyodide} className="text-xs gap-1.5">
            {loadingPyodide ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            Run All
          </Button>
          <Button variant="ghost" onClick={() => addCell(cells.length - 1, "code")} className="text-xs gap-1.5">
            <Plus size={12} />
            Code
          </Button>
          <Button variant="ghost" onClick={() => addCell(cells.length - 1, "markdown")} className="text-xs gap-1.5">
            <Plus size={12} />
            Markdown
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={exportNotebook} className="text-xs">
            Export .ipynb
          </Button>
        </div>
      )}

      {/* Cells */}
      <div className="space-y-3">
        {cells.map((cell, index) => (
          <div
            key={cell.id}
            className={cn(
              "border rounded-xl overflow-hidden",
              cell.cellType === "markdown" ? "border-blue-400/30 bg-blue-400/5" : "border-[var(--border)]"
            )}
          >
            {/* Cell header */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-card)] border-b border-[var(--border)]">
              <span className="text-xs text-[var(--text-secondary)] font-mono">
                [{index + 1}]
              </span>
              <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg)] px-1.5 py-0.5 rounded">
                {cell.cellType}
              </span>
              {!readOnly && (
                <div className="flex items-center gap-0.5 ml-auto">
                  {cell.cellType === "code" && (
                    <button
                      onClick={() => runCell(cell.id)}
                      disabled={cell.running || loadingPyodide}
                      className="p-1 rounded text-green-400 hover:bg-green-400/10 disabled:opacity-50"
                    >
                      {cell.running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                    </button>
                  )}
                  <button
                    onClick={() => moveCell(cell.id, "up")}
                    disabled={index === 0}
                    className="p-1 rounded text-[var(--text-secondary)] hover:bg-[var(--accent)]/10 disabled:opacity-30"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={() => moveCell(cell.id, "down")}
                    disabled={index === cells.length - 1}
                    className="p-1 rounded text-[var(--text-secondary)] hover:bg-[var(--accent)]/10 disabled:opacity-30"
                  >
                    <ChevronDown size={12} />
                  </button>
                  <button
                    onClick={() => addCell(index, cell.cellType)}
                    className="p-1 rounded text-[var(--text-secondary)] hover:bg-[var(--accent)]/10"
                  >
                    <Plus size={12} />
                  </button>
                  {cells.length > 1 && (
                    <button
                      onClick={() => deleteCell(cell.id)}
                      className="p-1 rounded text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Cell source */}
            <div className="relative">
              {cell.cellType === "markdown" && !readOnly && (
                <div className="absolute top-2 right-2 text-[10px] text-blue-400/50 bg-blue-400/10 px-1.5 py-0.5 rounded z-10">
                  Markdown
                </div>
              )}
              <textarea
                className={cn(
                  "w-full bg-transparent p-3 text-sm font-mono resize-none focus:outline-none",
                  cell.cellType === "markdown" ? "text-blue-100" : "text-[var(--text-primary)]"
                )}
                value={cell.source}
                onChange={(e) => updateCellSource(cell.id, e.target.value)}
                readOnly={readOnly}
                rows={Math.max(2, cell.source.split("\n").length)}
                spellCheck={false}
              />
            </div>

            {/* Cell output */}
            {(cell.output || cell.error) && (
              <div className="border-t border-[var(--border)] bg-[var(--bg)]">
                {cell.output && (
                  <pre className="p-3 text-xs font-mono text-green-400 whitespace-pre-wrap overflow-x-auto">
                    {cell.output}
                  </pre>
                )}
                {cell.error && (
                  <pre className="p-3 text-xs font-mono text-red-400 whitespace-pre-wrap overflow-x-auto">
                    {cell.error}
                  </pre>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
