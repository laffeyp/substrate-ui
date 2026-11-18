# Roadmap — core stalls: Esc, the stuck turn, the quit (round 1)

*2026-11-18. Research: `RESEARCH-2026-11-18-core-stalls.md`; review: `process/reviews/REVIEW-2026-11-18-esc-interrupts-and-session-stalls.md`. The Architect, 2026-11-18: new development stops until these are tracked down. The cause, reproduced: an interrupt during a turn's bootstrap cancels the model producer before its first step; no start or end frame is written, the run's in-flight count never falls, and the turn holds the session lock forever.*

## Items

**C1 — A producer cancelled before it starts is recorded, and its run goes on (kernel).** The runtime writes `ProducerStarted` for every task it creates and `ProducerCancelled` for one cancelled before its first step, so `inflight` falls and the session topology's return-on-interrupt ends the turn. Check: an interrupt during the bootstrap of a resumed session ends the turn with `Returned` `interrupted`; a kernel test cancels a producer before it starts and the run reaches its terminal.

**C2 — An interrupt during the bootstrap says so (kernel, app).** `registry.interrupt` answers "pending" when the turn's run is live but its loop has not yet served the cancel, instead of `None`; the window says the Esc was taken. Check: the reproduction's interrupt returns pending, and the turn ends interrupted.

**C3 — The quit cannot wedge (app).** The shutdown sweep's wait for a session's lock is bounded; Electron's kill grace is longer than the server's own hard deadline, so the server always ends itself first. Check: a sweep over a session whose lock is held ends within its bound and logs the session it skipped; the 45 s and 60 s figures are reconciled in one place.

**C4 — Why a bootstrap takes minutes (research first).** Turn 45's first turn after a boot took 4 min 1 s to be accepted and 104 s to bootstrap; the next boot ran the same record's turn in 3.85 s. Measure where the time goes before any change.

**C5 — The pane names an interrupted session as it is (app).** A session the boot scan marks `interrupted` draws as resumable, not `failed`.

## Order

C1, C2, C3, then C4 and C5. C1 alone ends the stuck turns; C2 makes Esc honest; C3 removes the quit's SIGKILL.
