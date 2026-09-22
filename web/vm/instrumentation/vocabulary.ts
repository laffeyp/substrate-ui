// Vocabulary loader for the reveal shell. Reads the locked lock file
// at web/vm/signals/versions/current.json and builds a typed dictionary
// keyed by tag name. Wholly separate from the classic shell's
// web/instrumentation/vocabulary.ts and its signals/versions/ tree.

import vocab from "../signals/versions/current.json";

export type TagSpec = {
  category: string;
  stratum: string;
  payload: string[];
  optional_payload: string[];
};

export type Vocabulary = Record<string, TagSpec>;

const built: Vocabulary = {};
for (const t of vocab.tags as Array<TagSpec & { name: string }>) {
  built[t.name] = {
    category: t.category,
    stratum: t.stratum,
    payload: t.payload,
    optional_payload: t.optional_payload,
  };
}

export const VOCABULARY: Vocabulary = built;
export const VOCAB_VERSION: string = vocab.vocabulary_version;
