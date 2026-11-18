// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sprint 517 — the tool cards' view of the output presentation setting (web/vm/tool_view.ts).

import * as React from "react";
import { getToolView, subscribeToolView, type ToolView } from "../../vm/tool_view";

export function useToolView(): ToolView {
  return React.useSyncExternalStore(subscribeToolView, getToolView, getToolView);
}
