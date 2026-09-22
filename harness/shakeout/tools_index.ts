// One Axis B flow per tool in the tool_loop suite. Every prompt is a
// one-liner that names the tool explicitly. Substrate feeds the
// model every tool's schema at boot, so the model can just pick.

import { makeToolFlow } from "./lib/tool_flow";
import type { Flow } from "./lib/flow";

export const TOOL_FLOWS: Flow[] = [
  makeToolFlow({ tool: "add", prompt: "Please demonstrate the `add` tool by calling it once with two integers and report what came back." }),
  makeToolFlow({ tool: "mul", prompt: "Please demonstrate the `mul` tool by calling it once with two integers and report what came back." }),
  makeToolFlow({ tool: "read_file", prompt: "Please demonstrate the `read_file` tool by calling it once on any file you can reach and report a summary of what came back." }),
  makeToolFlow({ tool: "list_dir", prompt: "Please demonstrate the `list_dir` tool by calling it once on any directory you can reach and report a summary of what came back." }),
  makeToolFlow({ tool: "glob", prompt: "Please demonstrate the `glob` tool by calling it once with a pattern and report a summary of what came back." }),
  makeToolFlow({ tool: "grep", prompt: "Please demonstrate the `grep` tool by calling it once for a plausible pattern in a reachable directory and report a summary of what came back." }),
  makeToolFlow({ tool: "web_fetch", prompt: "Please demonstrate the `web_fetch` tool by calling it once on any public URL and report a summary of what came back." }),
  makeToolFlow({ tool: "edit_file", prompt: "Please demonstrate the `edit_file` tool by creating and editing a file under /tmp/shakeout/, then report what changed." }),
  makeToolFlow({ tool: "write_file", prompt: "Please demonstrate the `write_file` tool by writing a short file under /tmp/shakeout/ and report what you wrote." }),
  makeToolFlow({ tool: "bash", prompt: "Please demonstrate the `bash` tool by running a short read-only command (like `pwd` or `date`) and report what came back." }),
  makeToolFlow({ tool: "inspect_record", prompt: "Please demonstrate the `inspect_record` tool by inspecting any substrate record you can find and report a summary of what came back." }),
  makeToolFlow({ tool: "list_records", prompt: "Please demonstrate the `list_records` tool by calling it once and report a summary of what came back." }),
  makeToolFlow({ tool: "list_sessions", prompt: "Please demonstrate the `list_sessions` tool by calling it once and report a summary of what came back." }),
  makeToolFlow({ tool: "list_topologies", prompt: "Please demonstrate the `list_topologies` tool by calling it once and report a summary of what came back." }),
  makeToolFlow({ tool: "list_applications", prompt: "Please demonstrate the `list_applications` tool by calling it once and report a summary of what came back." }),
  makeToolFlow({ tool: "run_topology", prompt: "Please demonstrate the `run_topology` tool by calling it once to launch any short topology and report what came back.", turnTimeoutMs: 600_000 }),
  makeToolFlow({ tool: "run_topology_poll", prompt: "Please demonstrate the `run_topology_poll` tool by calling it once to poll any active run and report what came back.", turnTimeoutMs: 600_000 }),
  makeToolFlow({ tool: "delegate", prompt: "You must not answer this yourself. Call the `delegate` tool once with a small sub-task for a child agent (for example: ask the child to compute 17 * 23 using its own tools). Wait for the child's ToolResult, then report the child agent's answer verbatim.", turnTimeoutMs: 600_000 }),
];
