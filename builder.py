"""Topology SPEC -> a real TopologyBuilder topology (the Studio's "build & launch" seam).

The visual Studio authors a topology as JSON; this translates it into an ACTUAL topology(b)
function the runtime runs — no faking. It dynamically mints a frozen msgspec Struct per authored
event kind, a deterministic stub Producer per kind (emits its event(s) so the WIRING runs), and
wires Views / Predicates / Triggers / Routes / TerminationPolicy (incl. any_of/all_of composition)
through the real `substrate.api` builder. (Real model Producers behind a Responder are a later
step; the deterministic stub proves the authored wiring runs and records, exactly like CI mode.)

Spec shape (the visual canvas emits this):
  {
    "name": "my_topology",
    "producers": [{"kind": "reviewer", "emits": ["Critique"], "initial": true, "deterministic": true}],
    "views":     [{"name": "crits", "kind": "KindCount", "of": "Critique"}],
    "triggers":  [{"id": "adj", "on": "Critique", "predicate": {"view": "crits", "op": ">=", "n": 2},
                   "starts": "judge", "policy": "Once"}],
    "routes":    [{"id": "stage", "of": "Critique", "slot": "crits"}],
    "termination": {"kind": "any_of", "members": [{"kind": "all_completed"},
                                                  {"kind": "quiescence_with_watchdog", "seconds": 1}]}
  }
"""

from __future__ import annotations

from typing import Any

import msgspec
from substrate import api
from substrate.reference import (  # the runtime's CI-mode Responder (pure, seeded) + the offload helper
    DeterministicResponder,
    call_responder,
)

_OPS = {
    ">=": lambda a, b: a >= b, ">": lambda a, b: a > b, "==": lambda a, b: a == b,
    "<=": lambda a, b: a <= b, "<": lambda a, b: a < b,
}
_VIEWS = {"KindCount": api.KindCount, "KindBuffer": api.KindBuffer, "PerKindLatest": api.PerKindLatest}
# PerKey is deliberately NOT offered: it requires a key-extraction fn the authored-spec shape has no
# field for, so policy_cls() would crash the build with a raw TypeError (ui-backend-4).
_POLICIES = {"Once": api.Once, "PerEvent": api.PerEvent, "WhileTrue": api.WhileTrue}


class SpecError(ValueError):
    """The authored spec is malformed — surfaced cleanly, never an opaque crash."""


def _predicate(spec: dict[str, Any] | None, view_kinds: dict[str, str]) -> Any:
    if not spec:
        return lambda ctx: True
    view, op, n = spec["view"], spec["op"], int(spec["n"])
    if op not in _OPS:
        raise SpecError(f"unknown predicate op {op!r}")
    if view_kinds.get(view) == "PerKindLatest":
        # PerKindLatest.value() is the latest payload, not a count -- comparing it with >=/< silently
        # measures its FIELD-count, a meaningless gate (ui-backend-3). Predicates count.
        raise SpecError(
            f"predicate on View {view!r} (PerKindLatest) is not a countable gate; "
            "use a KindCount or KindBuffer View for a numeric predicate"
        )
    fn = _OPS[op]

    def pred(ctx: Any) -> bool:
        v = ctx.views[view].value()
        v = v if isinstance(v, int) else len(v)  # KindCount -> int; KindBuffer -> list
        return bool(fn(v, n))

    return pred


def _termination(spec: dict[str, Any]) -> Any:
    k = spec.get("kind")
    if k == "threshold_count":
        return api.threshold_count(spec["of"], int(spec["n"]))
    if k == "quiescence_with_watchdog":
        return api.quiescence_with_watchdog(seconds=float(spec.get("seconds", 5)))
    if k == "all_completed":
        return api.all_completed()
    if k == "cancel_all_others":
        return api.cancel_all_others(when=lambda ctx: True)
    if k in ("any_of", "all_of"):
        members = [_termination(m) for m in spec.get("members", [])]
        if not members:
            raise SpecError(f"{k} needs at least one member")
        return (api.any_of if k == "any_of" else api.all_of)(*members)
    raise SpecError(f"unknown termination {k!r}")


