/* Sprint 040b — transport surface (cursor + play/pause + speed +
   toStart/toEnd), extracted from web/app.ts.

   Wires the four control elements in the cursor bar:
   #seq (range slider) · #toStart · #play · #toEnd · #speedsel.
   Mutates a shared `state` reference (STATE from app.ts) and calls
   `deps.render()` after every cursor move. Emits CURSOR_MOVED,
   PLAY_STARTED, PLAY_STOPPED, SPEED_CHANGED at the same call sites
   the prior inline code did.

   The `_cursorSource` tag ("drag" | "button" | "play_frame") stays
   in this module — no caller needs it. */

import { emit } from "../instrumentation/sdd";

export interface TransportState {
  cursor: number;
  playing: boolean;
  speed: number;
  name: string | null;
}

export interface TransportDeps {
  state: TransportState;
  render: () => void;
}

export interface TransportHandle {
  el: HTMLElement | null;  // no root; DOM lookups done at mount
  stopPlay: () => void;    // callers (selectAssay, selectRecord) invoke on record-switch
}

export function mountTransport(deps: TransportDeps): TransportHandle {
  const { state, render } = deps;
  const seq = document.getElementById("seq") as HTMLInputElement | null;
  const seqnow = document.getElementById("seqnow");
  const play = document.getElementById("play");
  const toStart = document.getElementById("toStart");
  const toEnd = document.getElementById("toEnd");
  const speedsel = document.getElementById("speedsel") as HTMLSelectElement | null;

  if (!seq || !seqnow || !play || !toStart || !toEnd || !speedsel) {
    throw new Error("mountTransport: cursor-bar DOM elements missing");
  }

  let cursorSource: "drag" | "button" | "play_frame" = "drag";
  let raf: number | null = null;
  let playLast = 0;
  let playAccum = 0;
  let stopReason: "user_pause" | "end_reached" | "scrub_interrupt" = "user_pause";

  const updatePlayBtn = (): void => {
    play.textContent = state.playing ? "⏸" : "▶";
    play.classList.toggle("playing", state.playing);
  };

  const setSeq = (v: number): void => {
    cursorSource = "play_frame";
    seq.value = String(v);
    seq.dispatchEvent(new Event("input"));
  };

  const stopPlay = (): void => {
    if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
    if (state.playing) {
      const at_seq = state.cursor;
      state.playing = false;
      updatePlayBtn();
      emit("PLAY_STOPPED", { at_seq, reason: stopReason, subject_record: state.name });
      stopReason = "user_pause";
    }
  };

  const frame = (ts: number): void => {
    if (!state.playing) return;
    const max = parseFloat(seq.max);
    if (!playLast) playLast = ts;
    playAccum += ((ts - playLast) / 1000) * state.speed;
    playLast = ts;
    if (playAccum >= 1) {
      const step = Math.floor(playAccum);
      playAccum -= step;
      const next = Math.min(max, state.cursor + step);
      setSeq(next);
      if (next >= max) { stopReason = "end_reached"; stopPlay(); return; }
    }
    raf = requestAnimationFrame(frame);
  };

  const startPlay = (): void => {
    if (state.cursor >= parseFloat(seq.max)) setSeq(0);
    const from_seq = state.cursor;
    state.playing = true;
    updatePlayBtn();
    playLast = 0;
    playAccum = 0;
    emit("PLAY_STARTED", { from_seq, speed: state.speed, subject_record: state.name });
    raf = requestAnimationFrame(frame);
  };

  seq.oninput = (e) => {
    const prior_seq = state.cursor;
    state.cursor = parseFloat((e.target as HTMLInputElement).value);
    if (state.cursor !== prior_seq) {
      emit("CURSOR_MOVED", { seq: state.cursor, prior_seq, subject_record: state.name, source: cursorSource });
    }
    cursorSource = "drag";
    seqnow.textContent = String(state.cursor);
    render();
  };
  toStart.onclick = () => {
    cursorSource = "button";
    seq.value = "0";
    seq.dispatchEvent(new Event("input"));
  };
  toEnd.onclick = () => {
    cursorSource = "button";
    seq.value = seq.max;
    seq.dispatchEvent(new Event("input"));
  };
  play.onclick = () => (state.playing ? stopPlay() : startPlay());
  speedsel.onchange = () => {
    const prior_speed = state.speed;
    state.speed = parseFloat(speedsel.value);
    if (state.speed !== prior_speed) emit("SPEED_CHANGED", { speed: state.speed, prior_speed });
  };
  seq.addEventListener("pointerdown", () => { stopReason = "scrub_interrupt"; stopPlay(); });

  return { el: null, stopPlay };
}
