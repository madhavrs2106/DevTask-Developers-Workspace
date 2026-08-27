import { useEffect } from "react";

// Noupe AI is a no-code, embeddable conversational chatbot.
// The widget is config-driven via environment variables so the embed snippet
// is never hardcoded. Provide ONE of the following:
//   1. VITE_NOUPE_EMBED_SNIPPET — the exact <script ...></script> line from your
//      Noupe dashboard. This is injected verbatim (handles any attribute/URL Noupe uses).
//   2. VITE_NOUPE_SCRIPT_SRC + VITE_NOUPE_BOT_ID — a script tag is built from these.
// When neither is set, nothing is rendered.

const SNIPPET = import.meta.env.VITE_NOUPE_EMBED_SNIPPET as string | undefined;
const SCRIPT_SRC = import.meta.env.VITE_NOUPE_SCRIPT_SRC as string | undefined;
const BOT_ID = import.meta.env.VITE_NOUPE_BOT_ID as string | undefined;

export function NoupeChatbot() {
  useEffect(() => {
    if (document.getElementById("noupe-chatbot")) return;

    const mount = () => {
      const el = document.createElement("div");
      el.id = "noupe-chatbot";
      document.body.appendChild(el);
    };

    if (SNIPPET) {
      const parsed = new DOMParser().parseFromString(SNIPPET, "text/html");
      const src = parsed.querySelector("script");
      if (!src) return;
      const s = document.createElement("script");
      for (const attr of Array.from(src.attributes)) s.setAttribute(attr.name, attr.value);
      if (!s.getAttribute("src") && src.textContent) s.textContent = src.textContent;
      s.async = true;
      mount();
      document.body.appendChild(s);
      return;
    }

    if (SCRIPT_SRC) {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      if (BOT_ID) s.setAttribute("data-bot-id", BOT_ID);
      mount();
      document.body.appendChild(s);
    }
  }, []);

  return null;
}
