// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
/* web/lib/fetch.ts — shared JSON fetch helpers with typed FetchResult.
   Extracted from web/terminal.ts as part of sprint 036a per
   REVIEW-2026-08-28-piece-g-eod SPEC-3: the desktop-view controls and the
   terminal share the same PATCH endpoints; they must share the wire helper
   rather than reimplement it. Three shapes:
   - _postJson<T>(url, body) — POST
   - _fetchJson<T>(url, method, body) — PATCH / POST / DELETE
   - _fetchGet<T>(url) — GET (no body)

   All three return the same discriminated `FetchResult<T>`. Callers read
   `result.failure_class` on ok:false and surface the class in their own
   error line. No `.catch(() => null)` swallowing anywhere in this module. */

export type FetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; failure_class: "network" | "http" | "parse"; detail: string };

const _parseBody = <T>(text: string): FetchResult<T> => {
  if (!text) return { ok: true, data: {} as T };
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, failure_class: "parse", detail };
  }
};

const _extractHttpDetail = (status: number, text: string): string => {
  let detail = `HTTP ${status}`;
  try {
    const parsed = JSON.parse(text) as { error?: string };
    if (parsed.error) detail = `HTTP ${status}: ${parsed.error}`;
  } catch {
    /* body was not JSON; the plain status suffices */
  }
  return detail;
};

export async function postJson<T = Record<string, unknown>>(
  url: string,
  body: unknown,
): Promise<FetchResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return {
      ok: false,
      failure_class: "network",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
  const text = await response.text();
  if (!response.ok) {
    return { ok: false, failure_class: "http", detail: _extractHttpDetail(response.status, text) };
  }
  return _parseBody<T>(text);
}

export async function fetchJson<T = Record<string, unknown>>(
  url: string,
  method: string,
  body: unknown,
): Promise<FetchResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return {
      ok: false,
      failure_class: "network",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
  const text = await response.text();
  if (!response.ok) {
    return { ok: false, failure_class: "http", detail: _extractHttpDetail(response.status, text) };
  }
  return _parseBody<T>(text);
}

export async function fetchGet<T>(url: string): Promise<FetchResult<T>> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    return {
      ok: false,
      failure_class: "network",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
  const text = await response.text();
  if (!response.ok) {
    return { ok: false, failure_class: "http", detail: _extractHttpDetail(response.status, text) };
  }
  return _parseBody<T>(text);
}
