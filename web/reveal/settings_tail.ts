// The bar line's settings tail (UI sprint 172; design sheet 22b, D76, D79): each setting named,
// and each language shift since the last setting change written right after the setting its
// measure answers to, as its short name and ↑/↓ in that group's colour. More than two in one group
// collapse to a count. `/language clear` hides the shifts so far; `/language off` hides them all.

import { LANGUAGE_MEASURES, LanguageGroup } from "../vm/language_measures.gen";
import type { LanguageView } from "../vm/types";
import { GROUP_COLOR, LanguageStreamId, shiftNote } from "./language_lens";

export interface TailSeg {
  text: string;
  color: string;
  title: string;
  shift: boolean;
}

const NAME = "#62676f";
const VALUE = "#9aa0a8";
const MAX_LISTED = 2;

export function settingsTail(opts: {
  guidance: string;
  length: string;
  tone: string;
  language: LanguageView | null;
  off: boolean;
  clearedSeq: number;
}): TailSeg[] {
  const settings: [string, string][] = [
    [LanguageGroup.GUIDANCE, opts.guidance],
    [LanguageGroup.LENGTH, opts.length],
    [LanguageGroup.TONE, opts.tone],
  ];
  const view = opts.language;
  const since = Math.max(opts.clearedSeq, ...(view?.changes || []).map((c) => c.seq));
  const shifts = opts.off || !view ? [] : view.shifts.filter((sh) => sh.stream === LanguageStreamId.Model && sh.seq > since);
  const segs: TailSeg[] = [];
  for (const [group, value] of settings) {
    segs.push({ text: " · ", color: NAME, title: "", shift: false });
    segs.push({ text: `${group} `, color: NAME, title: "", shift: false });
    segs.push({ text: value, color: VALUE, title: "", shift: false });
    const mine = shifts.filter((sh) => LANGUAGE_MEASURES[sh.measure]?.group === group);
    const color = GROUP_COLOR[group];
    const position = group === LanguageGroup.GUIDANCE ? null : value;
    if (mine.length > MAX_LISTED) {
      const title = mine.map((sh) => shiftNote(sh.measure, sh.direction, sh.turn, position)).join(" ");
      segs.push({ text: " ", color: NAME, title: "", shift: false });
      segs.push({ text: `${mine.length} shifts`, color, title, shift: true });
      continue;
    }
    for (const sh of mine) {
      segs.push({ text: " ", color: NAME, title: "", shift: false });
      segs.push({
        text: `${LANGUAGE_MEASURES[sh.measure].short} ${sh.direction === "up" ? "↑" : "↓"}`,
        color, title: shiftNote(sh.measure, sh.direction, sh.turn, position), shift: true,
      });
    }
  }
  return segs;
}
