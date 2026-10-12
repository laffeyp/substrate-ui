// UI sprint 140 — the tool cards' view of the expand/collapse-all setting (toolOutputMode.ts).

import * as React from "react";
import { getToolOutputMode, subscribeToolOutputMode, type ToolOutputState } from "../../vm/tool_output_mode";

export function useToolOutputMode(): ToolOutputState {
  return React.useSyncExternalStore(subscribeToolOutputMode, getToolOutputMode, getToolOutputMode);
}
