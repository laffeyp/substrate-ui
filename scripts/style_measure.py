#!/usr/bin/env python3
# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Layer A of the writing kernel.

Reads one or more markdown files, strips front-matter and code fences, and
reports every number the writing-kernel research doc names as Layer A.

Usage:
  python scripts/style_measure.py <file.md> [<file.md> ...]
"""
from __future__ import annotations

import re
import statistics
import sys
from collections import Counter
from pathlib import Path

WORD = re.compile(r"[A-Za-z]+(?:'[A-Za-z]+)?")
SENT = re.compile(r"(?<=[.!?])\s+(?=[A-Z\"'`(])")
VOWEL = re.compile(r"[aeiouy]+", re.I)
CODE_FENCE = re.compile(r"```.*?```", re.S)
FRONTMATTER = re.compile(r"\A---\n.*?\n---\n", re.S)
MD_LINK = re.compile(r"\[([^\]]+)\]\([^\)]+\)")
HEADER = re.compile(r"^#{1,6}\s", re.M)
TABLE_BAR = re.compile(r"\|")

LAT_SUFFIX = ("tion", "ate", "ive", "ous", "ity", "ence", "ance", "ize", "ise",
              "able", "ible", "ual", "ent", "ic", "fic")

FUNCTION = set("""a an the and but or nor so yet for of in on at by to from with as into onto upon
about above below over under before after between among through during against without within
is are was were be been being am do does did doing have has had having will would shall should
can could may might must ought need dare used that this these those which who whom whose what
when where why how if though although unless until while because since than then there here
not no yes which it its he she him her his hers they them their theirs we us our ours you your
yours i me my mine one all any each every some many much more most few less least both either neither
very just too also only even still again ever never now today here there""".split())

KOBAK = set("""delve underscore showcase boast surpass foster garner highlight
intricate meticulous pivotal crucial notable commendable innovative robust comprehensive
seamless realm tapestry landscape interplay journey vibrant rich nestled renowned
groundbreaking indelible""".split())

HEDGES = set("might could would may possibly perhaps probably likely seems appears suggests".split())
BOOSTERS = set("very certainly indeed clearly obviously undoubtedly must know proven provably".split())
PRON_1P = {"we", "us", "our", "ours", "i", "me", "my", "mine"}


def syllables(word: str) -> int:
    w = word.lower()
    if w.endswith("e") and not w.endswith("le") and len(w) > 2:
        w = w[:-1]
    return max(1, len(VOWEL.findall(w)))


def strip_markdown(text: str) -> str:
    text = FRONTMATTER.sub("", text)
    text = CODE_FENCE.sub("", text)
    text = MD_LINK.sub(r"\1", text)
    lines = [ln for ln in text.splitlines()
             if not HEADER.match(ln + " ")
             and not ln.strip().startswith(("|", ">", "-", "*", "`"))
             and not TABLE_BAR.search(ln)]
    return "\n".join(lines)


def measure(text: str) -> dict:
    sentences = [s for s in SENT.split(text.strip()) if WORD.search(s)]
    words = [w.lower() for w in WORD.findall(text)]
    if not words or not sentences:
        return {"empty": True}
    syls = [syllables(w) for w in words]
    sent_lengths = [len(WORD.findall(s)) for s in sentences]
    mean_wps = len(words) / len(sentences)
    mean_spw = sum(syls) / len(words)
    complex_words = sum(1 for n in syls if n >= 3)
    long_words = sum(1 for w in words if len(w) > 6)
    content = [w for w in words if w not in FUNCTION]
    latinate = sum(1 for w in words if any(w.endswith(s) and len(w) > 5 for s in LAT_SUFFIX))
    letters = sum(1 for c in text if c.isalpha())
    em_dashes = text.count("—")
    pron_1p = sum(1 for w in words if w in PRON_1P)
    hedges = sum(1 for w in words if w in HEDGES)
    boosters = sum(1 for w in words if w in BOOSTERS)
    kobak_hits = [w for w in words if w in KOBAK]
    mean_sl = statistics.mean(sent_lengths)
    sd_sl = statistics.pstdev(sent_lengths) if len(sent_lengths) > 1 else 0.0
    cv = sd_sl / mean_sl if mean_sl else 0.0
    return {
        "sentences": len(sentences),
        "tokens": len(words),
        "types": len(set(words)),
        "ttr": len(set(words)) / len(words),
        "mean_words_per_sentence": mean_wps,
        "sentence_length_cv_burstiness": cv,
        "mean_syllables_per_word": mean_spw,
        "complex_word_share": complex_words / len(words),
        "long_word_share": long_words / len(words),
        "lexical_density": len(content) / len(words),
        "latinate_share": latinate / len(words),
        "em_dashes": em_dashes,
        "em_dashes_per_100": em_dashes / len(words) * 100,
        "first_person_plural_density": pron_1p / len(words),
        "hedges": hedges,
        "boosters": boosters,
        "hedge_booster_ratio": f"{hedges}:{boosters}",
        "kobak_hits": kobak_hits,
        "kobak_hits_per_150": len(kobak_hits) * 150 / len(words),
        "flesch_reading_ease": 206.835 - 1.015 * mean_wps - 84.6 * mean_spw,
        "flesch_kincaid_grade": 0.39 * mean_wps + 11.8 * mean_spw - 15.59,
        "gunning_fog": 0.4 * (mean_wps + complex_words / len(words) * 100),
        "lix": mean_wps + long_words / len(words) * 100,
        "ari": 4.71 * letters / len(words) + 0.5 * mean_wps - 21.43,
    }


# Target bands per the research doc §1.
TARGETS = {
    "mean_words_per_sentence": (15, 22, "words/sentence"),
    "sentence_length_cv_burstiness": (0.30, 1.0, "burstiness (CV)"),
    "mean_syllables_per_word": (1.3, 1.6, "syllables/word"),
    "lexical_density": (0.40, 0.55, "lexical density"),
    "latinate_share": (0.0, 0.12, "Latinate share"),
    "ttr": (0.55, 0.80, "type-token ratio"),
    "em_dashes_per_100": (0.0, 0.3, "em-dashes per 100 tokens"),
    "first_person_plural_density": (0.0, 0.05, "1P-plural density"),
    "kobak_hits_per_150": (0.0, 2.0, "Kobak hits per 150 tokens"),
    "flesch_reading_ease": (50, 75, "Flesch Reading Ease"),
    "complex_word_share": (0.0, 0.20, "complex-word share"),
}


def report(path: Path, m: dict) -> None:
    print(f"\n=== {path} ===")
    if m.get("empty"):
        print("  (no prose body found)")
        return
    print(f"  sentences {m['sentences']}  tokens {m['tokens']}  types {m['types']}  "
          f"TTR {m['ttr']:.3f}")
    print()
    print("  measurement                      value    target band    status")
    print("  " + "-" * 62)
    for key, (lo, hi, label) in TARGETS.items():
        v = m[key]
        pass_ = lo <= v <= hi
        print(f"  {label:30s}  {v:7.3f}  [{lo:5.2f}, {hi:5.2f}]  {'OK' if pass_ else 'OUT'}")
    print(f"  hedges / boosters: {m['hedge_booster_ratio']}")
    if m["kobak_hits"]:
        print(f"  Kobak hits: {m['kobak_hits']}")


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: style_measure.py <file.md> [<file.md> ...]", file=sys.stderr)
        return 2
    for arg in sys.argv[1:]:
        path = Path(arg)
        text = strip_markdown(path.read_text(encoding="utf-8"))
        report(path, measure(text))
    return 0


if __name__ == "__main__":
    sys.exit(main())
