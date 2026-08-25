import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Dropdown({
  value,
  onChange,
  options,
  placeholder = "Select…",
  className,
  disabled = false,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border border-slate-800 bg-surface-raised px-3 py-2.5 text-sm text-slate-100",
          "transition-colors hover:border-slate-700 focus:outline-none focus:ring-1 focus:ring-accent/40",
          disabled && "pointer-events-none opacity-45",
          open && "border-accent/60 ring-1 ring-accent/40"
        )}
      >
        <span className={cn("truncate", !selected && "text-slate-500")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "shrink-0 text-slate-500 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-700 bg-[#0B0F19] py-1 shadow-xl animate-in fade-in slide-in-from-top-1">
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm transition-colors",
                  opt.value === value
                    ? "bg-accent/15 text-accent-bright font-medium"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                  opt.disabled && "pointer-events-none opacity-40"
                )}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
