// AnchorPainter — per-anchor rAF-coalesced repaint from a byte state.
// Every anchor testid registers a canvas here; setByte(id, b) schedules a
// paint for the next animation frame; ANCHOR_PAINTED fires after paint.

import { emit } from "./Emitter";

const canvases = new Map<string, HTMLCanvasElement>();
const pending = new Map<string, number>();
let rafHandle: number | null = null;

export function register(id: string, canvas: HTMLCanvasElement, initialByte = 0): void {
  canvases.set(id, canvas);
  paint(id, initialByte);
}

export function unregister(id: string): void {
  canvases.delete(id);
  pending.delete(id);
}

export function setByte(id: string, byte: number): void {
  pending.set(id, byte & 0xff);
  if (rafHandle === null) rafHandle = requestAnimationFrame(flush);
}

function flush(): void {
  rafHandle = null;
  const batch = Array.from(pending.entries());
  pending.clear();
  for (const [id, byte] of batch) paint(id, byte);
}

function paint(id: string, byte: number): void {
  const c = canvases.get(id);
  if (!c) return;
  const ctx = c.getContext("2d");
  if (!ctx) return;
  const b = byte & 0xff;
  ctx.fillStyle = `rgb(${b},${b},${b})`;
  ctx.fillRect(0, 0, 1, 1);
  emit("ANCHOR_PAINTED", { anchor_id: id, byte: b });
}
