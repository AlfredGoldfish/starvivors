# README FOR CODEX

This repository is the STARVIVORS project.

Use these documents as the working MVP source of truth for future Codex tasks. Some older documents still describe the original scaffold phase; prefer the current source tree when they conflict. The completed refactor tracker is archived at `Docs/Old_Documents/REFACTOR_PLAN.md`.

## Current Task Boundary

This repository now contains a browser-playable Phaser 3, TypeScript, and Vite prototype. Gameplay code exists under `src/`, with `GameScene.ts` currently serving as the main orchestration point during the refactor.

For the current major refactor, keep changes incremental and behavior-preserving. Do not make gameplay tuning, balance, content, audio, packaging, or framework changes unless a prompt explicitly asks for them.

## Project Direction

STARVIVORS is a top-down space survival roguelite.

Core influences:

- Vampire Survivors-style survival pacing, upgrade pressure, and run progression
- Asteroids-style thrust, drift, momentum, and wrapping space
- Arcade roguelite build variety
- Simple geometric visuals with strong particles and readable UI

Core hook:

The player pilots a ship through a large wrapping space arena while enemies, debris, projectiles, pickups, and the player are affected by moving black holes. The player destroys enemies and debris, gains XP directly, banks upgrades, collects scrap, and survives until the round timer ends.

## MVP Build Target

The first build target is a browser-playable prototype.

The eventual target is a desktop Steam release, but Steam packaging is post-MVP.

Recommended future stack:

- TypeScript
- Vite
- Phaser 3 unless the repo later specifies otherwise
- Modular source files from the beginning
- Browser prototype first
- Desktop wrapper later

## Documentation Files

- `STARVIVORS_MVP_CONTENT_LOCK.md`: what is in and out of MVP
- `STARVIVORS_MVP_VISUAL_IDENTITY.md`: visual style, readability, and art limits
- `STARVIVORS_MVP_HUD_UI_LAYOUT.md`: screens, HUD, and interface rules
- `STARVIVORS_MVP_AUDIO_DIRECTION.md`: sound direction for later implementation
- `STARVIVORS_MVP_GAME_FEEL_BALANCE.md`: movement, pacing, and tuning targets
- `STARVIVORS_MVP_TECHNICAL_ARCHITECTURE.md`: future architecture rules for Codex

## Codex Workflow Rules

Codex should work in small, testable tasks.

Each future implementation task should include:

- Task
- Context
- Files to read
- Requirements
- Do not change
- Acceptance criteria
- Testing instructions

Do not ask Codex to build or refactor the entire game in a single unsafe diff.

Do not wire WIP or future content into active gameplay unless the prompt explicitly says to implement it.

After the completed organization refactor:

- Read the current source before moving code.
- Keep `npm.cmd run build` passing after each focused change.
- Preserve query-string smoke harnesses and debug menu behavior.
- Leave unrelated local artifacts such as Vite logs out of commits.
