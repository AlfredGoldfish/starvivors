---
name: forgeplay-engine
description: Use when writing or modifying code inside the ForgePlay 2D game engine — whether that's the engine runtime (src/engine/), a game on top of it (src/game-*/), or the dev-environment editor (src/dev-environment/, src/editor/). Covers the Engine facade, the manifest-based game template model, the fixed-timestep tick, the binary-asset pattern, and the 12 known gotchas that have bitten previous sessions.
---

# ForgePlay Engine Skill

ForgePlay is a 2D game engine (Canvas2D, TypeScript, browser) whose primary operator is an AI. The AI writes games on top of the engine the same way a human writes scripts in Unity or Godot. There is no asset pipeline — every visual is a geometric shape plus a color.

Read this file in full before writing any code. It routes you to the deeper material for whatever you're doing.

## Orientation

- **Engine facade.** One `Engine` instance (`src/engine/Engine.ts`) exposes 48 readonly subsystems. You do not `new` subsystems — you reach them through `engine.<name>`. The canonical list is in [`reference/engine-facade.md`](reference/engine-facade.md).
- **Game manifest.** Every game is a `GameManifest` (see `src/engine/GameManifest.ts`): `id`, `name`, `description`, `physicsLayers`, `wire(engine)`, `createInitialScene()`, and optional `editorSupport` / `getPalette()` / `getDebugActions()`. Manifests are registered into `GameRegistry` at boot. There are no hardcoded per-game branches inside the engine anymore — everything flows through a manifest.
- **Dev environment.** `src/dev-environment/` is the editor shell (DockManager, MenuBar, panels). `src/editor/components/GraphEditor.ts` is the shared graph backbone for Dialog + Behaviors + any future graph-shaped subsystem. The editor is a visualization of the API; anything the editor can do, the API can do too.
- **Project-centric.** Post-S58, persistence is in IndexedDB through `ProjectStore`. No more localStorage-per-game. Binary assets (audio, images, ForgePack exports) follow the binary-asset pattern — see `principles.md`.

## Hard rules (always apply)

Four rules that apply to every session, no exceptions:

1. **API-first.** If you add an editor feature, you ship its API equivalent in the same session. Editor-only features are a bug. Record the pairing in `SESSION_LOG.md`.
2. **No hardcoded games inside `src/engine/`.** The engine has zero knowledge of any specific game. Game logic lives in `src/game-*/` and hooks in through `GameManifest.wire()`.
3. **No new `src/engine/systems/` folders of pre-built mechanics.** The engine exposes primitives; games compose mechanics out of them.
4. **No browser-storage shortcuts.** New persistence goes through `ProjectStore` / IndexedDB. Do not reach for `localStorage`, `sessionStorage`, or the filesystem from engine code.

The long-form rationale is in `principles.md`.

## Always-load companions

Before touching code, also read:

- [`principles.md`](principles.md) — hard boundary, tick order, AI-agency, API-first, binary-asset pattern. Full rationale for the four rules above.
- [`conventions.md`](conventions.md) — TypeScript style, file layout, test placement, naming. Subset of the root `CONVENTIONS.md` adapted for engine/game/editor layers.
- [`gotchas.md`](gotchas.md) — 12 ways prior sessions have broken the engine. Each has a symptom, a cause, and the fix.

## Task router — "I need to…"

Pick the task that matches what you're about to do. Each row names a target doc.

| Task | Go to |
|------|-------|
| Build a new game on top of the engine | [`building-a-new-game.md`](building-a-new-game.md) |
| Add a new engine subsystem (registry, manager) | [`reference/adding-a-subsystem.md`](reference/adding-a-subsystem.md) |
| Use an existing subsystem (renderer, physics, audio…) | [`reference/engine-facade.md`](reference/engine-facade.md) |
| Work with components | [`reference/components.md`](reference/components.md) |
| Work with scenes / scene stack | [`reference/scenes.md`](reference/scenes.md) |
| Work with the event bus | [`reference/events.md`](reference/events.md) |
| Author a dev-environment panel | [`reference/editor-panels.md`](reference/editor-panels.md) |
| Extend the `GraphEditor` for a new graph-shaped subsystem | [`reference/graph-editor.md`](reference/graph-editor.md) + [`patterns/graph-editor-as-backbone.md`](patterns/graph-editor-as-backbone.md) |
| Persist a file-backed registry (audio, images, icons, atlases) | [`patterns/binary-assets.md`](patterns/binary-assets.md) |
| Ship a subsystem to the 10-gate bar | [`patterns/ten-gate-checklist.md`](patterns/ten-gate-checklist.md) |
| Hold both closure-authored + data-authored entries in one registry | [`patterns/dual-source-registry.md`](patterns/dual-source-registry.md) |
| Decide if a new subsystem warrants a `GraphEditor` (or list / form / canvas) | [`patterns/graph-editor-as-backbone.md`](patterns/graph-editor-as-backbone.md) |
| Debug a problem (game won't boot, tests flake, physics feels off…) | [`gotchas.md`](gotchas.md) first; if not there, `SESSION_LOG.md` (grep the symptom) |

## What to do when your task isn't in the router

If your task doesn't fit any row above:

1. Write a one-liner in `SESSION_LOG.md` under the current session's Pre-Work Questions describing what you couldn't find.
2. Fall back to the closest adjacent reference: for engine work, the nearest `.ts` + `.test.ts` pair. For editor work, an existing panel. For game work, a recent game's `manifest.ts`.
3. If you discover a pattern future sessions will need (validated across 2+ consumers), flag it in your session's Results. A future meta-session folds it into `patterns/` properly — do NOT append to `SKILL.md` or `principles.md` speculatively.

## Not in this skill

- **Roadmap / what to build next.** → `BRAIN.md` (Now block), [`../docs/roadmap/ROADMAP_1.0.md`](../docs/roadmap/ROADMAP_1.0.md), [`../docs/roadmap/PASS_3_PLAN.md`](../docs/roadmap/PASS_3_PLAN.md).
- **Recent session history.** → `SESSION_LOG.md` (latest entry).
- **Engine vision / commercial direction.** → `DESIGN_DOCUMENT.md`.
- **Structural / architectural principles beyond the four hard rules.** → `ARCHITECTURE.md`.
