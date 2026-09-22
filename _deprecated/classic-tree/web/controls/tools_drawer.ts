/* Sprint 036d — desktop tools-restriction drawer + create-time field.

   Two surfaces, one control:
   - `mountToolsDrawer(root)` — session-header drawer with a text input
     for a comma-separated tool list + Apply button. Mid-session
     PATCH /api/session/<id> {tools: sorted_list}. Empty input =
     unrestricted (PATCH {tools: []} clears the restriction).
   - `toolsField()` — DialogField for the new-session dialog (036c).
     Same comma-separated shape; value ships in the create body.

   Card deviation. The pending 036d card called for "checkbox per tool
   the attached bundle exposes." Shipped bundles today declare empty
   `tools_enabled` (verified via GET /api/bundles at review open) — no
   candidate list exists to render checkboxes against. The comma-
   separated input matches the CLI `/tools` slash shape (sprint 035s)
   verbatim; parity with cli.py stays trivial. Recorded in the 036d
   CLOSEOUT-ADDENDUM.

   Tools list is sorted lexicographically before PATCH so the payload
   is byte-identical regardless of user input order — the card's
   "sort invariant." */

import { emit } from "../instrumentation/sdd";
import { fetchJson, fetchGet, type FetchResult } from "../lib/fetch";
import type { DialogField } from "./workspace_picker";

type SessionBucket = { session_id: string };
type SessionList = { live?: SessionBucket[]; parked?: SessionBucket[]; ended?: SessionBucket[]; interrupted?: SessionBucket[] };
type ManifestSlice = { session_id?: string; tools?: string[] | null };

const _parseCsv = (raw: string): string[] => {
  const out: string[] = [];
  for (const piece of raw.split(",")) {
    const t = piece.trim();
    if (t) out.push(t);
  }
  return Array.from(new Set(out)).sort();
};

const _readCurrentSessionId = async (preferSid: string | null): Promise<string | null> => {
  const result = await fetchGet<SessionList>("/api/session");
  if (!result.ok) return null;
  const s = result.data;
  if (preferSid) {
    const pool = [
      ...(s.live || []),
      ...(s.parked || []),
      ...(s.interrupted || []),
    ];
    const match = pool.find((b) => b.session_id === preferSid);
    if (match) return match.session_id;
  }
  // Live-only initial bind (Sprint 041): parked sessions from prior
  // daemon runs would otherwise steal the drawer.
  return (s.live || [])[0]?.session_id ?? null;
};

const _readManifestTools = async (sid: string): Promise<string[] | null> => {
  const result = await fetchGet<ManifestSlice>(`/api/session/${encodeURIComponent(sid)}`);
  if (!result.ok) return null;
  const t = result.data.tools;
  if (!t || !Array.isArray(t)) return null;
  return t;
};

export interface ToolsDrawerHandle {
  refresh: (preferSid?: string | null) => Promise<void>;
  el: HTMLElement;
  input: HTMLInputElement;
  status: HTMLSpanElement;
  currentSessionId: () => string | null;
}

export function mountToolsDrawer(root: HTMLElement): ToolsDrawerHandle {
  root.innerHTML = "";
  const label = document.createElement("label");
  label.textContent = "tools";
  label.style.fontSize = "12px";
  label.style.color = "var(--tx-dim)";
  const input = document.createElement("input");
  input.type = "text";
  input.id = "tools-drawer-input";
  input.placeholder = "read_file, grep (empty = unrestricted)";
  input.title = "comma-separated tool names; empty = unrestricted";
  input.style.marginLeft = "6px";
  input.style.padding = "2px 6px";
  input.style.background = "var(--panel-bg, #111)";
  input.style.border = "1px solid var(--line2)";
  input.style.borderRadius = "4px";
  input.style.color = "var(--tx)";
  input.style.width = "140px";
  input.disabled = true;
  const apply = document.createElement("button");
  apply.type = "button";
  apply.className = "btn";
  apply.id = "tools-drawer-apply";
  apply.textContent = "apply";
  apply.disabled = true;
  apply.style.marginLeft = "4px";
  const status = document.createElement("span");
  status.id = "tools-drawer-status";
  status.className = "dim sm";
  status.style.marginLeft = "6px";
  status.textContent = "· no live session";
  label.appendChild(input);
  root.appendChild(label);
  root.appendChild(apply);
  root.appendChild(status);

  let sessionId: string | null = null;

  const handle: ToolsDrawerHandle = {
    el: root,
    input,
    status,
    currentSessionId: () => sessionId,
    async refresh(preferSid: string | null = null) {
      const sid = await _readCurrentSessionId(preferSid);
      if (!sid) {
        sessionId = null;
        input.value = "";
        input.disabled = true;
        apply.disabled = true;
        // Sprint 041 pre-session hide.
        root.style.display = "none";
        return;
      }
      root.style.display = "";
      sessionId = sid;
      const tools = await _readManifestTools(sid);
      input.value = tools ? tools.join(", ") : "";
      input.disabled = false;
      apply.disabled = false;
      status.textContent = tools
        ? `· ${tools.length} restricted`
        : `· unrestricted`;
    },
  };

  apply.addEventListener("click", async () => {
    if (!sessionId) return;
    const sorted = _parseCsv(input.value);
    const patchBody = { tools: sorted };
    const result: FetchResult<{ tools?: string[] }> = await fetchJson<{ tools?: string[] }>(
      `/api/session/${encodeURIComponent(sessionId)}`,
      "PATCH",
      patchBody,
    );
    if (!result.ok) {
      status.textContent = `· PATCH failed [${result.failure_class}] ${result.detail}`;
      return;
    }
    emit("TOOLS_RESTRICTED", { session_id: sessionId, tools: sorted });
    input.value = sorted.join(", ");
    status.textContent = sorted.length === 0
      ? `· unrestricted`
      : `· ${sorted.length} restricted (sorted)`;
  });

  void handle.refresh();
  return handle;
}

// Create-time field for the 036c new-session dialog. Same CSV shape as the
// mid-session drawer; the dialog's Create submit ships the sorted list in
// the POST body as `tools`.
export function toolsField(): DialogField {
  let input!: HTMLInputElement;
  return {
    name: "tools",
    render(into: HTMLElement) {
      const label = document.createElement("label");
      label.textContent = "tools (comma-separated)";
      label.style.fontSize = "12px";
      label.style.color = "var(--tx-dim)";
      label.style.display = "flex";
      label.style.flexDirection = "column";
      label.style.gap = "3px";
      input = document.createElement("input");
      input.type = "text";
      input.id = "tools-field-input";
      input.placeholder = "read_file, grep (empty = unrestricted)";
      input.style.padding = "4px 6px";
      input.style.background = "var(--panel-bg, #111)";
      input.style.border = "1px solid var(--line2)";
      input.style.borderRadius = "4px";
      input.style.color = "var(--tx)";
      label.appendChild(input);
      into.appendChild(label);
    },
    value() {
      const sorted = _parseCsv(input.value);
      // Return undefined for empty so the dialog POST body drops the field
      // (empty tools[] would over-restrict a session the user did not intend
      // to restrict — a create with no `tools` key means "unrestricted").
      return sorted.length ? sorted : undefined;
    },
    reset() { input.value = ""; },
  };
}