def build_from_spec(spec: dict[str, Any], responder: Any = None) -> Any:
    """Translate an authored spec into a real topology(b) function (raises SpecError if malformed).

    A Producer may be DETERMINISTIC-STUB (default) or MODEL-BACKED (`model: true`). A stub emits
    each declared kind once with `note=kind`; a model Producer calls the runtime's real
    `Responder.respond(prompt)` and emits its kind carrying the response. `responder` defaults to the
    runtime's `DeterministicResponder` (CI mode — pure, seeded, no network; same prompt+seed → same
    answer, so model topologies replay byte-identically). Pass an `OllamaResponder` for a real LLM.

    HONESTY NOTE (the stub's count-ceiling): a STUB Producer emits each kind EXACTLY ONCE per
    instance, so a `KindCount(X) >= 3` with a single X-emitter is UNREACHABLE and the run finalises
    green via quiescence having fired nothing past the initials — honest but silent, so /api/build
    surfaces `unfired_triggers`. A MODEL Producer with a DeterministicResponder still emits once
    (the ceiling applies); the difference is the payload carries real Responder output, not `kind`.
    """
    if not spec.get("producers"):
        raise SpecError("a topology needs at least one Producer")
    if responder is None:
        responder = DeterministicResponder(seed=int(spec.get("seed", 0)))
    responder_is_deterministic = isinstance(responder, DeterministicResponder)
    # one frozen Struct per authored event kind (a generic `note: str` payload — stub kind or model output).
    structs: dict[str, type] = {}
    for p in spec["producers"]:
        for ev in p.get("emits", []):
            if ev not in structs:
                structs[ev] = msgspec.defstruct(ev, [("note", str, "")], frozen=True)

    def make_producer(kind: str, emit_structs: list[type], model: bool, prompt: str) -> Any:
        if model:
            async def producer(_inp: Any) -> Any:
                # route through call_responder so a real (Ollama) model call is offloaded/cancellable
                # and doesn't block the event loop — same discipline the runtime topologies use.
                text = await call_responder(responder, prompt)
                for s in emit_structs:
                    yield s(note=text)
        else:
            async def producer(_inp: Any) -> Any:
                for s in emit_structs:
                    yield s(note=kind)  # deterministic stub: emit each declared kind once
        return producer

    def topo(b: Any) -> None:
        # a malformed authored spec (a missing or mistyped field) must surface as the promised
        # SpecError, not a raw KeyError / TypeError leaking from dict access (ui-backend-7). The
        # explicit SpecError raises below are not KeyError/TypeError, so they propagate unchanged.
        try:
            for p in spec["producers"]:
                emits = p.get("emits", [])
                if not emits:
                    raise SpecError(f"Producer {p.get('kind')!r} emits nothing")
                kind = p["kind"]
                schemas = [structs[e] for e in emits]
                model = bool(p.get("model"))
                prompt = str(p.get("prompt") or f"You are {kind}.")
                # a model Producer is replay-deterministic iff its Responder is (Ollama is NOT)
                det = bool(p.get("deterministic", True)) and (responder_is_deterministic if model else True)
                b.producer_kind(
                    kind, schemas=schemas, schema_version=1,
                    start=make_producer(kind, schemas, model, prompt), deterministic=det,
                )
                if p.get("initial"):
                    b.initial(kind)
            for v in spec.get("views", []):
                view_cls = _VIEWS.get(v["kind"])
                if view_cls is None:
                    raise SpecError(f"unknown View {v['kind']!r}")
                b.view(v["name"], view_cls(v["of"]))
            view_kinds = {v["name"]: v.get("kind") for v in spec.get("views", [])}
            for t in spec.get("triggers", []):
                policy_name = t.get("policy", "PerEvent")
                if policy_name not in _POLICIES:  # don't silently fall back to PerEvent (ui-backend-4)
                    raise SpecError(f"unsupported trigger policy {policy_name!r} (choose: {', '.join(_POLICIES)})")
                b.trigger(
                    t["id"],
                    subscription=api.Subscription(kinds=frozenset({t["on"]})),
                    predicate=_predicate(t.get("predicate"), view_kinds),
                    input_builder=lambda ctx: ctx.event.payload,
                    starts=t["starts"],
                    policy=_POLICIES[policy_name](),
                )
            # NOTE (ui-backend-6): authored Routes are OBSERVATIONAL-only today. A Route stages data
            # into ctx.staged[slot], but every authored Trigger reads ctx.event.payload (above), never
            # ctx.staged -- so routed data is recorded + visible in the graph but no Producer input
            # consumes it. Consuming it needs a trigger<->slot link in the spec shape (a Studio
            # feature, not a builder fix); until then the Route is a visible-but-inert edge.
            for r in spec.get("routes", []):
                b.route(
                    r["id"],
                    subscription=api.Subscription(kinds=frozenset({r["of"]})),
                    slot=r["slot"],
                    transform=lambda event: event.payload,
                )
            b.termination(_termination(spec.get("termination") or {"kind": "quiescence_with_watchdog"}))
            if spec.get("name"):
                b.baseline(authored=spec["name"])
        except (KeyError, TypeError) as exc:
            raise SpecError(f"malformed spec (missing or mistyped field): {exc}") from exc

    return topo
