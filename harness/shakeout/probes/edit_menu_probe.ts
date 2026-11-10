// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Probe (sprint 426): the Edit menu Electron's `editMenu` role builds, item by item.
import { _electron as electron } from "playwright";
import { launchArgs, waitForApp } from "../lib/electron";
async function main(): Promise<void> {
  const launch = launchArgs();
  const app = await electron.launch({ ...launch.options, timeout: 60_000 });
  try {
    await waitForApp(await app.firstWindow({ timeout: 30_000 }));
    // No named functions inside: tsx wraps them in a __name helper the main process lacks.
    console.log(await app.evaluate(({ Menu }) => {
      const out: string[] = [];
      const stack: [Electron.MenuItem, number][] = Menu.getApplicationMenu()!.items.filter((i) => i.label === "Edit")[0].submenu!.items.map((i) => [i, 0] as [Electron.MenuItem, number]).reverse();
      while (stack.length) {
        const [i, d] = stack.pop()!;
        out.push(`${"  ".repeat(d)}${i.type} ${i.role ?? ""} "${i.label}" ${String(i.accelerator ?? "")}`);
        if (i.submenu) stack.push(...i.submenu.items.map((x) => [x, d + 1] as [Electron.MenuItem, number]).reverse());
      }
      return out.join("\n");
    }));
  } finally { await app.close(); launch.cleanup({}); }
}
main();
