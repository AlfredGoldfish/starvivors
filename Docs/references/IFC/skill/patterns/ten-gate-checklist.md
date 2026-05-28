# The 10-Gate Checklist

Every subsystem ships through the same 10 gates. No subsystem is "done" until all 10 pass. Gate 9 (visual polish) is not optional.

**When to reach for this checklist:** you're the session owner for a subsystem's 10-gate closeout (e.g. "S74 — engine.forces"). Work through the gates in order; each one is a stop-point that can fail the whole session if skipped. The authoritative gate list lives in [`docs/roadmap/ROADMAP_1.0.md`](../../docs/roadmap/ROADMAP_1.0.md); this doc is the operational expansion — what each gate means, how to verify it, what failure looks like.

**When NOT to reach for this checklist:** you're doing a bug fix, a doc pass, or adding capability to an already-shipped subsystem. 10-gate is for taking a subsystem from pre-gate to shipped — not for maintenance.

---

## The closeout template

Proven across 14 sessions (S59–S71 Pass 1 + Pass 2 — seven subsystems each time). Every session that followed this shape shipped clean; every session that skipped a step hit friction.

1. **Survey first** (pre-code). Open the existing module + tests, identify which gates already pass, post the gap list before touching code. Get the scope recommendation confirmed by Joosh where the prompt doesn't commit.
2. **API-first rewrite.** Close every gate-1 gap on the facade. Emit named events through the attached EventBus.
3. **Serialize round-trip** fitting ForgePack's generic shape (`{ subKey: Record<name, data> }`). Binary assets go through [`patterns/binary-assets.md`](binary-assets.md).
4. **Undo/redo through `engine.editor.commands`.** Panel wraps every mutation — including activate/deactivate/rename toggles — in an EditorCommand. Zero direct writes from panel.
5. **Editor panel** follows the standard chrome bar (header + tag-grouped sidebar + inspector + runtime preview strip). Canvas-centric deviations (e.g. TilemapEditorPanel) are documented as Sticky Warnings, not ad-hoc departures.
6. **Toast on routine ops; Modal on destructive.** No silent failures.
7. **`engine.docs` entry + event docs.** Full payload shapes.
8. **Tests target the new API + events** — +8 to +35 per session is the normal range.
9. **Finish with `npx tsc --noEmit` + `npx vitest run` clean.** Update `BRAIN.md` In Flight → `SESSION_LOG.md` detail, update `STATE.md`.

---

## The 10 gates — operational expansion

### Gate 1 — API complete

**What it means.** Every operation a game could reasonably want is exposed on `engine.<subsystem>`. CRUD is the floor (`register / get / has / list / remove / clear / count / duplicate`); lifecycle methods, event-driven hooks, and subsystem-specific ops fill out the surface.

**How to verify.** Read the file top to bottom — any thought of "I'd have to reach into the private Map to do X" is a gate-1 gap. Cross-check against how the three launch games (Starvivors, FF7-idle, supernova-runner) actually use this subsystem; if a game has to work around a missing method, the API isn't complete.

**Failure signature.** Panel mutations bypass the public API (`engine.x._items.set(...)`). Games paper over with helper utilities that should be engine methods. Tests can't exercise a behavior without constructing internal state directly.

---

### Gate 2 — Registry shape canonical

**What it means.** Map-based where applicable. `register / get / list / remove / clear` all present with consistent names. A single `source: 'code' | 'data'` discriminator when the registry holds both closure-authored and data-authored entries — see [`patterns/dual-source-registry.md`](dual-source-registry.md).

**How to verify.** If every other Pass 1/2 subsystem's signatures drop in with a one-word rename, you're canonical. Non-Map internal storage (plain objects, arrays) is OK only when the data genuinely isn't name-keyed (the postprocess pipeline is an ordered list; the lighting `lights` array is append-only).

**Failure signature.** Different subsystems spell the same operation three ways (`addX` / `registerX` / `createX`). `list()` returns different shapes across subsystems. Games have to import concrete types just to call `registerX`.

---

### Gate 3 — Serialize round-trips

