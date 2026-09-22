/* Sprint 035x — stateless helpers used by the terminal module + its
   slash handlers. Extracted from web/terminal.ts. */

/**
 * Append a body-line to the terminal body. Scrolls to bottom afterward
 * so the newest line is always visible.
 */
export function push(body: HTMLDivElement, text: string, cls: string): void {
  const div = document.createElement("div");
  div.className = `term-line ${cls}`;
  div.textContent = text;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

/**
 * Render the driver_params dict as the header hint text:
 * `think X · tokens Y · timeout Zs`. `max_tokens: 0` (or unset) → `∞`.
 */
export function formatParamsHint(params: Record<string, unknown> | null | undefined): string {
  const p = params ?? {};
  const think = p.think === true ? "on" : "off";
  const tokensRaw = p.max_tokens;
  const tokens = (typeof tokensRaw === "number" && tokensRaw > 0) ? String(tokensRaw) : "∞";
  const timeoutRaw = p.timeout;
  const timeout = (typeof timeoutRaw === "number" && timeoutRaw > 0) ? `${timeoutRaw}s` : "300s";
  return `think ${think} · tokens ${tokens} · timeout ${timeout}`;
}
