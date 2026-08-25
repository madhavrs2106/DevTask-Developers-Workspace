import { useState, useRef, useEffect, useCallback } from "react";
import { X, Plus, Trash2, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface TerminalLine {
  type: "input" | "output" | "error" | "system";
  content: string;
  timestamp: number;
}

interface TerminalInstance {
  id: string;
  name: string;
  cwd: string;
  lines: TerminalLine[];
  history: string[];
  historyIndex: number;
}

function createTerminal(id: string, name: string): TerminalInstance {
  return {
    id,
    name,
    cwd: "~",
    lines: [
      { type: "system", content: `Welcome to DevTask Terminal v1.0`, timestamp: Date.now() },
      { type: "system", content: `Type "help" for available commands.\n`, timestamp: Date.now() },
    ],
    history: [],
    historyIndex: -1,
  };
}

function processCommand(input: string, cwd: string): { output: string; newCwd: string; isError: boolean } {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case "help":
      return {
        output: `Available commands:
  help          Show this help message
  clear         Clear terminal
  echo          Print text
  pwd           Print working directory
  cd            Change directory
  ls            List files
  cat           Show file contents
  date          Show current date/time
  whoami        Show current user
  uname         Show system info
  history       Show command history
  python        Run Python code
  node          Run JavaScript code
  git           Git commands (simulated)
  npm           NPM commands (simulated)`,
        newCwd: cwd,
        isError: false,
      };

    case "clear":
      return { output: "__CLEAR__", newCwd: cwd, isError: false };

    case "echo":
      return { output: args.join(" "), newCwd: cwd, isError: false };

    case "pwd":
      return { output: cwd === "~" ? "/home/user" : `/home/user/${cwd}`, newCwd: cwd, isError: false };

    case "cd": {
      const target = args[0] || "~";
      if (target === "~" || target === "/") return { output: "", newCwd: "~", isError: false };
      if (target === "..") {
        const parts = cwd.split("/").filter(Boolean);
        parts.pop();
        return { output: "", newCwd: parts.length ? `/${parts.join("/")}` : "~", isError: false };
      }
      return { output: "", newCwd: cwd === "~" ? target : `${cwd}/${target}`, isError: false };
    }

    case "ls": {
      const files = [
        "index.js", "main.py", "README.md", "package.json",
        "src/", "node_modules/", ".git/", "tsconfig.json",
        "styles.css", "app.html", "notebook.ipynb",
      ];
      const showAll = args.includes("-a") || args.includes("-la");
      const long = args.includes("-l") || args.includes("-la");
      const items = showAll ? [".", "..", ...files] : files;
      if (long) {
        return {
          output: items.map((f) => {
            const isDir = f.endsWith("/");
            const size = isDir ? "4096" : String(Math.floor(Math.random() * 50000));
            const date = "Aug 25 10:30";
            const perms = isDir ? "drwxr-xr-x" : "-rw-r--r--";
            return `${perms}  1 user user  ${size.padStart(6)}  ${date}  ${f}`;
          }).join("\n"),
          newCwd: cwd,
          isError: false,
        };
      }
      return { output: items.join("  "), newCwd: cwd, isError: false };
    }

    case "cat": {
      if (!args[0]) return { output: "cat: missing file operand", newCwd: cwd, isError: true };
      const fileContents: Record<string, string> = {
        "index.js": 'console.log("Hello, World!");',
        "main.py": 'print("Hello, World!")',
        "README.md": "# DevTask\nA developer productivity app.",
        "package.json": '{\n  "name": "devtask",\n  "version": "2.0.0"\n}',
      };
      const content = fileContents[args[0]];
      if (content) return { output: content, newCwd: cwd, isError: false };
      return { output: `cat: ${args[0]}: No such file or directory`, newCwd: cwd, isError: true };
    }

    case "date":
      return { output: new Date().toString(), newCwd: cwd, isError: false };

    case "whoami":
      return { output: "user", newCwd: cwd, isError: false };

    case "uname":
      return { output: args.includes("-a") ? "DevTask 1.0.0 Browser x86_64 JavaScript" : "DevTask", newCwd: cwd, isError: false };

    case "history":
      return { output: "__HISTORY__", newCwd: cwd, isError: false };

    case "python":
    case "py": {
      const code = args.join(" ");
      if (!code) return { output: "Python 3.10.0 (Pyodide)\n>>> ", newCwd: cwd, isError: false };
      try {
        const fn = new Function("return " + code);
        const result = fn();
        return { output: result !== undefined ? String(result) : "", newCwd: cwd, isError: false };
      } catch (e: any) {
        return { output: e.message, newCwd: cwd, isError: true };
      }
    }

    case "node": {
      const code = args.join(" ");
      if (!code) return { output: "Node.js v18.0.0\n> ", newCwd: cwd, isError: false };
      try {
        const fn = new Function("return " + code);
        const result = fn();
        return { output: result !== undefined ? String(result) : "undefined", newCwd: cwd, isError: false };
      } catch (e: any) {
        return { output: e.message, newCwd: cwd, isError: true };
      }
    }

    case "git": {
      const sub = args[0];
      switch (sub) {
        case "status": return { output: "On branch main\nnothing to commit, working tree clean", newCwd: cwd, isError: false };
        case "log": return { output: "commit d93ce0f (HEAD -> main)\nAuthor: User <user@dev.io>\nDate:   Mon Aug 25 2025\n\n    Fix code runner", newCwd: cwd, isError: false };
        case "branch": return { output: "* main\n  dev\n  feature/notes", newCwd: cwd, isError: false };
        case "remote": return { output: "origin\thttps://github.com/user/devtask.git (fetch)\norigin\thttps://github.com/user/devtask.git (push)", newCwd: cwd, isError: false };
        default: return { output: `git: '${sub}' is not a git command.`, newCwd: cwd, isError: true };
      }
    }

    case "npm": {
      const sub = args[0];
      switch (sub) {
        case "list": case "ls": return { output: "devtask@2.0.0\n├── react@18.2.0\n├── react-dom@18.2.0\n├── @tanstack/react-query@5.0.0\n├── tailwindcss@3.3.0\n└── vite@5.0.0", newCwd: cwd, isError: false };
        case "start": return { output: "Starting dev server...\n> VITE v5.0.0  ready in 300ms\n> Local: http://localhost:5173/", newCwd: cwd, isError: false };
        case "run": return { output: `Running script '${args[1]}'...`, newCwd: cwd, isError: false };
        default: return { output: `npm: '${sub}' is not a npm command.`, newCwd: cwd, isError: true };
      }
    }

    case "curl":
      return { output: `curl: (${Math.floor(Math.random() * 6) + 28}) Failed to connect`, newCwd: cwd, isError: true };

    case "ping":
      return { output: `PING localhost (127.0.0.1): 56 data bytes\n64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.045ms`, newCwd: cwd, isError: false };

    case "":
      return { output: "", newCwd: cwd, isError: false };

    default:
      return { output: `command not found: ${cmd}`, newCwd: cwd, isError: true };
  }
}

