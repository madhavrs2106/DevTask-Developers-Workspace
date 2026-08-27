import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useSetting } from "../../hooks/useQueries";

// Noupe AI is a no-code, embeddable conversational chatbot.
// Configuration precedence:
//   1. VITE_NOUPE_EMBED_SNIPPET (build-time env) — preferred
//   2. VITE_NOUPE_SCRIPT_SRC + VITE_NOUPE_BOT_ID (build-time env)
//   3. Runtime app setting "noupe-embed" (set by an admin in Settings, no rebuild needed)
// When configured, we inject Noupe's script and let it render its own bubble (ours auto-hides).
// When NOT configured, we fall back to a built-in DevTask assistant so the chat always works.

const SNIPPET = import.meta.env.VITE_NOUPE_EMBED_SNIPPET as string | undefined;
const SCRIPT_SRC = import.meta.env.VITE_NOUPE_SCRIPT_SRC as string | undefined;
const BOT_ID = import.meta.env.VITE_NOUPE_BOT_ID as string | undefined;

function injectNoupe(snippet: string, scriptSrc?: string, botId?: string) {
  if (document.getElementById("noupe-script")) return;
  const make = () => {
    const s = document.createElement("script");
    s.id = "noupe-script";
    s.async = true;
    return s;
  };
  if (snippet) {
    const parsed = new DOMParser().parseFromString(snippet, "text/html");
    const src = parsed.querySelector("script");
    if (!src) return;
    const s = make();
    for (const attr of Array.from(src.attributes)) s.setAttribute(attr.name, attr.value);
    if (!s.getAttribute("src") && src.textContent) s.textContent = src.textContent;
    document.body.appendChild(s);
    return;
  }
  if (scriptSrc) {
    const s = make();
    s.src = scriptSrc;
    if (botId) s.setAttribute("data-bot-id", botId);
    document.body.appendChild(s);
  }
}

type Msg = { role: "user" | "bot"; text: string };

const KNOWLEDGE: { keys: string[]; answer: string }[] = [
  {
    keys: ["coding problem", "problem", "leetcode", "judge", "submit", "run", "solve"],
    answer:
      "The Problems tab (inside a Co-Learning Room) is a LeetCode-style space. Admins create problems with expected-output test cases; you pick a language (JavaScript, Python, C, C++, Java, Go, Ruby), write code that reads input from stdin and prints the answer, then hit Run (samples only) or Submit (all cases, hidden included). Python submissions can import numpy, pandas, scipy, sympy and matplotlib.",
  },
  {
    keys: ["python", "library", "numpy", "pandas"],
    answer:
      "In coding problems, Python submissions can import numpy, pandas, scipy, sympy and matplotlib directly — just `import` them. The libraries are pre-installed on the server, so you won't hit 'module not found'.",
  },
  {
    keys: ["room", "co-learning", "collab", "study group"],
    answer:
      "Co-Learning Rooms are shared spaces for studying together. Create a room, add a syllabus, run quizzes, discuss topics, track a leaderboard, and add coding problems. Use Explore to preview other rooms' syllabi, then Join to participate.",
  },
  {
    keys: ["explore", "join", "preview"],
    answer:
      "On your Rooms page, Explore opens a room's syllabus preview (works for public rooms and even private ones' syllabi). Use the Join button on a room card to become a member and unlock discussions, quizzes and problems.",
  },
  {
    keys: ["quiz", "quizzes", "exam"],
    answer:
      "Admins build Quizzes with MCQ/Numerical questions and publish them. Members submit attempts; admins can grade and allow retakes. Quiz results feed the room leaderboard.",
  },
  {
    keys: ["syllabus", "progress", "topic"],
    answer:
      "Each room has a Syllabus of topics. Members mark topics complete as they study; your progress ring on the room header reflects completed topics. Only topic names are shown in Explore previews (descriptions stay private until you join).",
  },
  {
    keys: ["leaderboard", "rank", "points"],
    answer:
      "The Leaderboard ranks room members by activity — quiz scores, submissions and progress. It's a quick way to see who's leading the study group.",
  },
  {
    keys: ["study", "how to study", "learn", "focus", "tips", "productive"],
    answer:
      "Study tips: break the syllabus into small daily topics and mark them complete as you go; use the focus session to block distractions; practice with coding problems (Run often, then Submit); quiz yourself weekly; and discuss stuck topics in the room's Discussions. Consistency beats cramming — 25–50 min focused sessions with short breaks work well.",
  },
  {
    keys: ["hello", "hi", "hey", "help", "what can you"],
    answer:
      "Hi! I'm the DevTask assistant. Ask me about Co-Learning Rooms, coding problems, quizzes, the syllabus, leaderboards, or for study tips. Admins can also connect Noupe AI in Settings for a full LLM chat.",
  },
];

function getReply(text: string): string {
  const t = text.toLowerCase();
  for (const k of KNOWLEDGE) {
    if (k.keys.some((key) => t.includes(key))) return k.answer;
  }
  return "I can help with DevTask's Co-Learning Rooms, coding problems, quizzes, syllabus/progress, leaderboards, and study tips. Try asking something like “How do coding problems work?” or “Give me study tips”. (Admins can connect Noupe AI in Settings for a full chatbot.)";
}

export function NoupeChatbot() {
  const [noupeLoaded, setNoupeLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: "Hi! I'm the DevTask assistant. Ask me about rooms, coding problems, quizzes, or study tips." },
  ]);
  const [input, setInput] = useState("");
  const { data: setting } = useSetting("noupe-embed");

  const snippet = SNIPPET || setting?.value || "";
  const CONFIGURED = Boolean(snippet || (SCRIPT_SRC && !SNIPPET));

  useEffect(() => {
    if (!CONFIGURED) return;
    injectNoupe(snippet, SCRIPT_SRC && !SNIPPET ? SCRIPT_SRC : undefined, BOT_ID);
    const t = setInterval(() => {
      const found = document.querySelector('[id*="noupe" i], [class*="noupe" i]');
      if (found) setNoupeLoaded(true);
    }, 600);
    return () => clearInterval(t);
  }, [snippet, CONFIGURED]);

  // Noupe is live and rendered its own widget — hide ours.
  if (CONFIGURED && noupeLoaded) return null;

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }, { role: "bot", text: getReply(text) }]);
    setInput("");
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open DevTask assistant"
        className="fixed bottom-5 right-5 z-[60] h-12 w-12 rounded-full bg-accent text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-[60] flex h-[28rem] w-80 flex-col overflow-hidden rounded-xl border border-slate-700 bg-surface-raised shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2">
            <span className="text-sm font-semibold text-ink">DevTask Assistant</span>
            <button onClick={() => setOpen(false)} className="text-ink-muted hover:text-ink">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-accent text-white"
                      : "bg-surface text-ink border border-slate-700"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-slate-700 p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about DevTask or study help…"
              className="flex-1 rounded-lg border border-slate-700 bg-surface px-2 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent"
            />
            <button
              onClick={send}
              className="rounded-lg bg-accent p-2 text-white hover:opacity-90"
              aria-label="Send"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