**What it means.** `serialize() → JSON → deserialize()` preserves every piece of state. Matches ForgePack's `{ subKey: Record<name, data> }` generic extractor shape. Malformed entries in `deserialize` skip rather than throw. Backwards-compatible with any legacy shape shipped before this session.

**How to verify.** Write a test: register two entries, serialize, construct a new registry, deserialize, assert `list()` returns what you registered. For dual-source registries, also assert closure entries survive a deserialize cycle (they shouldn't be serialized but also shouldn't get dropped). **In-test round-trip is necessary but not sufficient** — also verify the registry is registered in `ProjectExporter.REGISTRY_FILES` (so `.forgeplay` picks it up) and, if the subsystem participates in `.forgepack` exports, in `EXPORTABLE_REGISTRIES` + `ForgePackExporter.getRegistry`. S79 surfaced 7 subsystems that shipped to 10-gate without the `REGISTRY_FILES` entry — their serialize worked in isolation but `.forgeplay` silently dropped them on import.

**Failure signature.** Round-trip test passes on the happy path but drops per-instance runtime state. `deserialize({})` throws on null. Legacy save blobs fail to load. ForgePack `extractEntries` can't flatten the shape — in which case either reshape the serialize output or add a documented exclusion (lighting S67 and postprocess S69 did this for `{ config, payload }` shapes; a 3rd instance should trigger an extractor fix, not a 3rd exclusion).

---

### Gate 4 — Undo/redo through `engine.editor.commands`

**What it means.** Every mutation from the editor panel — including activate/deactivate toggles, renames, property edits — wraps in an `EditorCommand` and pushes onto the shared undo stack. Bulk ops (fill, flood, multi-entity moves) are ONE command with a prev-state snapshot, not N per-cell commands.

**How to verify.** Perform a panel op, press Ctrl+Z, assert the state reverts exactly. Then Ctrl+Y, assert it redoes. For bulk ops, the undo must revert the entire bulk — not just the last cell.

**Failure signature.** Panel calls `engine.x.set(...)` directly without wrapping. Undo reverts the wrong subset. Bulk fill produces N undo entries that the user has to unwind one at a time.

---

### Gate 5 — Tests pass

**What it means.** Unit coverage for public API, integration coverage for cross-subsystem interactions (emissive contract, binary-asset hydration, etc.). `npx tsc --noEmit` clean. `npx vitest run` clean. Typical session adds 8–35 tests — fewer than 8 usually means under-tested; more than 35 often means tests are too coupled to implementation.

**How to verify.** Run both commands. Failures block gate 5 even if the new subsystem's own tests pass — a regression in a sibling subsystem is still a gate-5 fail.

**Failure signature.** New tests pass but the baseline dropped. `tsc` errors in files you didn't touch (you changed a type signature). Test file shape is "assert internal Map size is 3" instead of "assert `list().length === 3`".

---

### Gate 6 — Editor panel exists

**What it means.** A dedicated dock panel for anything the author needs to *configure* rather than just browse. Asset Browser tabs are view-only and don't satisfy gate 6 on their own; they pair with the dedicated editor for listing.

**How to verify.** `View > X Editor` menu action exists, panel opens, default layout includes it. Panel has the chrome bar (header + grouped sidebar + inspector + optional preview strip). Canvas-centric deviations (tile painter, graph editor) are OK when documented in a Sticky Warning.

**Failure signature.** Only the Asset Browser tab exists. Panel is stubbed but doesn't render any interactive controls. Panel sits in a dev-only entrypoint the user can't reach.

---

### Gate 7 — Operator-complete

