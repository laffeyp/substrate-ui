# Sprint 147 — New windows, and the menu bar against the macOS convention

```yaml
---
id: 147
status: closed
closed_at: 2026-10-11
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-11-before-distribution.md (step 17; OPEN-ITEMS 24)
asked: 2026-10-11 (Architect)
context_files:
  - electron/main.js
  - electron/menu.js
  - electron/preload.js
  - web/reveal.ts
  - harness/shakeout/electron_menu.ts
design_canon: Apple HIG "The menu bar" and "Keyboards" (fetched 2026-10-11, revision of 2025-06-09)
---
```

## scope

The app has one window. `main.js` keeps it in a `mainWindow` singleton that deep links, the backend-died notice, the close-window IPC and the folder picker all read. ⌘N is "New Session": it splits the focused window right and binds the new pane to `~/.substrate/sandbox` with no model, which skips the picker that every other new pane goes through (sprints 124–143).

The menu bar, checked item by item against the HIG:

| Menu | Now | HIG | Change |
|---|---|---|---|
| app | About, Services, Hide, Hide Others, Show All, Quit | About; **Settings… ⌘,**; Services; Hide…; Quit | add Settings… (⌘, stays the renderer's; see result) |
| File | New Session ⌘N, Open Record… ⌘O, Close Pane ⌘W, Close Window ⇧⌘W | New Item ⌘N "creates a new document, file, or window"; Close Tab replaces Close in a tab-based window; consider Close Window | ⌘N becomes **New Window**; the rest holds (a pane is this app's tab) |
| Edit | `editMenu` role | system Edit menu | holds |
| View | Toggle Reveal ⌃`, Reset Zoom, Zoom In, Zoom Out, Reload, Toggle Developer Tools | "Provide a View menu even if … only Enter/Exit Full Screen" | Toggle Reveal ⌃` (retired name, retired key) becomes **Meta** (⌘M stays the renderer's; see result); add **Enter Full Screen ⌃⌘F** |
| Window | Minimize (no key), Zoom, Bring All to Front | Minimize ⌘M, Zoom, Bring All to Front, open windows listed | holds; ⌘M stays on meta by the Architect's choice (a deviation the HIG names: "don't repurpose standard keyboard shortcuts") |
| Help | About substrate | the app's help; About belongs in the app menu only | drop the second About; the menu keeps macOS's search field |

After: File → New Window (⌘N) opens a second window on the same backend, cascaded from the focused one, starting at the picker like any new pane. Each window's renderer is independent (its own panes and controllers; the URL's `?session=` is per window). Menu commands, the close-window IPC and the folder picker act on the window that sent or holds focus; deep links go to the focused window; the backend-died notice reaches every window. Closing every window keeps the app running (macOS), and clicking the Dock icon opens one.

Deviations kept and reported, not changed: ⌘M (meta, not Minimize); ⌘E (fold tool output, not "use selection for find"); ⌘T reserved for the terminal pane (step 13; the HIG's ⌘T is the Fonts window, and this app has no Format menu); Reload and Toggle Developer Tools stay in View.

## signal contract

No controller tags change: windows and menus are shell, not session. The signals the gate reads are DOM and Electron's own (`BrowserWindow.getAllWindows()`, `Menu.getApplicationMenu()`).

## artifact contract

- `electron/main.js`: a window set in place of `mainWindow`; `createWindow()` returns its window and cascades from the focused one.
- `electron/menu.js`: the table above.
- `electron/preload.js`, `web/reveal.ts`: the `new-session` channel and handler go; `toggle-reveal` becomes `toggle-meta`, calling the same method the ⌘M keydown calls; `settings` added.
- `web/reveal_component.ts`: `_toggleMeta()` holds the ⌘M guard once for both paths.

## observation contract

A new Electron gate, `new_window.ts`, in `gates:electron`:

1. The menu's items and keys match the table (New Window ⌘N, Settings…, Meta, Enter Full Screen, no ⌃` item, no About under Help).
2. Bind window 1 and send a message. Click New Window: a second window opens at the picker; window 1's session and transcript are unchanged.
3. Bind window 2 and send: its session id differs from window 1's.
4. Close window 2 through Close Window: window 1 remains and still answers a message.
5. Close the last window: the app keeps running; `activate` opens a window.

`electron_menu.ts` loses its `menu-new-session` half (the command is gone) and clicks `menu-toggle-meta`.

Perceptual: a screenshot of the two windows and of the File and View menus is not possible from Playwright (native menus draw outside the page); the gate reads the menu model instead.

## checks

- The gate above red on the old code (no `menu-new-window` item), green after.
- `tsc`; `npm run signals`; the Electron gates.

## result

- **Built.** `main.js` tracks the focused window (`currentWindow()`: focused, else last focused, else any) in place of `mainWindow`; a new window cascades 22 points from the focused one; the close-window IPC and the folder picker act on the sender's window; the backend-died notice goes to every window; deep links go to the focused window once it has loaded. `menu.js` follows the table. The renderer's `new-session` handler (split right, bind `~/.substrate/sandbox` with no model) is gone; `toggle-meta` and the ⌘M keydown share `_toggleMeta()`; `settings` opens settings.
- **One owner per key.** A probe showed Playwright's synthetic presses never reach native menu accelerators (a synthetic ⌘N left one window), so no gate can see what a real ⌘M does when both the menu and the renderer register it; System Events cannot press real keys here (osascript has no Accessibility access, error -25211). Electron on macOS cannot show an accelerator without registering it (`registerAccelerator` is `@platform linux,win32` in `electron.d.ts` 44.4.5). So Meta and Settings… are listed without keys, and the renderer keeps ⌘M and ⌘,, the path the gates and daily use exercise. The menu owns ⌘N, ⌘O, ⌘W, ⇧⌘W and ⌃⌘F.
- **Gate** `new_window.ts` (in `gates:electron`): red on the committed `electron/` files ("substrate menu has no Settings…"), green after. `electron_menu.ts` clicks `menu-toggle-meta` and passes; shakeout axis C 3/3, no defects; `session_start_line` and `split_returns_to_panes` (both press ⌘M) pass.
- **Rubber Duck Pass.** No controller tag moved: the gate's observations are Electron's window list and menu model plus the panes' own session ids, and the two windows held two sessions (`s_c706…`, `s_0c2a…`) on one backend.
- **Kept and reported:** ⌘M is meta, not Minimize; ⌘E folds tool output, not "use selection for find"; ⌘T is held for the terminal pane; Reload and Toggle Developer Tools stay in View; the app menu is titled `substrate` while the About, Hide and Quit items read the bundle name.
