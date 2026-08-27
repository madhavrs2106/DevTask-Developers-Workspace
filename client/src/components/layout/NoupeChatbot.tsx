import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useSetting } from "../../hooks/useQueries";

// Noupe AI is a no-code, embeddable conversational chatbot.
// Configuration precedence:
//   1. VITE_NOUPE_EMBED_SNIPPET (build-time env) — preferred
//   2. VITE_NOUPE_SCRIPT_SRC + VITE_NOUPE_BOT_ID (build-time env)
//   3. Runtime app setting "noupe-embed" (set by an admin in Settings, no rebuild needed)
// When configured, we inject Noupe's script and let it render its own bubble.
// We also render a fallback launcher so the button is always visible/positioned; it auto-hides
// once Noupe's own widget is detected in the DOM.

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

export function NoupeChatbot() {
  const [noupeLoaded, setNoupeLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const { data: setting } = useSetting("noupe-embed");

  // Effective snippet: env takes precedence, then the runtime app setting.
  const snippet = SNIPPET || setting?.value || "";
  const scriptSrc = SNIPPET ? undefined : SCRIPT_SRC;
  const CONFIGURED = Boolean(snippet || (SCRIPT_SRC && !SNIPPET));

  useEffect(() => {
    if (!snippet && !(SCRIPT_SRC && !SNIPPET)) return;
    injectNoupe(snippet, SCRIPT_SRC && !SNIPPET ? SCRIPT_SRC : undefined, BOT_ID);
    const t = setInterval(() => {
      const found = document.querySelector('[id*="noupe" i], [class*="noupe" i]');
      if (found) setNoupeLoaded(true);
    }, 600);
    return () => clearInterval(t);
  }, [snippet, scriptSrc]);

  const handleClick = () => {
    const w = window as unknown as { Noupe?: { open?: () => void }; noupe?: { open?: () => void } };
    if (w.Noupe?.open) w.Noupe.open();
    else if (w.noupe?.open) w.noupe.open();
    else setOpen((o) => !o);
  };

  if (noupeLoaded) return null;

  return (
    <>
      <button
        onClick={handleClick}
        aria-label="Open Noupe AI chat"
        className="fixed bottom-5 right-5 z-[60] h-12 w-12 rounded-full bg-[var(--accent)] text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
      {open && !CONFIGURED && (
        <div className="fixed bottom-20 right-5 z-[60] w-72 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-xs text-[var(--text-secondary)] shadow-xl leading-relaxed">
          Noupe AI isn't configured yet. Paste your Noupe embed snippet in <strong>Settings → Noupe AI</strong> (or set{" "}
          <code className="text-[var(--text-primary)]">VITE_NOUPE_EMBED_SNIPPET</code> in <code className="text-[var(--text-primary)]">.env</code>) to load the chat.
        </div>
      )}
    </>
  );
}

