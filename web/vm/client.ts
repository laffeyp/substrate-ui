// web/vm/client.ts — SubstrateClient port and the browser adapter.
//
// The Presentation Model talks to substrate through this interface. A shell
// running in a browser plugs in `BrowserSubstrateClient` (fetch + EventSource).
// A different shell — Electron in-process, a test harness — plugs in its own
// adapter without touching the controller.

import type { RecordEnvelope } from "./types";

export interface FetchOpts {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

/** Result shape carried by every network call so failures are typed. */
export type FetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; failureClass: string; detail: string };

/** Callback pair a Controller registers with `streamRecord`. */
export interface StreamHandlers {
  onEnvelope: (env: RecordEnvelope) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: unknown) => void;
}

/** Function returned by `streamRecord` — call to unsubscribe. */
export type Unsubscribe = () => void;

export interface SubstrateClient {
  fetchJson<T>(path: string, opts?: FetchOpts): Promise<FetchResult<T>>;
  streamRecord(sessionId: string, sinceSeq: number, handlers: StreamHandlers): Unsubscribe;
}

export class BrowserSubstrateClient implements SubstrateClient {
  constructor(private readonly baseUrl: string = "") {}

  async fetchJson<T>(path: string, opts: FetchOpts = {}): Promise<FetchResult<T>> {
    const url = this.baseUrl + path;
    const init: RequestInit = { method: opts.method ?? "GET" };
    const headers: Record<string, string> = { ...(opts.headers ?? {}) };
    if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.body);
    }
    if (Object.keys(headers).length) init.headers = headers;
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      return { ok: false, status: 0, failureClass: "network", detail };
    }
    let bodyText = "";
    try { bodyText = await response.text(); } catch { /* empty */ }
    if (!response.ok) {
      let failureClass = "http_error";
      let detail = bodyText;
      try {
        const parsed = JSON.parse(bodyText) as { failure_class?: string; detail?: string };
        if (parsed && typeof parsed.failure_class === "string") failureClass = parsed.failure_class;
        if (parsed && typeof parsed.detail === "string") detail = parsed.detail;
      } catch { /* keep raw text */ }
      return { ok: false, status: response.status, failureClass, detail };
    }
    if (!bodyText) return { ok: true, data: null as unknown as T };
    try {
      return { ok: true, data: JSON.parse(bodyText) as T };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      return { ok: false, status: response.status, failureClass: "json_parse", detail };
    }
  }

  streamRecord(sessionId: string, sinceSeq: number, handlers: StreamHandlers): Unsubscribe {
    const url = `${this.baseUrl}/api/session/${encodeURIComponent(sessionId)}/events?since_seq=${sinceSeq}`;
    const source = new EventSource(url);
    source.onopen = () => { handlers.onOpen?.(); };
    source.onmessage = (ev) => {
      try {
        const env = JSON.parse(ev.data) as RecordEnvelope;
        handlers.onEnvelope(env);
      } catch (err) {
        handlers.onError?.(err);
      }
    };
    source.onerror = (err) => {
      if (source.readyState === EventSource.CLOSED) handlers.onClose?.();
      else handlers.onError?.(err);
    };
    return () => { source.close(); };
  }
}
