/* Sprint 036b — desktop-view bundle picker.

   Mounts inside the desktop-view session-header (#bundle-picker). Reads
   GET /api/bundles (from sprint 034a) to populate the dropdown. Binds
   to the currently-live session via GET /api/session, listening on the
   `substrate:session-changed` window CustomEvent for rebinds (same
   pattern as the driver picker at sprint 036a).

   On user change, fires PATCH /api/session/<id> {bundle} — the mid-session
   bundle PATCH is live per sprint 032b's `_session_patch::_PATCHABLE`
   lift — and emits BUNDLE_ATTACHED{session_id, bundle, prior_bundle} on
   ACK (SPEC-3: same wire as web/terminal.ts's `/bundle` slash from
   sprint 035s).

   Note on TranscriptCompacted. Sprint 032b decided NOT to emit
   TranscriptCompacted{reason:"bundle_changed"} on the record — nothing
   gets compacted at bundle-change; only the NEXT turn's seed shape
   changes. This picker mirrors that: BUNDLE_ATTACHED is the whole
   contract. Recorded in the 036b CLOSEOUT-ADDENDUM. */

import { emit } from "../instrumentation/sdd";
import { fetchJson, fetchGet, type FetchResult } from "../lib/fetch";

export interface BundlePickerHandle {
  refresh: (preferSid?: string | null) => Promise<void>;
  el: HTMLElement;
  select: HTMLSelectElement;
  status: HTMLSpanElement;
  currentSessionId: () => string | null;
}

export interface BundlePickerDeps {
  api?: (path: string) => Promise<any>;
}

type BundleEntry = { name: string; description?: string };
type SessionBucket = { session_id: string; bundle?: string | null };
type SessionList = { live?: SessionBucket[]; parked?: SessionBucket[]; ended?: SessionBucket[]; interrupted?: SessionBucket[] };

const NO_BUNDLE = "";

const _mkSelect = (): HTMLSelectElement => {
  const s = document.createElement("select");
  s.id = "bundle-picker-select";
  s.title = "session bundle — change fires PATCH /api/session/<id> {bundle}";
  s.style.marginLeft = "6px";
  return s;
};

const _mkStatus = (): HTMLSpanElement => {
  const s = document.createElement("span");
  s.id = "bundle-picker-status";
  s.className = "dim sm";
  s.style.marginLeft = "8px";
  return s;
};

const _populateOptions = async (select: HTMLSelectElement): Promise<string[]> => {
  const result = await fetchGet<BundleEntry[]>("/api/bundles");
  const names = result.ok ? result.data.map((b) => b.name) : [];
  const options = [NO_BUNDLE, ...names];
  select.innerHTML = options
    .map((name) => `<option value="${name}">${name || "(none)"}</option>`)
    .join("");
  return options;
};

const _readCurrentSession = async (preferSid: string | null): Promise<{ session_id: string; bundle: string | null } | null> => {
  const result = await fetchGet<SessionList>("/api/session");
  if (!result.ok) return null;
  const s = result.data;
  const pool = [
    ...(s.live || []),
    ...(s.parked || []),
    ...(s.interrupted || []),
  ];
  if (preferSid) {
    const match = pool.find((b) => b.session_id === preferSid);
    if (match) return { session_id: match.session_id, bundle: match.bundle ?? null };
  }
  const first = pool[0];
  if (!first) return null;
  return { session_id: first.session_id, bundle: first.bundle ?? null };
};

export function mountBundlePicker(root: HTMLElement, _deps: BundlePickerDeps = {}): BundlePickerHandle {
  root.innerHTML = "";
  const label = document.createElement("label");
  label.textContent = "bundle";
  label.style.color = "var(--tx-dim)";
  label.style.fontSize = "12px";
  const select = _mkSelect();
  const status = _mkStatus();
  status.textContent = "· no live session";
  label.appendChild(select);
  root.appendChild(label);
  root.appendChild(status);

  let sessionId: string | null = null;
  let priorBundle: string | null = null;

  const handle: BundlePickerHandle = {
    el: root,
    select,
    status,
    currentSessionId: () => sessionId,
    async refresh(preferSid: string | null = null) {
      await _populateOptions(select);
      const current = await _readCurrentSession(preferSid);
      if (!current) {
        sessionId = null;
        priorBundle = null;
        select.disabled = true;
        status.textContent = "· no live session";
        return;
      }
      sessionId = current.session_id;
      priorBundle = current.bundle;
      const value = current.bundle ?? NO_BUNDLE;
      const options = Array.from(select.options).map((o) => o.value);
      if (!options.includes(value)) {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = value || "(none)";
        select.appendChild(opt);
      }
      select.value = value;
      select.disabled = false;
      status.textContent = current.bundle
        ? `· session ${sessionId.slice(0, 12)}… · ${current.bundle}`
        : `· session ${sessionId.slice(0, 12)}… · (none)`;
    },
  };

  select.addEventListener("change", async () => {
    const next = select.value;
    if (!sessionId) {
      status.textContent = "· no live session — cannot patch";
      return;
    }
    const priorForEmit = priorBundle;
    if ((priorBundle ?? NO_BUNDLE) === next) return;
    const patchBody = { bundle: next === NO_BUNDLE ? null : next };
    const result: FetchResult<{ bundle?: string | null }> = await fetchJson<{ bundle?: string | null }>(
      `/api/session/${encodeURIComponent(sessionId)}`,
      "PATCH",
      patchBody,
    );
    if (!result.ok) {
      status.textContent = `· PATCH failed [${result.failure_class}] ${result.detail}`;
      select.value = priorBundle ?? NO_BUNDLE;
      return;
    }
    priorBundle = next === NO_BUNDLE ? null : next;
    emit("BUNDLE_ATTACHED", {
      session_id: sessionId,
      bundle: next === NO_BUNDLE ? "" : next,
      prior_bundle: priorForEmit ?? null,
    });
    status.textContent = next === NO_BUNDLE
      ? `· bundle cleared`
      : `· bundle → ${next}`;
  });

  void handle.refresh();
  return handle;
}
