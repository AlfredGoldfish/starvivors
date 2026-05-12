# README FOR CODEX

This repository is the STARVIVORS project.

Use these documents as the working MVP source of truth for future Codex tasks. The existing `Docs/` folder contains older and companion reference material. The lowercase `docs/` folder is the task-ready documentation set.

## Current Task Boundary

This repository is documentation-only right now.

Do not create source code until a future prompt explicitly asks for the Phaser/Vite/TypeScript scaffold.

Do not add:

- Phaser scaffold
- Gameplay code
- npm packages
- Enemies
- Weapons
- Black holes
- Upgrades
- Shop
- Audio implementation
- Electron, Tauri, or Steam packaging

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

Do not ask Codex to build the entire game at once.

Do not wire WIP or future content into active gameplay unless the prompt explicitly says to implement it.

