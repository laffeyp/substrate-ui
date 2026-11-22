// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The terminal window's typography, made tunable (sprint 539; roadmap 2026-11-17-daily-driver-fixes;
// DESIGN-2026-11-21-terminal-typography-r1). Nine parameters — size, leading, paragraph spacing,
// tracking, word spacing, alignment, weight, brightness, emphasis — each a CSS variable the transcript
// reads. The field terms are the design note's vocabulary check: leading (CSS line-height), tracking
// (letter-spacing), word spacing, measure/line length (deferred to round 2), alignment, weight,
// brightness/value (the body text's L*), emphasis (how far headings and bold sit above the body),
// paragraph spacing (space between blocks, not between lines).
//
// Each parameter is null until the viewer moves its control; a null value emits no variable, so the
// style that reads `var(--term-…, <today's value>)` falls back to today's value and the default
// appearance is byte-identical (the standing appearance rule, BLACKBOARD 2026-11-17: an appearance
// change lands as an option beside the default, never an overwrite). Typeface bundling and measure
// centring are the design note's round-2 open questions and are not here.

/** How lines sit in the measure. */
export type TermAlign = "left" | "right" | "center" | "justify";
export const TERM_ALIGNS: readonly TermAlign[] = ["left", "right", "center", "justify"];

/** The nine tunable parameters. null means the viewer has not moved this control, so its variable is
 *  not emitted and the transcript keeps today's value. */
export interface TerminalType {
  /** Type size, px (`--term-size`, font-size). */
  size: number | null;
  /** Leading, the unitless line-height ratio (`--term-leading`). */
  leading: number | null;
  /** Paragraph spacing, px between blocks (`--term-paragraph`, a block's bottom margin). */
  paragraph: number | null;
  /** Tracking, em across the whole run (`--term-tracking`, letter-spacing; negative tightens). */
  tracking: number | null;
  /** Word spacing, em between words (`--term-word-spacing`). */
  wordSpacing: number | null;
  /** Alignment (`--term-align`, text-align). */
  align: TermAlign | null;
  /** Weight, the stroke thickness 300–700 (`--term-weight`, font-weight). */
  weight: number | null;
  /** Brightness, the body text's value as an oklch lightness 55–92 (`--term-brightness`, the text colour). */
  brightness: number | null;
  /** Emphasis, the value headings and bold sit at, oklch lightness 72–96 (`--term-emphasis-value`). */
  emphasis: number | null;
}

export const DEFAULT_TERMINAL_TYPE: TerminalType = {
  size: null, leading: null, paragraph: null, tracking: null, wordSpacing: null,
  align: null, weight: null, brightness: null, emphasis: null,
};

/** A numeric control's bounds and the value its slider shows before the viewer moves it (the value the
 *  transcript draws today, so the slider starts where the type is). The design note's ranges and
 *  defaults. The `brightness`/`emphasis` display values are the oklch lightness of today's colours
 *  (#b9bec5 ≈ 78, #cdd1d7 ≈ 85). */
export interface TermSlider {
  key: "size" | "leading" | "paragraph" | "tracking" | "wordSpacing" | "weight" | "brightness" | "emphasis";
  label: string;
  min: number;
  max: number;
  step: number;
  /** Where the slider sits before a pick (today's value); the pick itself writes a non-null value. */
  display: number;
}

export const TERM_SLIDERS: readonly TermSlider[] = [
  { key: "size", label: "size", min: 10, max: 18, step: 1, display: 13 },
  { key: "leading", label: "leading", min: 1.1, max: 2.2, step: 0.02, display: 1.54 },
  { key: "paragraph", label: "paragraph", min: 4, max: 20, step: 1, display: 10 },
  { key: "tracking", label: "tracking", min: -0.04, max: 0.12, step: 0.005, display: 0 },
  { key: "wordSpacing", label: "word spacing", min: -0.1, max: 0.6, step: 0.02, display: 0 },
  { key: "weight", label: "weight", min: 300, max: 700, step: 100, display: 400 },
  { key: "brightness", label: "brightness", min: 55, max: 92, step: 1, display: 78 },
  { key: "emphasis", label: "emphasis", min: 72, max: 96, step: 1, display: 85 },
];

/** The "dense" preset the Architect named ("tight," "dense"): tight leading and negative tracking at
 *  once. Not a primitive — a pair of settings. */
export const DENSE_PRESET: Partial<TerminalType> = { leading: 1.2, tracking: -0.02 };

/** The CSS variables for a terminal-type choice. A parameter the viewer has not moved (null) emits no
 *  variable, so `var(--term-…, <default>)` falls back to today's value. Set on each transcript
 *  container; the rows inherit them and read them. */
export function terminalTypeVars(t: TerminalType): Record<string, string> {
  const v: Record<string, string> = {};
  if (t.size != null) v["--term-size"] = `${t.size}px`;
  if (t.leading != null) v["--term-leading"] = String(t.leading);
  if (t.paragraph != null) v["--term-paragraph"] = `${t.paragraph}px`;
  if (t.tracking != null) v["--term-tracking"] = `${t.tracking}em`;
  if (t.wordSpacing != null) v["--term-word-spacing"] = `${t.wordSpacing}em`;
  if (t.align != null) v["--term-align"] = t.align;
  if (t.weight != null) v["--term-weight"] = String(t.weight);
  // Brightness and emphasis are the text's value: an oklch lightness, a small blue-grey chroma on the
  // palette's hue (#b9bec5/#cdd1d7 are tinted to ~255°), so a brighter pick stays the same colour, lighter.
  if (t.brightness != null) v["--term-brightness"] = `oklch(${t.brightness}% 0.012 255)`;
  if (t.emphasis != null) v["--term-emphasis-value"] = `oklch(${t.emphasis}% 0.012 255)`;
  return v;
}

/** The transcript container's own typographic style, reading each variable with today's value as the
 *  fallback — so an unset variable renders exactly as before. The inheriting properties (size, leading,
 *  tracking, word spacing, alignment, weight) sit on the container and cascade to every row; the
 *  per-element ones (brightness on the body text, emphasis on headings/bold, paragraph spacing on
 *  blocks) read their variables where they are drawn. `baseLineHeight` differs per surface (the pane,
 *  meta, the editor's terminal), so each container passes its own. */
export function transcriptTypeStyle(baseFontSizePx: number, baseLineHeight: number): Record<string, string> {
  return {
    fontSize: `var(--term-size, ${baseFontSizePx}px)`,
    lineHeight: `var(--term-leading, ${baseLineHeight})`,
    letterSpacing: "var(--term-tracking, normal)",
    wordSpacing: "var(--term-word-spacing, normal)",
    textAlign: "var(--term-align, left)",
    fontWeight: "var(--term-weight, 400)",
  };
}

/** A saved terminal-type object, each field kept only if it is in range (or the alignment enum);
 *  anything else falls back to null (today's value). Loaded from localStorage, where a hand-edit or an
 *  older build could leave a wrong shape. */
export function sanitizeTerminalType(raw: unknown): TerminalType {
  const out: TerminalType = { ...DEFAULT_TERMINAL_TYPE };
  if (!raw || typeof raw !== "object") return out;
  const s = raw as Record<string, unknown>;
  for (const slider of TERM_SLIDERS) {
    const val = s[slider.key];
    if (typeof val === "number" && val >= slider.min && val <= slider.max) {
      (out[slider.key] as number) = val;
    }
  }
  if (TERM_ALIGNS.includes(s.align as TermAlign)) out.align = s.align as TermAlign;
  return out;
}
