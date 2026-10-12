# Sprint 138 — The structure lens shows every primitive, each defined on hover

```yaml
---
id: 138
status: closed
closed_at: 2026-10-11
phase: 1
pass_kind: functional
asked: 2026-10-11 (Architect)
---
```

## scope

The kernel's builder has eight primitives (`kernel/topology.py`): producer kinds with their event schemas, views, triggers, routes, instruments, initial bindings, termination, and the baseline; composition adds exports. After sprint 137 the structure lens gave its own section to producers, triggers, views and the end policy. Events, routes, instruments, the baseline, exports and the run's config had none, and the ON and STARTS columns named events and producers without saying so.

- **EVENTS first**, one row per kind, in its own left-hand column: the kind; what emits it (its producers, and **outside** when the app writes it into the record on the user's behalf); the triggers it fires.
  - "Outside" comes from the record, for any topology: a kind a trigger subscribes to that no producer emits, or a kind written to the record with no producer. In a session that covers `InterruptRequested`, `SessionEndRequested` and every `UserMessage` after the first.
- **PRODUCERS:** name · initial · deterministic · instrument · emits events.
- **TRIGGERS:** name · on event · starts producer · policy (PerEvent, Once).
- **ROUTES**, **VIEWS**, **ENDS**, and **RUN** (vocab version, baseline, exports). An empty section says "none".
- **Instrument** marks a producer that `b.instrument` registered: a trigger with the producer's own name that starts it on every event (`kernel/topology.py:317`).
- A closing line names what the record does not hold: a trigger's predicate and input builder, and a view's type, are code.
- **Hover definitions.** Each section heading carries a one- or two-sentence definition, taken from Substrate's docs (`docs/api.md`, `docs/tutorial.md`, `docs/adding-a-topology.md`, `kernel/topology.py`).
- **Column headers say what they hold:** EMITS EVENTS, ON EVENT, STARTS PRODUCER.

## checks

- `structure_lists_producers.ts` extends: every section is present; producers, triggers, views, routes and the end policy equal the record's `topology_graph`; the events listed equal the union of emitted and subscribed kinds; `InterruptRequested` and `SessionEndRequested` read as outside; each heading has a definition.
- `tsc` clean; unit specs; the Electron gates; a screenshot at full width.

## result

- **Built.**
  - `server.py` `_topology_graph` adds `outside`, `exports`, `baseline` and `config` to `api.topology_graph`. Read from a real session record: outside = `InterruptRequested`, `SessionEndRequested`, `UserMessage`. A fresh record shows `UserMessage` as outside only once a second message has been written: the first comes from `first_message`.
  - The lens has seven sections: EVENTS (21: kind · emitted by · fires triggers, with `runtime` for lifecycle kinds and `outside`), PRODUCERS (initial, instrument, deterministic tags), TRIGGERS (on event · starts producer · policy), ROUTES ("none" for the session), VIEWS, ENDS, RUN (vocab version, exports, baseline). A last line names what the record does not hold.
  - Each heading and tag carries a definition in its `title`, from the docs listed in scope; a dotted underline marks it.
  - **Responsive.** A container query on the lens: above 720px of panel, tables; below, each row stacks with labels. Tags never wrap; a lifecycle kind can break only after `substrate.`. Checked at the minimum window (504px; panel about 240px), 1000px and 1440px. At the minimum width the top bar had pushed the meta/panes button off the edge; the crumb and chips now shrink further, and it fits.
- **Gate.** `structure_lists_producers.ts` also checks: the seven sections in order, each with a definition; the events equal every kind emitted, subscribed to or written from outside; `InterruptRequested` and `SessionEndRequested` read as outside; routes and ends equal the record.
- **Found on the way.** `transcript_follow.ts` still pressed ⌃` (as key down, press, key up, which a search for `Control+\`` missed) and failed after the ⌘M change. It presses ⌘M now.
- **Checks.** Server tests 17/17; unit specs 34/34; `tsc` clean; Electron gates 12/12 on the source build.

## correction (same day)

- **What went wrong.** The Architect asked for the missing primitives, hover definitions and clearer column headers. The first pass also rebuilt the layout: events first, new column styles, and a stacked layout from 720px of panel down. On a 14-inch MacBook at full screen (1512 points, a 671px panel) the stacked layout showed where the tables belonged.
- **Now.** The sprint-137 tables are back as they were. Added to them, and nothing else: the header words (EMITS EVENTS, ON EVENT, STARTS PRODUCER); hover definitions on headings and tags; the POLICY column; the `instrument` and `deterministic` tags beside `initial`. New sections follow ENDS in the same table style: ROUTES, RUN, EVENTS.
- **Narrow windows.** Rows stack only below 530px of panel, measured as the narrowest the trigger table fits (it needs 524px). Tables, with no overflow and no spilled text, at windows of 1512, 1300 and 1240 points; stacked at 1200, 1100 and the minimum. Trigger and event names never shrink below their longest unbroken piece; `substrate.` kinds may break after the dot.
- **Gate.** The section order it expects is PRODUCERS, TRIGGERS, VIEWS, ENDS, ROUTES, RUN, EVENTS.
