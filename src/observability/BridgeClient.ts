// BridgeClient — request/reply correlation over the Electron preload's
// `window.substrate.send` + `onMessage`. Every call mints a request_id
// (uuid4 12-hex), sends the op, and returns a Promise that resolves when a
// reply with the same request_id arrives.

import { newId } from "@/state/ids";

interface SubstrateApi {
  send: (msg: unknown) => Promise<unknown>;
  onMessage?: (cb: (msg: BridgeMessage) => void) => () => void;
}

export interface BridgeMessage {
  op: string;
  request_id?: string;
  ok?: boolean;
  reason?: string;
  result?: unknown;
  [k: string]: unknown;
}

interface Pending {
  resolve: (result: unknown) => void;
  reject: (reason: string) => void;
  timer: ReturnType<typeof setTimeout>;
}

const pending = new Map<string, Pending>();
let installed = false;

function api(): SubstrateApi | null {
  return (globalThis as unknown as { substrate?: SubstrateApi }).substrate ?? null;
}

function install(): void {
  if (installed) return;
  const s = api();
  if (!s?.onMessage) return;
  s.onMessage((msg) => {
    if (msg.op !== "reply" && msg.op !== "pong") return;
    const rid = msg.request_id;
    if (!rid) return;
    const p = pending.get(rid);
    if (!p) return;
    pending.delete(rid);
    clearTimeout(p.timer);
    if (msg.ok === false) p.reject(msg.reason ?? "bridge_error");
    else p.resolve(msg.result);
  });
  installed = true;
}

export async function bridgeRequest<T>(
  op: string,
  args: Record<string, unknown> = {},
  timeoutMs = 5000,
): Promise<T> {
  install();
  const s = api();
  if (!s) throw new Error("bridge_unavailable");
  const request_id = newId();
  const promise = new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(request_id);
      reject("timeout");
    }, timeoutMs);
    pending.set(request_id, {
      resolve: (r) => resolve(r as T),
      reject,
      timer,
    });
  });
  void s.send({ op, request_id, ...args });
  return promise;
}
