import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

/** Fallback accent when signed out (brand cyan). */
export const DEFAULT_ACCENT = "#06B6D4";

interface RGB {
  r: number;
  g: number;
  b: number;
}

function clamp(n: number, min = 0, max = 255): number {
  return Math.min(max, Math.max(min, n));
}

function hexToRgb(hex: string): RGB {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  const int = parseInt(h, 16);
  if (Number.isNaN(int)) return hexToRgb(DEFAULT_ACCENT);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function rgbToHex(c: RGB): string {
  const to = (n: number) => clamp(Math.round(n)).toString(16).padStart(2, "0");
  return `#${to(c.r)}${to(c.g)}${to(c.b)}`;
}

/** Linear interpolation between two colors: t=0 → a, t=1 → b */
function mix(a: RGB, b: RGB, t: number): RGB {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

const WHITE: RGB = { r: 255, g: 255, b: 255 };

function rgbToHsl({ r, g, b }: RGB): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToRgb(hDeg: number, s: number, l: number): RGB {
  const h = (((hDeg % 360) + 360) % 360) / 360;
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number): number => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return { r: channel(h + 1 / 3) * 255, g: channel(h) * 255, b: channel(h - 1 / 3) * 255 };
}

/** Rotates hue while keeping saturation/lightness — used for the gradient partner color. */
function shiftHue(hex: string, degrees: number): string {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb(h + degrees, s, l));
}

export interface AccentPalette {
  /** Base accent (the chosen color). */
  accent: string;
  /** Lightened variant for small text/icons on dark backgrounds. */
  bright: string;
  /** Even lighter variant for hover states. */
  soft: string;
  /** Hue-shifted partner used as the gradient's second stop & chart depth color. */
  deep: string;
}

export function buildPalette(color?: string | null): AccentPalette {
  const base = color || DEFAULT_ACCENT;
  const rgb = hexToRgb(base);
  return {
    accent: rgbToHex(rgb),
    bright: rgbToHex(mix(rgb, WHITE, 0.45)),
    soft: rgbToHex(mix(rgb, WHITE, 0.65)),
    deep: shiftHue(base, -18),
  };
}

function triplet(c: RGB): string {
  return `${clamp(Math.round(c.r))} ${clamp(Math.round(c.g))} ${clamp(Math.round(c.b))}`;
}

/**
 * Publishes the palette as CSS custom properties consumed by Tailwind tokens
 * (`accent`, `accent-bright`, `accent-soft`, `bg-neon-gradient`, glow shadows…).
 */
export function applyAccent(color?: string | null): void {
  const p = buildPalette(color);
  const style = document.documentElement.style;
  style.setProperty("--accent-rgb", triplet(hexToRgb(p.accent)));
  style.setProperty("--accent-bright-rgb", triplet(hexToRgb(p.bright)));
  style.setProperty("--accent-soft-rgb", triplet(hexToRgb(p.soft)));
  style.setProperty("--accent-2-rgb", triplet(hexToRgb(p.deep)));
}

/**
 * Current accent palette derived from the signed-in user's avatarColor.
 * Re-renders automatically when the user changes it in Settings.
 */
export function useAccentPalette(): AccentPalette {
  const { user } = useAuth();
  const color = user?.avatarColor;
  return useMemo(() => buildPalette(color), [color]);
}
