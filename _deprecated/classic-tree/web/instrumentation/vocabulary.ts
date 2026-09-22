// Vocabulary loader for substrate-ui. Imports the locked v0.2 vocabulary + the mirrored substrate
// vocabulary at module load; builds a typed dictionary + a foreign-key closed set for enforcement.

// One central version pointer: signals/versions/current.json is a symlink to the locked version.
// A v0.4 bump retargets the symlink and drops a new versioned file; no code path changes.
import vocab from "../../signals/versions/current.json";
import substrateVocab from "../../signals/mirror/substrate-0.3.json";

export type TagSpec = {
  category: string;
  stratum: string;
  payload: string[];
  optional_payload: string[];
  payload_types?: Record<string, string>;
};

export type Vocabulary = Record<string, TagSpec>;

const built: Vocabulary = {};
for (const t of vocab.tags as Array<TagSpec & { name: string }>) {
  built[t.name] = {
    category: t.category,
    stratum: t.stratum,
    payload: t.payload,
    optional_payload: t.optional_payload,
    payload_types: t.payload_types,
  };
}

export const VOCABULARY: Vocabulary = built;
export const VOCAB_VERSION: string = vocab.vocabulary_version;

// Closed sets for foreign-key enforcement (Sprint 030). Substrate's tags[].name is the substrate_kind
// domain; producer kinds are named by the substrate ontology's entities where role is "producer_kind".
export const SUBSTRATE_KINDS: Set<string> = new Set(
  (substrateVocab.tags as Array<{ name: string }>).map((t) => t.name),
);
// Producer kinds live under substrate.ontology.entities[].name where role === "producer_kind"; if
// substrate's ontology doesn't expose that shape yet, we fall back to accepting any non-empty string
// for kind. Union so future substrate side additions don't force a substrate-ui bump on every add.
const _entities = (substrateVocab as { ontology?: { entities?: Array<{ name: string; role?: string }> } }).ontology?.entities || [];
export const SUBSTRATE_PRODUCER_KINDS: Set<string> = new Set(
  _entities.filter((e) => e.role === "producer_kind").map((e) => e.name),
);
