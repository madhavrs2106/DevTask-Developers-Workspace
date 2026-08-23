import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const DAY_MS = 86_400_000;

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(new Date(iso).getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
  });
}

export function formatHours(hours: number): string {
  if (hours >= 100) return `${Math.round(hours)}h`;
  return `${Math.round(hours * 10) / 10}h`;
}

/** Days from today until `iso` (negative = overdue). */
export function daysUntil(iso: string): number {
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

export interface DueMeta {
  label: string;
  tone: "overdue" | "soon" | "normal";
}

export function dueMeta(iso: string | null | undefined): DueMeta | null {
  if (!iso) return null;
  const d = daysUntil(iso);
  if (d < 0) return { label: `${Math.abs(d)}d overdue`, tone: "overdue" };
  if (d === 0) return { label: "Due today", tone: "soon" };
  if (d <= 2) return { label: `Due in ${d}d`, tone: "soon" };
  return { label: formatDate(iso), tone: "normal" };
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
