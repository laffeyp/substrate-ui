/* Sprint 036e — isolate toggle DialogField.

   A checkbox in the new-session dialog (036c). When workspace_shape ==
   "worktree" the toggle sets its HTML `disabled` attribute (not CSS
   alone — Space/Enter stay inert and keyboard focus skips per REVIEW-
   2026-08-28 G5) and carries the `aria-label` "isolation implicit in
   worktree workspace." Otherwise the checkbox is user-actionable.

   value() returns `true` only when checked AND enabled; otherwise
   undefined (the create body drops the key, and the daemon's default
   is `isolate:false`). postSubmit() fires ISOLATE_TOGGLED only when
   the checkbox was user-set true AND the daemon accepted it (response
   `workspace_shape === "isolate"`). */

import { emit } from "../instrumentation/sdd";
import type { DialogField, DialogFieldResponse } from "./workspace_picker";

const DISABLED_LABEL = "isolation implicit in worktree workspace";

export function isolateField(): DialogField {
  let checkbox!: HTMLInputElement;
  let label!: HTMLLabelElement;
  let hint!: HTMLSpanElement;

  const setDisabled = (disabled: boolean) => {
    if (disabled) {
      checkbox.disabled = true;
      checkbox.checked = false;
      checkbox.setAttribute("aria-label", DISABLED_LABEL);
      hint.textContent = ` · ${DISABLED_LABEL}`;
      hint.style.display = "inline";
    } else {
      checkbox.disabled = false;
      checkbox.removeAttribute("aria-label");
      hint.style.display = "none";
    }
  };

  return {
    name: "isolate",
    render(into: HTMLElement) {
      label = document.createElement("label");
      label.style.fontSize = "12px";
      label.style.color = "var(--tx)";
      label.style.display = "flex";
      label.style.alignItems = "center";
      label.style.gap = "6px";
      checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = "isolate-field-checkbox";
      label.appendChild(checkbox);
      const text = document.createElement("span");
      text.textContent = "isolate (fresh per-session workspace)";
      label.appendChild(text);
      hint = document.createElement("span");
      hint.id = "isolate-field-hint";
      hint.className = "dim sm";
      hint.style.display = "none";
      label.appendChild(hint);
      into.appendChild(label);

      // Observe the sibling workspace-shape select via the bubbling
      // `workspace-shape-changed` CustomEvent it dispatches. The dialog
      // container is the natural bubble target since both fields render
      // into it.
      const listen = (root: EventTarget) => {
        root.addEventListener("workspace-shape-changed", ((ev: Event) => {
          const detail = (ev as CustomEvent).detail as { shape?: string } | undefined;
          setDisabled(detail?.shape === "worktree");
        }) as EventListener);
      };
      // The event bubbles up through the dialog. Attach on window as the
      // fallback catch-all; the dialog root is unknown to this field.
      listen(window);

      // Also poll the shape select once at render time so the initial
      // state is correct (default flat → enabled).
      const initialShape = (document.getElementById("workspace-shape-select") as HTMLSelectElement | null)?.value;
      setDisabled(initialShape === "worktree");
    },
    value() {
      if (checkbox.disabled) return undefined;
      return checkbox.checked ? true : undefined;
    },
    reset() {
      checkbox.checked = false;
    },
    postSubmit(response: DialogFieldResponse) {
      // Only emit when the daemon-side workspace_shape actually came back
      // as "isolate" — matches the SPEC-3 shared-wire pattern where the
      // tag reflects the manifest, not the user's intent.
      if (response.workspace_shape === "isolate") {
        emit("ISOLATE_TOGGLED", { session_id: response.session_id, isolate: true });
      }
    },
  };
}
