// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The store pattern each area of the window keeps its state in (sprint 201; plan
// PLAN-2026-11-04-shell-to-react-r4.md, "One store pattern, one store file per area").
//
// Each area's state lives in its own file under web/app/state/, made with createStore. React reads it
// with useSyncExternalStore(store.subscribe, store.getSnapshot); while dc-runtime still draws part of
// the window, DCLogic reads and writes the same store, so both sides see one value.

export type Listener = () => void;
export type Patch<T> = Partial<T> | ((state: T) => Partial<T>);

export interface Store<T extends object> {
  /** The current state; the same object until a set() changes a field. */
  getSnapshot(): T;
  /** Applies the patch; notifies listeners only when some field's value changed (Object.is). */
  set(patch: Patch<T>): void;
  /** Calls the listener after each change; returns the function that stops it. */
  subscribe(listener: Listener): () => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<Listener>();
  return {
    getSnapshot: () => state,
    set(patch) {
      const next = typeof patch === "function" ? patch(state) : patch;
      const changed = (Object.keys(next) as (keyof T)[]).some((k) => !Object.is(state[k], next[k]));
      if (!changed) return;
      state = { ...state, ...next };
      for (const listener of [...listeners]) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}
