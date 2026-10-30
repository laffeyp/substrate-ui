# Research — Substrate mobile: a talking-first companion, a coding-second option

*Opened 2026-09-28. Companion to `RESEARCH-2026-09-27-moves-a-typed-vocabulary-of-conversational-redirect.md` and `RESEARCH-2026-09-27-mastering-layer-and-the-metacognitive-baseline.md`. Scope: the argument that substrate on the phone is a different product from substrate on the desktop, with a different center of gravity, and the sketch of what that product is.*

---

## 1. The thesis

Substrate on the desktop is a coding cockpit. It exists to run long, focused, records-first sessions with a driver capable of touching the filesystem, spawning tools, and holding a workspace open for hours. That is a workstation product.

Substrate on the phone is a different product. The device is small, the user's posture is short-attention, and the input is a thumb or a voice. The center of gravity moves off code and onto talk. Substrate on the phone is a **chat companion built on top of a substrate session**, running against a local model or a signed-in cloud driver, carrying the mastering layer and the moves vocabulary as its distinguishing surface.

Two important things stay across the split. First, the record. Both products emit envelopes into the same shape; a session opened on the phone can be picked up on the desktop and vice versa. Second, the mastering layer. The rhetorical, epistemic, and register standards that make the desktop product what it is travel with the mobile product, so the chat companion on the phone does not degrade into a chatbot the moment it leaves the workstation.

The coding half of substrate does not disappear on mobile — a user can still open a substrate session with a real driver and drive a tool loop from a phone. That is not the focus. It is a secondary path.

---

## 2. Why the split matters

The desktop and mobile use cases diverge along three axes at once:

**Screen and input.** A phone shows ~40 characters of comfortable line width; a laptop shows ~120. Editing a five-file refactor on a phone is a punishment. Typing a paragraph on a phone is friction. Voice input works well on a phone and is theatrical on a laptop.

**Attention shape.** Laptop time is mostly focused, extended, and single-purpose. Phone time is short, interruptible, and multi-purpose. A one-hour coding run is a laptop event. A three-minute talk to sharpen a draft is a phone event. Products that ship one voice for both surfaces fight the physics of each.

**Compute and thermals.** Modern phones (A18 Pro, Snapdragon 8 Gen 4, Google Tensor G4) run 3B parameter models under llama.cpp/MLX with real latency and reasonable battery cost. They cannot run a 70B model or hold a 60-minute agentic tool loop without thermal throttling or bricking the battery. That constraint is a product boundary, not a bug to engineer around.

The right move is to accept the three axes and design two products that share a substrate underneath. Same signals vocabulary, same records, same mastering layer, different input surface and different local emphasis.

---

## 3. Technical stack — what a phone can actually run today

The on-device model story is real, recent, and shipping.

**Apple Foundation Models framework (announced WWDC 2025).** Apple ships a ~3B on-device LLM as a system service on iOS 26+ / macOS 26+, addressable through a Swift API. Quality is roughly GPT-3.5 for short interactions; latency is under a second for the first token on A17 Pro and later. Free at the point of use, no key required, no network needed. This is the biggest change in the on-device space in three years.

**Google AICore + Gemini Nano.** Android's equivalent. Google Pixel 8 Pro and later carry Gemini Nano as a system-level model addressable via AICore. Quality and shape comparable to Apple's offering.

**llama.cpp / MLX with GGUF-quantized models.** The independent path. Q4/Q5 quantized 3B–8B parameter models run on iOS today via existing apps (Private LLM, LLM Farm, PocketPal, Enchanted). Model choice open — Llama 3.1 8B, Phi-3.5, Qwen 2.5, Mistral 7B all run. Substrate can ship a bundled runtime the same way the desktop version ships python-build-standalone: pin a version, package the .gguf inside the app.

**Cloud drivers via API keys.** A phone can hit Anthropic, OpenAI, Cursor, or an Ollama Turbo endpoint over HTTPS the same way the desktop can. The mobile substrate carries key management and lets the user pick a driver the same way the desktop picker does — the moves and mastering layers apply identically regardless of which driver answers.

The technical stack for the mobile product, in order of dogfood cost:

1. Wrap Apple Foundation Models on iOS 26+ as a first-class substrate driver. Zero external dependency, ships free.
2. Add key-based cloud drivers so users with an Anthropic / OpenAI key get the same driver quality they get on desktop.
3. Ship a bundled MLX or llama.cpp runtime for larger local models when the user wants them and has the hardware.

Android is a symmetric second target. Same stack, different framework names.

---

## 4. The hero demo — the thing that makes the mobile product real

Every mobile-LLM product today looks the same: a chat window, a text input, a keyboard microphone, a lackluster reply. Substrate on the phone is not competing with that shape by being nicer at it. The differentiator is the mastering layer and the moves vocabulary: a chat that does not talk like the average of the internet, and a directive surface that lets a user redirect the conversation without typing a paragraph.

