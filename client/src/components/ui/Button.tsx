import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type Variant = "primary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-neon-gradient text-slate-950 font-semibold shadow-glow-sm hover:brightness-110 active:brightness-95",
  ghost:
    "text-ink-muted hover:text-white hover:bg-white/5 border border-transparent",
  outline:
    "border border-slate-700 text-slate-300 hover:border-accent/50 hover:text-accent-bright hover:bg-accent/5",
  danger:
    "border border-rose-400/30 text-rose-400 hover:bg-rose-400/10 hover:border-rose-400/60",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/70",
        "disabled:pointer-events-none disabled:opacity-45",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
});