**What it means.** The editor and the API can both do every operation. Create, edit, duplicate, delete, rename, preview, import, export — none of these are editor-only or API-only. If the panel can do X, the API must expose X; if the API can do X, the panel must have a control for it (or it's deliberately hidden with a comment explaining why).

**How to verify.** Walk the panel top to bottom, list every affordance, cross-check each one has an `engine.x.<method>` equivalent. Then walk the API and cross-check panel coverage.

**Failure signature.** "You can duplicate in the panel but not via API." "You can set this property via API but the panel has no field for it." Gate-7 fails are the most common invisible bug — they don't break anything, they just mean the AI operator and the human see different surfaces.

---

### Gate 8 — Toast + modal feedback

**What it means.** Every routine op produces a Toast ("Registered `powerup_magnet`"); every destructive op gates through a Modal ("Delete powerup_magnet? This cannot be undone."). No silent failures. No `alert()`. No console-only errors that the user misses.

**How to verify.** Perform every create / update / delete / rename in the panel. A Toast or Modal should accompany each. Cause a deliberate error (invalid JSON in a textarea) and verify the inline status shows it — not a silent console log.

**Failure signature.** Delete happens with no confirmation. Create succeeds but the author has no feedback. Parse errors land in the console with no panel indication.

---

### Gate 9 — Visual polish

**What it means.** Unity/Unreal-caliber. This is the gate the Project Manager currently fails (see [`docs/roadmap/ROADMAP_1.0.md`](../../docs/roadmap/ROADMAP_1.0.md) → Visual polish standard). Required elements:

- **Visible hierarchy** — containment + dependency structure of the data is legible at a glance.
- **Connection cues** — cross-registry references render as links/chips, not raw strings.
- **Live preview** — the thing being edited renders as it'll render in-game, in the same panel, in real time.
- **Affordances match the data** — sliders for continuous values, swatches for colors (use the shared `ColorPicker` primitive — see Sticky Warning), dropdowns populated from actual registries.
- **Empty states are purposeful** — a fresh registry shows what to create and why, not a blank pane.
- **Consistent chrome** — header / toolbar / footer / grouped sidebar match every other Pass 1/2 panel.
- **Status and errors are inline** — save state, validation errors, load failures appear in the panel.

**How to verify.** Open the panel with an empty registry — is the empty state useful? Create an entry — does the preview update live? Reference another registry (e.g. a behavior using a dialog name) — is the reference a populated dropdown, not a free-text input? Delete an entry in the middle of editing — does the inspector gracefully clear?

**Failure signature.** Flat lists without grouping. Free-text input where a dropdown should be. Preview that requires saving + re-opening to see changes. Raw JSON dumps in the inspector. Empty state is a literal blank pane.

**Canvas-centric deviations.** Documented Sticky Warning path — TilemapEditorPanel (S71) uses Tiled/LDtk/Unity's tile-palette layout instead of the standard chrome. If your panel has a similar need (scene editor, spline editor), reuse the grid-painter pattern; don't invent a third layout.

---

### Gate 10 — Docs hook

**What it means.** `engine.docs` carries a system entry + an entry per emitted event with the full payload shape. A live in-editor docs viewer consumes this (arriving in S83). The docs entry is the specification the AI operator reads to use the subsystem without grepping source.

**How to verify.** Open `DocsRegistry.ts`, find the system entry for your subsystem, cross-check it mentions every significant API method + every event + every event's payload shape. Run a mental search: "if I were an AI operator who'd never seen this subsystem, would the docs entry be enough to use it?"

**Failure signature.** System entry describes the old closure-only API after the dual-source rewrite. Events emitted but undocumented. Payload shapes missing fields.

---

## Exit criteria

A subsystem ships when:

- [ ] All 10 gates green
- [ ] `npx tsc --noEmit` clean
- [ ] `npx vitest run` clean (baseline maintained or increased)
- [ ] BRAIN.md In Flight row moved to SESSION_LOG.md with full session detail
- [ ] BRAIN.md Now block updated — last shipped + next up
- [ ] STATE.md updated to reflect current subsystem status
- [ ] New Sticky Warnings added for anything future sessions would waste a day rediscovering

If any gate is yellow, the subsystem is not shipped. Adding a new pass number or extending the session is preferable to declaring done with a gate missing. See `principles.md` §3.

---

## Adjacent docs

- [`../../docs/roadmap/ROADMAP_1.0.md`](../../docs/roadmap/ROADMAP_1.0.md) — authoritative gate definitions + Pass 1 / Pass 2 / Pass 3 order.
- [`../../docs/roadmap/PASS_3_PLAN.md`](../../docs/roadmap/PASS_3_PLAN.md) — which subsystems Pass 3 closes + the debt bundled into each session.
- [`../principles.md`](../principles.md) §3 — the "zero-cuts" invariant.
- [`../gotchas.md`](../gotchas.md) — 12 known failure modes; check these before each gate you're verifying.