The hero demo has to show one thing that no chatbot on the phone today can do. Candidates:

**A. Local-model rhetoric.** A 3B on-device model, boosted by a heavy mastering pass, produces terse and rigorous responses well above the parameter class it belongs to. The user opens the app on a plane, no network, and gets a chat that reads like Orwell and White, not like a jr copywriter. That is a real product no one else offers, because no other on-device-LLM shipping product is applying a rhetorical mastering layer.

**B. Moves without typing.** The moves vocabulary as a swipeable wheel or a native picker. The user reads the model's reply, swipes right for `critique/fallacy/motte-and-bailey`, and the model responds to the specific critique. On a phone this is one thumb-swipe versus one paragraph typed with a thumb. The interaction is dramatically cheaper than freeform chat, and it is unique to substrate.

**C. Session attach.** A QR code on the desktop, scanned by the phone, joins the same substrate session. The user leaves the coding desk, goes for a walk, and continues the run by voice on the phone. Same record, same driver, same context. This is the desktop-to-phone bridge Signal Desktop and WhatsApp Web already do for messaging; substrate applies it to LLM sessions.

The strongest single demo is likely (A) plus (B) combined: a phone-only session, running a local 3B model, driven partly by voice and partly by move-swipes, that produces rigorous output. A user recording this and posting it does the marketing.

---

## 5. Session bridging — desktop-to-phone and vice versa

Substrate sessions have a record and a live-stream endpoint. The bridge problem is: how does a phone attach to a session running on a desktop across a network that isn't necessarily the same LAN?

Three shipping precedents to steal from:

**Signal Desktop / WhatsApp Web / Discord's device linking.** QR code displayed on one device carries an ephemeral public key + rendezvous coordinates. Second device scans, does a key exchange, joins the shared session. Transport for the ongoing sync is the vendor's own server. Zero user configuration; the QR is the whole ceremony.

**Tailscale.** A private mesh across every device the user owns. Any device on the mesh reaches any other by hostname. No public exposure, no port forwarding. Requires an account on the Tailscale (or self-hosted Headscale) coordination server; requires the daemon installed on both devices.

**ngrok / Cloudflare Tunnel.** Expose one device's localhost through a public URL. Simple, fast, less secure.

The right choice depends on the boundary drawn:

- If substrate ships a lightweight mesh identity (like Tailnet Membership implicit in a substrate account), the bridge is a substrate-scoped Tailscale. QR carries an ephemeral join token; the phone joins the mesh; the phone talks to the desktop by substrate-hostname over the mesh.
- If substrate stays local-first with no substrate-scoped mesh, the bridge is a WireGuard tunnel the user's own Tailscale (or Headscale) provides, and substrate reads the phone's Tailscale peer address to find the desktop.

Both are viable. The Signal-style ephemeral-QR-to-vendor-server path is the third option and is the simplest UX; it introduces a substrate-run rendezvous server, which is a stateful piece of infrastructure the project has otherwise avoided.

The pragmatic first cut: **QR code carries desktop's LAN IP + port + a short-lived shared secret**. Phone and desktop on the same Wi-Fi. LAN-only for the first version. The mesh-across-networks path is the second version; substrate is not obligated to solve the general remote-attach problem to ship a demo.

---

## 6. Cloud-driver support on mobile

A user with an Anthropic API key or an OpenAI API key on desktop should be able to unlock the same drivers on their phone without setting up keys twice.

Two paths:

**Local sync.** Desktop substrate exports its key set into a QR blob that the phone reads once. Keys land in the phone's keychain. Nothing crosses substrate infrastructure. Trust boundary is the QR moment.

**Cloud sync.** Substrate runs a small key-vault service; user authenticates once, keys sync across devices. Requires substrate-run infrastructure that has otherwise been avoided. Deferred until worth the operational cost.

Local-sync is the right first cut.

---

## 7. Commercial landscape

Every shipping mobile LLM product covers a slice of what substrate mobile would do; none covers the shape.

- **Claude for iOS / Anthropic app.** Chat window, voice input via system STT, no on-device model, no directive vocabulary. Standard shape.
- **ChatGPT for iOS.** Same shape, more polish, custom voice pipeline, no directive vocabulary, no mastering layer. Market leader.
- **Perplexity mobile.** Cloud-only, focus-mode dial (Academic / Writing / …) is the closest thing to a mastering-layer surface in a shipping product, but the modes are opaque and short.
- **Poe (Quora).** Multi-driver front-end. Cloud only. Interesting for cross-driver switching precedent.
- **Character.ai.** Persona-driven chat. Different market — companionship. Their retention numbers are relevant to whether a mastering-layer-conditioned chat is habit-forming.
- **Private LLM / LLM Farm / Enchanted / PocketPal.** On-device model apps. Bring-your-own model, no framing, no directive surface. The technical proof that local models work on phones today.
- **Pi (Inflection, now Microsoft).** Tuned for talking, warm register, no directive surface. Sold as a companion. The rhetorical opposite of substrate's mastering register; useful as a foil.

