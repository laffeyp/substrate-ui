// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The window's settings: theme, type size and the editor's key binding (sprint 423), kept in localStorage per viewer (sprint 204; plan
// PLAN-2026-11-04-shell-to-react-r5.md, A5b). They never reach the server or a session's record.
//
// Moved out of reveal_component.ts unchanged: the same key, the same checks on load, the same note.
// App loads them at mount (`loadSettings`) and reads the type size; the settings dialog
// (web/app/Dialogs.tsx) calls `pickTheme` and `stepFont`.

import { createStore } from "../store";
import { LOOKS, type Look } from "../derive/look";

export type Theme = "dark" | "light" | "system";
export const THEMES: readonly Theme[] = ["dark", "light", "system"];
/** The editor's key binding (roadmap 2026-11-09-code-editor E4; D53): a normal editor by default; vim
 *  and nano are options (the Architect, 2026-11-09; sprint 427). */
export type Binding = "standard" | "vim" | "nano";
export const BINDINGS: readonly Binding[] = ["standard", "vim", "nano"];
export const FONT_MIN = 9;
export const FONT_MAX = 19;
const KEY = "substrate-ui.settings";
const LIGHT_NOTE = "noted — the light theme ships with the build; the prototype renders dark";

export interface SettingsState {
  theme: Theme;
  /** The type size the viewer chose; null means the app's default. */
  fontOverride: number | null;
  /** The line under the theme chips after a pick the build does not draw yet. */
  settingsNote: string;
  binding: Binding;
  /** The look (sprint 478): `new`, or `original`, the look before the appearance work, kept to compare against. */
  look: Look;
}

// One instance per window, kept on globalThis as in shell.ts. The page once loaded two copies of this
// module (sprint 213); Vite now bundles one, and the shared key costs nothing.
const KEY_SHARED = "__substrateSettings";
const scope = globalThis as unknown as Record<string, ReturnType<typeof createStore<SettingsState>> | undefined>;
export const settings = scope[KEY_SHARED] ?? (scope[KEY_SHARED] = createStore<SettingsState>({ theme: "dark", fontOverride: null, settingsNote: "", binding: "standard", look: "new" }));

/** The saved fields that pass their checks; anything else is left at its default. */
export function readSaved(raw: string | null): Partial<SettingsState> {
  if (!raw) return {};
  let s: unknown;
  try { s = JSON.parse(raw); } catch { return {}; }
  if (!s || typeof s !== "object") return {};
  const saved = s as Record<string, unknown>;
  const patch: Partial<SettingsState> = {};
  if (THEMES.includes(saved.theme as Theme)) patch.theme = saved.theme as Theme;
  if (typeof saved.fontOverride === "number" && saved.fontOverride >= FONT_MIN && saved.fontOverride <= FONT_MAX) patch.fontOverride = saved.fontOverride;
  if (BINDINGS.includes(saved.binding as Binding)) patch.binding = saved.binding as Binding;
  if (LOOKS.includes(saved.look as Look)) patch.look = saved.look as Look;
  return patch;
}

/** Load once at mount. localStorage may be unavailable; the defaults then stand. */
export function loadSettings(): void {
  try { settings.set(readSaved(window.localStorage.getItem(KEY))); } catch { /* defaults stand */ }
}

function save(): void {
  try {
    const { theme, fontOverride, binding, look } = settings.getSnapshot();
    window.localStorage.setItem(KEY, JSON.stringify({ theme, fontOverride, binding, look }));
  } catch { /* not saved */ }
}

export function pickTheme(theme: Theme): void {
  settings.set({ theme, settingsNote: theme === "dark" ? "" : LIGHT_NOTE });
  save();
}

/** The size shown: the viewer's choice, else the app's default. */
export function fontSize(fallback: number): number {
  return settings.getSnapshot().fontOverride ?? fallback;
}

/** Step the size by `delta` px from what is shown, within FONT_MIN..FONT_MAX. */
export function stepFont(delta: number, fallback: number): void {
  const next = Math.min(FONT_MAX, Math.max(FONT_MIN, fontSize(fallback) + delta));
  settings.set({ fontOverride: next });
  save();
}

export function pickLook(look: Look): void {
  settings.set({ look });
  save();
}

export function pickBinding(binding: Binding): void {
  settings.set({ binding });
  save();
}

export function clearNote(): void {
  settings.set({ settingsNote: "" });
}
