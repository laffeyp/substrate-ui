/* Sprint 036c — desktop-view workspace picker + new-session dialog +
   workspace_shape badge.

   Workspace is create-only per PRODUCT-SPEC §9c ("workspace_path frozen at
   seq 1"). Two surfaces:
   - `mountNewSessionDialog(triggerRoot, dialogRoot)` — a "New session"
     button that opens a modal with a workspace text input + Create.
     Submit fires POST /api/session with the collected workspace, emits
     WORKSPACE_SELECTED on ACK, and dispatches substrate:session-changed
     with the fresh session_id so the driver/bundle pickers rebind.
   - `mountWorkspaceShapeBadge(root)` — a read-only badge that shows the
     current session's workspace_shape (flat / worktree / isolate). Reads
     GET /api/session on mount and on substrate:session-changed.

   The workspace input is a plain text field with client-side validation
   (non-empty, absolute path). No native file-picker — browsers cannot
   return arbitrary host paths, and the CLI's `--workspace` flag is a
   string. Sprint 036f parity is trivial as a result.

   Later cards (036d tools, 036e isolate) will register additional
   controls into the same dialog. This card leaves a `registerField`
   seam on the dialog handle so those cards can add their inputs
   without editing this file. */

import { emit } from "../instrumentation/sdd";
import { postJson, fetchGet, type FetchResult } from "../lib/fetch";

type SessionBucket = { session_id: string; workspace?: string | null; workspace_shape?: string | null };
type SessionList = { live?: SessionBucket[]; parked?: SessionBucket[]; ended?: SessionBucket[]; interrupted?: SessionBucket[] };
type CreateResponse = { session_id: string; workspace?: string; workspace_shape?: string; bundle?: string | null; driver_params?: unknown };

const _isAbsolutePath = (p: string): boolean => p.startsWith("/");
const _hasForbiddenChars = (p: string): boolean => /[\0\r\n]/.test(p);

// Dialog control shape. 036d/036e cards register additional fields whose
// values ride the same POST body. The dialog owns the button, the modal,
// and the submit wire; each registered control owns its own input DOM.
export interface DialogField {
  name: string;
  render: (into: HTMLElement) => void;
  value: () => unknown;
  reset?: () => void;
}

export interface NewSessionDialogHandle {
  triggerEl: HTMLElement;
  dialogEl: HTMLElement;
  registerField: (field: DialogField) => void;
  open: () => void;
  close: () => void;
}

export function mountNewSessionDialog(triggerRoot: HTMLElement, dialogRoot: HTMLElement): NewSessionDialogHandle {
  triggerRoot.innerHTML = "";
  dialogRoot.innerHTML = "";

  const button = document.createElement("button");
  button.className = "btn";
  button.id = "new-session-btn";
  button.textContent = "+ new session";
  button.title = "open the new-session dialog";
  triggerRoot.appendChild(button);

  dialogRoot.style.display = "none";
  dialogRoot.style.position = "fixed";
  dialogRoot.style.top = "60px";
  dialogRoot.style.right = "20px";
  dialogRoot.style.zIndex = "1000";
  dialogRoot.style.background = "var(--panel)";
  dialogRoot.style.border = "1px solid var(--line2)";
  dialogRoot.style.borderRadius = "6px";
  dialogRoot.style.padding = "12px";
  dialogRoot.style.minWidth = "360px";

  const title = document.createElement("div");
  title.textContent = "new session";
  title.style.fontWeight = "bold";
  title.style.marginBottom = "8px";
  dialogRoot.appendChild(title);

  const fieldsContainer = document.createElement("div");
  fieldsContainer.id = "new-session-fields";
  fieldsContainer.style.display = "flex";
  fieldsContainer.style.flexDirection = "column";
  fieldsContainer.style.gap = "8px";
  dialogRoot.appendChild(fieldsContainer);

  const status = document.createElement("div");
  status.id = "new-session-status";
  status.className = "dim sm";
  status.style.marginTop = "8px";
  status.style.minHeight = "16px";
  dialogRoot.appendChild(status);

  const actions = document.createElement("div");
  actions.style.marginTop = "10px";
  actions.style.display = "flex";
  actions.style.gap = "8px";
  actions.style.justifyContent = "flex-end";
  const cancel = document.createElement("button");
  cancel.className = "btn";
  cancel.id = "new-session-cancel";
  cancel.textContent = "cancel";
  const create = document.createElement("button");
  create.className = "btn";
  create.id = "new-session-create";
  create.textContent = "create";
  actions.appendChild(cancel);
  actions.appendChild(create);
  dialogRoot.appendChild(actions);

  const fields: DialogField[] = [];
  const handle: NewSessionDialogHandle = {
    triggerEl: button,
    dialogEl: dialogRoot,
    registerField(field: DialogField) {
      const wrapper = document.createElement("div");
      wrapper.dataset.field = field.name;
      field.render(wrapper);
      fieldsContainer.appendChild(wrapper);
      fields.push(field);
    },
    open() {
      dialogRoot.style.display = "block";
      status.textContent = "";
      const firstInput = dialogRoot.querySelector("input,select,textarea") as HTMLElement | null;
      firstInput?.focus();
    },
    close() {
      dialogRoot.style.display = "none";
      for (const f of fields) f.reset?.();
    },
  };

  button.addEventListener("click", () => handle.open());
  cancel.addEventListener("click", () => handle.close());

  create.addEventListener("click", async () => {
    const body: Record<string, unknown> = { driver: "deterministic" };
    for (const f of fields) {
      const v = f.value();
      if (v === undefined || v === null || v === "") continue;
      body[f.name] = v;
    }
    status.textContent = "creating…";
    create.disabled = true;
    const result: FetchResult<CreateResponse> = await postJson<CreateResponse>("/api/session", body);
    create.disabled = false;
    if (!result.ok) {
      status.textContent = `create failed [${result.failure_class}] ${result.detail}`;
      return;
    }
    const res = result.data;
    if (res.workspace && res.workspace_shape) {
      emit("WORKSPACE_SELECTED", {
        session_id: res.session_id,
        workspace: res.workspace,
        workspace_shape: res.workspace_shape,
      });
    }
    window.dispatchEvent(new CustomEvent("substrate:session-changed", { detail: { session_id: res.session_id } }));
    status.textContent = `session ${res.session_id.slice(0, 12)}… created`;
    handle.close();
  });

  return handle;
}

