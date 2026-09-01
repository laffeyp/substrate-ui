// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
/* Sprint 036a — desktop-view driver picker.

   Mounts inside the desktop-view session-header (#driver-picker). Reads
   GET /api/models to populate the dropdown; reads GET /api/session to
   bind to the current live/parked session; on user change, fires
   PATCH /api/session/<id> {driver} and emits DRIVER_PATCHED on ACK
   (SPEC-3: same wire as web/terminal.ts's `/model` slash from sprint 035t).

   Public surface: `mountDriverPicker(root, deps?) → DriverPickerHandle`.
   The handle exposes `.refresh()` for callers that create or end sessions
   externally; the terminal view calls it after DRIVER_SESSION_STARTED so
   the desktop picker binds to the just-opened session without a page
   reload. Everything else is `_`-prefixed local. */

import { emit } from "../instrumentation/sdd";
import { postJson, fetchJson, fetchGet, type FetchResult } from "../lib/fetch";

export interface DriverPickerHandle {
  refresh: (preferSid?: string | null) => Promise<void>;
  el: HTMLElement;
  select: HTMLSelectElement;
  status: HTMLSpanElement;
  currentSessionId: () => string | null;
}

export interface DriverPickerDeps {
  api?: (path: string) => Promise<any>;
}

type ModelsResponse = { models?: string[]; cli?: string[]; default?: string };
type SessionBucket = { session_id: string; driver: string; name?: string | null; status?: string };
type SessionList = { live?: SessionBucket[]; parked?: SessionBucket[]; ended?: SessionBucket[]; interrupted?: SessionBucket[] };

const _mkSelect = (): HTMLSelectElement => {
  const s = document.createElement("select");
  s.id = "driver-picker-select";
  s.title = "session driver — change fires PATCH /api/session/<id> {driver}";
  s.style.marginLeft = "6px";
  return s;
};

const _mkStatus = (): HTMLSpanElement => {
  const s = document.createElement("span");
  s.id = "driver-picker-status";
  s.className = "dim sm";
  s.style.marginLeft = "8px";
  return s;
};

const _populateOptions = async (select: HTMLSelectElement): Promise<string[]> => {
  const result = await fetchGet<ModelsResponse>("/api/models");
  const merged = new Set<string>(["deterministic"]);
  if (result.ok) {
    for (const m of result.data.models || []) merged.add(m);
    for (const c of result.data.cli || []) merged.add(c);
  }
  const options = Array.from(merged);
  select.innerHTML = options.map((m) => `<option value="${m}">${m}</option>`).join("");
  return options;
};

const _readCurrentSession = async (preferSid: string | null): Promise<{ session_id: string; driver: string } | null> => {
  const result = await fetchGet<SessionList>("/api/session");
  if (!result.ok) return null;
  const s = result.data;
  // Prefer the caller-nominated sid across every bucket. This is how
  // `substrate:session-changed{detail.session_id}` routes the terminal's
  // just-opened session into the picker even if it's parked already.
  if (preferSid) {
    const pool = [
      ...(s.live || []),
      ...(s.parked || []),
      ...(s.interrupted || []),
    ];
    const match = pool.find((b) => b.session_id === preferSid);
    if (match) return { session_id: match.session_id, driver: match.driver };
  }
  // Without a nomination: bind to a LIVE session only. Parked sessions
  // from prior daemon runs would otherwise steal the picker away from
  // the user's about-to-open session (Sprint 041 fix).
  const first = (s.live || [])[0];
  if (!first) return null;
  return { session_id: first.session_id, driver: first.driver };
};

export function mountDriverPicker(root: HTMLElement, _deps: DriverPickerDeps = {}): DriverPickerHandle {
  root.innerHTML = "";
  const label = document.createElement("label");
  label.textContent = "driver";
  label.style.color = "var(--tx-dim)";
  label.style.fontSize = "12px";
  const select = _mkSelect();
  const status = _mkStatus();
  status.textContent = "· no live session";
  label.appendChild(select);
  root.appendChild(label);
  root.appendChild(status);

  let sessionId: string | null = null;
  let priorDriver: string | null = null;

  const handle: DriverPickerHandle = {
    el: root,
    select,
    status,
    currentSessionId: () => sessionId,
    async refresh(preferSid: string | null = null) {
      const modelsResult = await fetchGet<ModelsResponse>("/api/models");
      await _populateOptions(select);
      const current = await _readCurrentSession(preferSid);
      if (!current) {
        // Sprint 045: pre-session, keep the picker VISIBLE with the API
        // default pre-selected so it acts as the create-time choice.
        // Terminal.ts (_openSession) reads select.value when the parent
        // is visible, so a first message opens against whatever the user
        // sees here. Pre-041 the picker collapsed pre-session; that read
        // as "no picker" for a user who wanted to change the model
        // before typing.
        sessionId = null;
        priorDriver = null;
        root.style.display = "";
        const apiDefault = (modelsResult.ok && modelsResult.data.default) || "";
        const options = Array.from(select.options).map((o) => o.value);
        if (apiDefault && options.includes(apiDefault)) select.value = apiDefault;
        select.disabled = false;
        status.textContent = "· pick a driver, then type to open a session";
        return;
      }
      root.style.display = "";
      sessionId = current.session_id;
      priorDriver = current.driver;
      const options = Array.from(select.options).map((o) => o.value);
      if (!options.includes(current.driver)) {
        const opt = document.createElement("option");
        opt.value = current.driver;
        opt.textContent = current.driver;
        select.appendChild(opt);
      }
      select.value = current.driver;
      select.disabled = false;
      status.textContent = `· session ${sessionId.slice(0, 12)}…`;
    },
  };

  select.addEventListener("change", async () => {
    const next = select.value;
    if (!sessionId) {
      status.textContent = "· no live session — cannot patch";
      return;
    }
    if (priorDriver === next) return;
    const priorSnapshot = priorDriver;
    const result: FetchResult<{ driver?: string }> = await fetchJson<{ driver?: string }>(
      `/api/session/${encodeURIComponent(sessionId)}`,
      "PATCH",
      { driver: next },
    );
    if (!result.ok) {
      status.textContent = `· PATCH failed [${result.failure_class}] ${result.detail}`;
      if (priorSnapshot) select.value = priorSnapshot;
      return;
    }
    priorDriver = next;
    emit("DRIVER_PATCHED", { session_id: sessionId, driver: next, prior_driver: priorSnapshot ?? "" });
    status.textContent = `· driver → ${next}`;
  });

  // Suppress the unused import lint for postJson (kept exported for callers
  // that build session-creation dialogs on top of this control later).
  void postJson;

  void handle.refresh();
  return handle;
}