The gap in the market: **an on-device or hybrid LLM chat companion with a real rhetorical register and a directive vocabulary.** No shipping product occupies it.

---

## 8. Product-set differences to name

The two products are close relatives and different animals. Named differences that will matter downstream:

- **Records.** Desktop opens and edits records; mobile mostly reads and appends to them. Records are portable across.
- **Tool loop.** Desktop drives real filesystem / bash / edit tools; mobile does not by default. A mobile session that wants tools has to attach to a desktop session.
- **Voice.** Mobile is voice-first; desktop is keyboard-first. STT/TTS shape the mobile input surface.
- **Session length.** Desktop: hour-long. Mobile: minutes.
- **Model tier.** Desktop: default to a strong cloud driver or a local 8B+ model. Mobile: default to Apple Foundation / Gemini Nano / a 3B GGUF.
- **Mastering layer intensity.** Higher on mobile — small models need more scaffolding to hold the register. The layer is model-conditional; the mobile app selects a heavier mastering set for local-model drivers and a lighter set for cloud drivers.

---

## 9. Open questions

- **Which platform first.** iOS ships Apple Foundation Models as a system service; the free on-device driver is a shortcut Android does not match cleanly. iOS-first is likely, Android as a fast second.
- **Voice pipeline.** Native STT (iOS Speech framework, Android's SpeechRecognizer) or a bundled Whisper-small? Native is free and lower latency; bundled Whisper works offline and gives consistent behavior across OS versions.
- **How QR-bridge works when the phone is not on the desktop's LAN.** LAN-only for v1, mesh for v2. What v2 looks like — substrate-native mesh or user-supplied Tailscale — is a design decision.
- **Native app vs. web.** A React Native or Swift/Kotlin native shell has access to the on-device LLM APIs and the platform voice pipelines. A PWA does not. Native is likely required to hit the hero demo.
- **Pricing.** Substrate desktop is a single-purchase or free open-source? Mobile follows suit or diverges? Not a research question — a business decision — but the answer shapes what the app has to bundle.
- **Where the moves picker lives on a small screen.** A wheel does not fit a phone the way it fits a keyboard. A bottom-sheet with horizontal swipe is the likely shape; the desktop 2D picker (Up/Down siblings, Right drill) needs a mobile analog.

---

## 10. Prior art to read next

- Apple Foundation Models framework — WWDC 2025 session and Apple's developer documentation on the framework.
- MLX Swift — Apple's on-device ML framework, arm64-native, ships with GGUF loaders.
- Georgi Gerganov, llama.cpp — the reference implementation for quantized on-device LLMs; runs on iOS via Metal.
- Tailscale, "How Tailscale Works" (blog post series) — the WireGuard-plus-coordination model, transferable to substrate's mesh needs.
- Signal Protocol device-linking (Signal's public documentation) — the QR ceremony precedent.
- Pi by Inflection — for the "warm chatbot" contrast against substrate's rhetorical register.

---

*Scope-out: this document is not a design spec. Nothing here commits to platform, UI shape, or bridge protocol. The next document is the design — a mobile Sprint plan, wireframes for the three primary surfaces (chat, moves picker, session-attach), and a picked stack. Opens when the desktop shipping wave closes.*

---

## Appendix — original prompt

The following is the dictation this document was written against. Recorded verbatim so the source is inspectable and later readers can judge whether the document did the prompt justice.

> And then another thing: we do have all these mobile designs as well. I think the mobile thing is going to be a different product. Somehow it has to be a different product set, slightly. Like small local models. It's not a coding thing as much, right? But you will be able to connect to it. So you'll be able to scan a QR code that's displayed by the substrate program on the desktop, right? And then you'll be able to connect to that session or you'd be able to do it remotely if you're already linked. You know what I mean? There's definitely ways to do that. Be like Tailscale. I think probably there's like a really simple implementation, but there's a bunch.
>
> The mobile design is more for talking to and not for coding. It's like actually a chatbot, but it does these things we already talked about, so it's semantically safe for users, and then they'll just use it if we present it in the right way because they'll be drawn into it, to talk to the thing in the way that we do it. And then the desktop one is for coding. The desktop one has the full coding thing. Substrate on the phone allows you to orchestrate a local model, right? There's a demo that allows you to do something really impressive with a local model on the phone. Maybe even coding on the iPhone, but it's not the point. But then it also allows you to sign into any of your stuff on the phone via API keys or via any way that you could do it. It allows you to run any substrate session on your phone with any model, but the focus is more like talking and not coding. And then coding is like more of a lower focus. But it definitely can be done.