// Workspace input as a DialogField. Wraps a validated text input; value()
// returns the trimmed path or empty string; renders its own inline error
// span. Reused by 036c's dialog registration below.
export interface WorkspacePickerField extends DialogField {
  inputEl: () => HTMLInputElement;
}

export function workspacePickerField(defaultPath = ""): WorkspacePickerField {
  let input!: HTMLInputElement;
  let error!: HTMLSpanElement;
  const field: WorkspacePickerField = {
    name: "workspace",
    render(into: HTMLElement) {
      const label = document.createElement("label");
      label.textContent = "workspace";
      label.style.fontSize = "12px";
      label.style.color = "var(--tx-dim)";
      label.style.display = "flex";
      label.style.flexDirection = "column";
      label.style.gap = "3px";
      input = document.createElement("input");
      input.type = "text";
      input.id = "workspace-picker-input";
      input.placeholder = "/absolute/path/to/workspace";
      input.value = defaultPath;
      input.style.padding = "4px 6px";
      input.style.background = "var(--panel-bg, #111)";
      input.style.border = "1px solid var(--line2)";
      input.style.borderRadius = "4px";
      input.style.color = "var(--tx)";
      label.appendChild(input);
      error = document.createElement("span");
      error.id = "workspace-picker-error";
      error.style.fontSize = "11px";
      error.style.color = "var(--red)";
      error.style.minHeight = "14px";
      label.appendChild(error);
      into.appendChild(label);

      const validate = () => {
        const v = input.value.trim();
        if (!v) { error.textContent = ""; return; }
        if (!_isAbsolutePath(v)) { error.textContent = "must be an absolute path"; return; }
        if (_hasForbiddenChars(v)) { error.textContent = "forbidden characters (\\0, \\r, \\n)"; return; }
        error.textContent = "";
      };
      input.addEventListener("input", validate);
    },
    value() {
      const v = input.value.trim();
      if (!v) return "";
      if (!_isAbsolutePath(v) || _hasForbiddenChars(v)) return "";
      return v;
    },
    reset() { input.value = defaultPath; error.textContent = ""; },
    inputEl() { return input; },
  };
  return field;
}

// Session-header badge that shows the current session's workspace_shape.
export interface WorkspaceShapeBadgeHandle {
  refresh: (preferSid?: string | null) => Promise<void>;
  el: HTMLElement;
}

export function mountWorkspaceShapeBadge(root: HTMLElement): WorkspaceShapeBadgeHandle {
  root.innerHTML = "";
  root.id = "workspace-shape-badge";
  root.className = "dim sm";
  root.style.marginLeft = "8px";
  root.textContent = "· shape —";

  const readCurrent = async (preferSid: string | null): Promise<SessionBucket | null> => {
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
      if (match) return match;
    }
    return pool[0] ?? null;
  };

  const handle: WorkspaceShapeBadgeHandle = {
    el: root,
    async refresh(preferSid: string | null = null) {
      const current = await readCurrent(preferSid);
      if (!current) { root.textContent = "· shape —"; return; }
      const shape = current.workspace_shape || "?";
      root.textContent = `· shape ${shape}`;
      root.title = `workspace: ${current.workspace || "?"}`;
    },
  };

  void handle.refresh();
  return handle;
}