export function TerminalPanel({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const [terminals, setTerminals] = useState<TerminalInstance[]>(() => [createTerminal("1", "Terminal 1")]);
  const [activeId, setActiveId] = useState("1");
  const [input, setInput] = useState("");
  const [panelHeight, setPanelHeight] = useState(200);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = terminals.find((t) => t.id === activeId) || terminals[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [active?.lines]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen, activeId]);

  const addTerminal = () => {
    const id = String(Date.now());
    const num = terminals.length + 1;
    const newTerm = createTerminal(id, `Terminal ${num}`);
    setTerminals((prev) => [...prev, newTerm]);
    setActiveId(id);
  };

  const closeTerminal = (id: string) => {
    if (terminals.length <= 1) return;
    setTerminals((prev) => prev.filter((t) => t.id !== id));
    if (activeId === id) {
      const remaining = terminals.filter((t) => t.id !== id);
      setActiveId(remaining[0]?.id || "");
    }
  };

  const handleCommand = () => {
    if (!input.trim() || !active) return;

    const newLines = [...active.lines, { type: "input" as const, content: `${active.cwd} $ ${input}`, timestamp: Date.now() }];
    const result = processCommand(input, active.cwd);

    if (result.output === "__CLEAR__") {
      setTerminals((prev) =>
        prev.map((t) => t.id === active.id ? { ...t, lines: [], history: [...t.history, input], historyIndex: -1 } : t)
      );
    } else if (result.output === "__HISTORY__") {
      const hist = active.history.map((cmd, i) => `  ${String(i + 1).padStart(4)}  ${cmd}`).join("\n");
      newLines.push({ type: "output", content: hist, timestamp: Date.now() });
      setTerminals((prev) =>
        prev.map((t) => t.id === active.id ? { ...t, lines: newLines, history: [...t.history, input], historyIndex: -1 } : t)
      );
    } else {
      if (result.output) {
        newLines.push({ type: result.isError ? "error" : "output", content: result.output, timestamp: Date.now() });
      }
      setTerminals((prev) =>
        prev.map((t) => t.id === active.id ? { ...t, lines: newLines, cwd: result.newCwd, history: [...t.history, input], historyIndex: -1 } : t)
      );
    }

    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = active.historyIndex + 1;
      if (idx < active.history.length) {
        const cmd = active.history[active.history.length - 1 - idx];
        setInput(cmd);
        setTerminals((prev) => prev.map((t) => t.id === active.id ? { ...t, historyIndex: idx } : t));
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = active.historyIndex - 1;
      if (idx >= 0) {
        const cmd = active.history[active.history.length - 1 - idx];
        setInput(cmd);
        setTerminals((prev) => prev.map((t) => t.id === active.id ? { ...t, historyIndex: idx } : t));
      } else {
        setInput("");
        setTerminals((prev) => prev.map((t) => t.id === active.id ? { ...t, historyIndex: -1 } : t));
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setTerminals((prev) => prev.map((t) => t.id === active.id ? { ...t, lines: [] } : t));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col border-t border-[#3c3c3c]" style={{ height: panelHeight }}>
      {/* Terminal tabs */}
      <div className="flex items-center h-[30px] bg-[#252526] border-b border-[#3c3c3c] px-1">
        <div className="flex items-center h-full overflow-x-auto">
          {terminals.map((t) => (
            <div
              key={t.id}
              className={cn(
                "flex items-center gap-1.5 px-3 h-full text-[11px] cursor-pointer border-r border-[#3c3c3c] group shrink-0",
                t.id === activeId ? "bg-[#1e1e1e] text-[#cccccc]" : "text-[#858585] hover:text-[#cccccc]"
              )}
              onClick={() => setActiveId(t.id)}
            >
              <span>{t.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); closeTerminal(t.id); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#3c3c3c] rounded transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-0.5 ml-1">
          <button onClick={addTerminal} className="p-1 text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c] rounded" title="New Terminal">
            <Plus size={12} />
          </button>
          <button onClick={onToggle} className="p-1 text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c] rounded" title="Close Panel">
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Terminal output */}
      <div ref={scrollRef} className="flex-1 overflow-auto bg-[#1e1e1e] p-3 font-mono text-[12px] leading-[1.5]" onClick={() => inputRef.current?.focus()}>
        {active?.lines.map((line, i) => (
          <div key={i} className={cn("whitespace-pre-wrap break-all",
            line.type === "input" && "text-[#cccccc]",
            line.type === "output" && "text-[#cccccc]",
            line.type === "error" && "text-[#f44336]",
            line.type === "system" && "text-[#3794ff]"
          )}>
            {line.content}
          </div>
        ))}

        {/* Input line */}
        <div className="flex items-center text-[#cccccc]">
          <span className="text-[#4ec9b0] shrink-0">{active?.cwd} $ </span>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-[#cccccc] focus:outline-none font-mono text-[12px] caret-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoFocus
          />
        </div>
      </div>

      {/* Resize handle */}
      <div
        className="h-1 bg-[#252526] hover:bg-[#007acc]/40 cursor-ns-resize transition-colors"
        onMouseDown={(e) => {
          e.preventDefault();
          const startY = e.clientY;
          const startH = panelHeight;
          const onMove = (ev: MouseEvent) => setPanelHeight(Math.max(100, Math.min(500, startH - (ev.clientY - startY))));
          const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }}
      />
    </div>
  );
}
