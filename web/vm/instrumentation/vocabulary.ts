// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Vocabulary loader for the reveal shell. Reads the locked lock file
// at web/vm/signals/versions/current.json and builds a typed dictionary
// keyed by tag name. Separate from the classic shell's loader and its signals/versions/ tree, which
// are in _deprecated/classic-tree/ (sprint 341, plan row F6, F348).

import vocab from "../signals/versions/current.json";

export type TagSpec = {
  category: string;
  stratum: string;
  payload: string[];
  optional_payload: string[];
  field_types?: Record<string, string>;
};

export type Vocabulary = Record<string, TagSpec>;

const built: Vocabulary = {};
for (const t of vocab.tags as unknown as Array<TagSpec & { name: string }>) {
  built[t.name] = {
    category: t.category,
    stratum: t.stratum,
    payload: t.payload,
    optional_payload: t.optional_payload,
    field_types: t.field_types,
  };
}

export const VOCABULARY: Vocabulary = built;
export const VOCAB_VERSION: string = vocab.vocabulary_version;
