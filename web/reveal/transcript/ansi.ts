// Minimal ANSI/CSI parser for the AuthPromptCard terminal view.
//
// Handles the subset that opencode's TUI picker + codex/cursor-agent/
// claude login flows actually emit:
//   - SGR (\x1b[<n>[;<n>...]m) — color + bold + reset
//   - Cursor up/down/left/right (\x1b[<n>A/B/C/D), defaults to 1
//   - Cursor absolute position (\x1b[<row>;<col>H, \x1b[H)
//   - Save/restore cursor (\x1b[s / \x1b[u) — best-effort
//   - Erase in line (\x1b[K = to end, \x1b[1K = to start, \x1b[2K = whole)
//   - Erase in display (\x1b[2J = whole, \x1b[J = to end)
//   - Backspace \b, carriage return \r, newline \n, tab \t
//
// The grid grows as rows are used. New content past the last row extends
// the grid. Rendering emits one <div> per row with color spans grouped
// by SGR runs — no fixed rows×cols dimensions.
//
// What this deliberately does NOT do: alternate screen buffer,
// scroll regions, mouse tracking, character sets. Not needed for
// login-shaped TUIs.

export interface Sgr {
  fg?: string;   // hex color or named
  bg?: string;
  bold?: boolean;
  dim?: boolean;
  reverse?: boolean;
}

interface Cell {
  ch: string;
  sgr: Sgr;
}

const EMPTY_SGR: Sgr = {};

// Standard 16-color palette. Approximate iTerm/xterm hues.
const ANSI_16: string[] = [
  "#212327", // 0 black
  "#c26058", // 1 red
  "#7fb3b8", // 2 green
  "#c9b98e", // 3 yellow
  "#82a5c8", // 4 blue
  "#b28dc4", // 5 magenta
  "#7fb3b8", // 6 cyan
  "#b9bec5", // 7 white
  "#4a4e55", // 8 bright black
  "#e07c73", // 9 bright red
  "#94c5ca", // 10 bright green
  "#dbcb9d", // 11 bright yellow
  "#9dbfe0", // 12 bright blue
  "#c9a4de", // 13 bright magenta
  "#94c5ca", // 14 bright cyan
  "#e2e5e9", // 15 bright white
];

function sgrColor(n: number, kind: "fg" | "bg"): string | undefined {
  if (n === 39 && kind === "fg") return undefined; // default fg
  if (n === 49 && kind === "bg") return undefined; // default bg
  if (n >= 30 && n <= 37) return ANSI_16[n - 30];
  if (n >= 90 && n <= 97) return ANSI_16[8 + (n - 90)];
  if (n >= 40 && n <= 47) return ANSI_16[n - 40];
  if (n >= 100 && n <= 107) return ANSI_16[8 + (n - 100)];
  return undefined;
}

export class AnsiTerminal {
  private grid: Cell[][] = [[]];
  private row = 0;
  private col = 0;
  private sgr: Sgr = EMPTY_SGR;
  private savedRow = 0;
  private savedCol = 0;
  // A partial escape sequence carried between chunks so a split mid-CSI
  // still parses correctly.
  private pending = "";

