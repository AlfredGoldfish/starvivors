# STARVIVORS MVP TECHNICAL ARCHITECTURE

This file defines the future technical direction for STARVIVORS.

Do not create source code from this document until a future prompt asks for implementation.

## Target Stack

Future implementation target:

- TypeScript
- Vite
- Phaser 3 unless the repository later specifies otherwise
- Browser-playable prototype first
- Desktop wrapper after the browser loop is fun and stable

Do not build the game as one giant HTML file.

Use modular files from the beginning so Codex can safely work on isolated systems.

## Architecture Principles

Future code should be organized around small systems:

- Scenes
- Player movement
- Arena wrapping
- Enemy spawning
- Weapons
- Projectiles
- Black holes
- Debris
- Pickups
- XP and upgrades
- HUD
- Shop and persistence
- Content status

Each system should be testable or manually verifiable without rewriting unrelated systems.

## First Future Code Task

The first implementation task should be only the project scaffold.

Expected first code task:

- Create TypeScript, Vite, and Phaser 3 project structure
- Add a BootScene and GameScene
- Render a simple triangle player ship in the center
- Add a dark generated starfield
- Add debug text showing FPS, player position, and arena size
- Define the arena as 9 by 9 of the viewport

Do not add enemies, weapons, black holes, upgrades, menus, shop, audio, Electron, or Steam in the first scaffold task.

## Content Status Rule

The codebase should support content status values:

- Implemented
- MVP
- WIP
- Future
- Disabled
- Locked

Only enabled and implemented content can enter active random gameplay pools.

WIP content can appear in menus only when clearly tagged.

## Codex Safety Rules

Future Codex tasks should:

- Read relevant docs before editing
- Change only the requested system
- Avoid large unrelated rewrites
- Keep files modular
- Leave WIP systems inactive unless explicitly requested
- Include verification steps
- Commit only the requested changes

## Current Non-Code Rule

For the current documentation task, no gameplay code should exist.