  write(input: string): void {
    const text = this.pending + input;
    this.pending = "";
    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (ch === "\x1b") {
        // Look for CSI: \x1b[ ... [A-Za-z@`]
        if (i + 1 >= text.length) { this.pending = text.slice(i); return; }
        const next = text[i + 1];
        if (next === "[") {
          // Scan the CSI body until final byte.
          let j = i + 2;
          while (j < text.length) {
            const c = text[j];
            if (c && c >= "@" && c <= "~") break;
            j++;
          }
          if (j >= text.length) { this.pending = text.slice(i); return; }
          const body = text.slice(i + 2, j);
          const finalByte = text[j];
          this.applyCsi(body, finalByte);
          i = j + 1;
          continue;
        }
        // OSC or other — skip until BEL or ST. Best-effort.
        if (next === "]") {
          const bel = text.indexOf("\x07", i + 2);
          if (bel === -1) { this.pending = text.slice(i); return; }
          i = bel + 1;
          continue;
        }
        // Unknown 2-byte escape — skip both.
        i += 2;
        continue;
      }
      if (ch === "\n") { this.row++; this.ensureRow(this.row); i++; continue; }
      if (ch === "\r") { this.col = 0; i++; continue; }
      if (ch === "\b") { if (this.col > 0) this.col--; i++; continue; }
      if (ch === "\t") { this.col = (Math.floor(this.col / 8) + 1) * 8; i++; continue; }
      // Printable (including UTF-8 bytes already assembled by decodeURIComponent).
      this.put(ch);
      i++;
    }
  }

  private applyCsi(body: string, finalByte: string): void {
    const params = body === "" ? [] : body.split(";").map((s) => parseInt(s, 10));
    const n = params[0] ?? 0;
    const n1 = params[0] ?? 1;
    switch (finalByte) {
      case "A": this.row = Math.max(0, this.row - n1); return;
      case "B": this.row = this.row + n1; this.ensureRow(this.row); return;
      case "C": this.col = this.col + n1; return;
      case "D": this.col = Math.max(0, this.col - n1); return;
      case "H": case "f": {
        const r = (params[0] ?? 1) - 1;
        const c = (params[1] ?? 1) - 1;
        this.row = Math.max(0, r); this.col = Math.max(0, c);
        this.ensureRow(this.row);
        return;
      }
      case "s": this.savedRow = this.row; this.savedCol = this.col; return;
      case "u": this.row = this.savedRow; this.col = this.savedCol; this.ensureRow(this.row); return;
      case "K": {
        const line = this.grid[this.row];
        if (n === 0 || params.length === 0) { line.length = this.col; }
        else if (n === 1) { for (let k = 0; k <= this.col && k < line.length; k++) line[k] = { ch: " ", sgr: this.sgr }; }
        else if (n === 2) { line.length = 0; }
        return;
      }
      case "J": {
        if (n === 2) { this.grid = [[]]; this.row = 0; this.col = 0; }
        else if (n === 0 || params.length === 0) {
          this.grid[this.row].length = this.col;
          this.grid.length = this.row + 1;
        }
        return;
      }
      case "m": {
        if (params.length === 0) { this.sgr = EMPTY_SGR; return; }
        let next: Sgr = { ...this.sgr };
        for (let k = 0; k < params.length; k++) {
          const p = params[k];
          if (p === 0 || Number.isNaN(p)) { next = {}; continue; }
          if (p === 1) { next.bold = true; continue; }
          if (p === 2) { next.dim = true; continue; }
          if (p === 7) { next.reverse = true; continue; }
          if (p === 22) { next.bold = false; next.dim = false; continue; }
          if (p === 27) { next.reverse = false; continue; }
          if (p === 38 && params[k + 1] === 5) { const col = params[k + 2]; if (typeof col === "number") next.fg = ANSI_16[col] ?? next.fg; k += 2; continue; }
          if (p === 48 && params[k + 1] === 5) { const col = params[k + 2]; if (typeof col === "number") next.bg = ANSI_16[col] ?? next.bg; k += 2; continue; }
          const fg = sgrColor(p, "fg"); if (fg !== undefined || p === 39) { next.fg = fg; continue; }
          const bg = sgrColor(p, "bg"); if (bg !== undefined || p === 49) { next.bg = bg; continue; }
        }
        this.sgr = next;
        return;
      }
      default: return; // silently ignore unknowns
    }
  }

  private put(ch: string): void {
    this.ensureRow(this.row);
    const line = this.grid[this.row];
    while (line.length < this.col) line.push({ ch: " ", sgr: EMPTY_SGR });
    line[this.col] = { ch, sgr: this.sgr };
    this.col++;
  }

  private ensureRow(r: number): void {
    while (this.grid.length <= r) this.grid.push([]);
  }

  reset(): void {
    this.grid = [[]]; this.row = 0; this.col = 0; this.sgr = EMPTY_SGR; this.pending = "";
  }

  /** Snapshot the grid for React rendering. Runs cells by SGR to
   *  minimise the number of spans. */
  snapshot(): { rows: { runs: { text: string; sgr: Sgr }[] }[]; cursor: { row: number; col: number } } {
    const rows = this.grid.map((line) => {
      if (line.length === 0) return { runs: [{ text: "", sgr: EMPTY_SGR }] };
      const runs: { text: string; sgr: Sgr }[] = [];
      let current: { text: string; sgr: Sgr } = { text: "", sgr: line[0]?.sgr ?? EMPTY_SGR };
      for (const cell of line) {
        const c = cell ?? { ch: " ", sgr: EMPTY_SGR };
        if (sgrEquals(c.sgr, current.sgr)) current.text += c.ch;
        else { runs.push(current); current = { text: c.ch, sgr: c.sgr }; }
      }
      runs.push(current);
      return { runs };
    });
    return { rows, cursor: { row: this.row, col: this.col } };
  }
}

function sgrEquals(a: Sgr, b: Sgr): boolean {
  return a.fg === b.fg && a.bg === b.bg && !!a.bold === !!b.bold
    && !!a.dim === !!b.dim && !!a.reverse === !!b.reverse;
}

/** Translate a browser KeyboardEvent to the byte sequence a pty expects. */
export function keyToBytes(ev: KeyboardEvent): string | null {
  // Ctrl-<letter>: 0x01–0x1a (control codes).
  if (ev.ctrlKey && !ev.metaKey && !ev.altKey && ev.key.length === 1) {
    const c = ev.key.toLowerCase().charCodeAt(0);
    if (c >= 97 && c <= 122) return String.fromCharCode(c - 96);
  }
  switch (ev.key) {
    case "ArrowUp":    return "\x1b[A";
    case "ArrowDown":  return "\x1b[B";
    case "ArrowRight": return "\x1b[C";
    case "ArrowLeft":  return "\x1b[D";
    case "Home":       return "\x1b[H";
    case "End":        return "\x1b[F";
    case "PageUp":     return "\x1b[5~";
    case "PageDown":   return "\x1b[6~";
    case "Enter":      return "\r";
    case "Backspace":  return "\x7f";
    case "Delete":     return "\x1b[3~";
    case "Tab":        return "\t";
    case "Escape":     return "\x1b";
    default:
      if (ev.key.length === 1 && !ev.metaKey) return ev.key;
      return null;
  }
}
