# STARVIVORS

STARVIVORS is a browser-playable top-down space survival roguelite prototype built with Phaser 3, TypeScript, and Vite.

The current 2.0 direction is an open-sector survival game with Asteroids-style thrust and drift, survivor-style upgrade pressure, dangerous space hazards, roaming enemy squads, missions, fuel pressure, persistent rewards, and a standalone Enemy Lab for testing enemy behavior.

## Stack

- TypeScript
- Phaser 3
- Vite
- Electron for desktop packaging
- npm scripts for local development and builds

## Install

```powershell
npm install
```

## Run

Browser dev server:

```powershell
npm.cmd run dev
```

Open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173
```

Enemy Lab:

```text
http://127.0.0.1:5173/enemy-lab.html
```

Desktop dev build:

```powershell
npm.cmd run dev:desktop
```

## Build

Type-check and build the browser version:

```powershell
npm.cmd run build
```

Build the Windows portable desktop version:

```powershell
npm.cmd run build:desktop
```

Preview the production browser build:

```powershell
npm.cmd run preview
```

## Project Structure

```text
assets/              Runtime art, saved black-hole field tuning, and pickup/ship/debris assets
Docs/                Current GDD, phase notes, and project guidance
electron/            Electron main/preload process source
Enemy_Prototype/     Standalone enemy and mechanic preview HTML files
src/                 Main game source
  config/            Phaser game configuration
  core/              Arena and viewport helpers
  data/              Ships, weapons, upgrades, enemies, missions, events, and balance data
  scenes/            BootScene, GameScene, EnemyLabScene, and scene types/constants
  systems/           Gameplay, physics, combat, spawning, progression, debug, and runtime systems
  ui/                Menus, HUD screens, shop, pause, ship select, and overlays
```

## Current State

The game currently includes a playable main prototype and a separate Enemy Lab sandbox. Implemented or partially implemented systems include ship selection, loadouts, Pulse Cannon, Ramming Shield, Salvage Beam, black holes, asteroids, debris, scrap pickups, upgrades, shop/results flows, missions, rare events, sector generation, roaming squads, minimap/HUD, persistent progression, debug tooling, and smoke harnesses.

`GameScene.ts` remains the conductor for Phaser lifecycle, object ownership, run flow, and module wiring. Focused systems under `src/systems`, `src/ui`, `src/data`, and `src/core` own new gameplay, UI, data, harness, tuning, and runtime behavior.

`Docs/STARVIVORS_2_0_GDD_AND_BUILD_PLAN.md` is the current product roadmap and operating guide. Older MVP documents remain useful reference, but the 2.0 GDD and the current source tree take precedence when they conflict.

## Development Rules

Keep changes small, buildable, and easy to verify.

- Run `npm.cmd run build` after focused implementation work.
- Preserve query-string smoke harnesses and debug menu behavior.
- Do not wire WIP or future content into active gameplay unless the task explicitly asks for it.
- Treat `src/scenes/GameScene.ts` as orchestration, not the default home for new gameplay logic.
- Keep `GameScene.ts` as the conductor: it coordinates lifecycle and module calls while focused modules do the gameplay, UI, data, harness, tuning, and runtime work.
- Prefer existing modules in `src/systems`, `src/data`, `src/ui`, and `src/core`; create focused modules when no existing module fits.
- Keep gameplay tuning, balance, content, packaging, and framework changes separate unless the task explicitly combines them.

## Documentation

- `Docs/README_FOR_CODEX.md`: working instructions for Codex sessions
- `Docs/STARVIVORS_2_0_GDD_AND_BUILD_PLAN.md`: current 2.0 roadmap
- `Docs/STARVIVORS_MVP_VISUAL_IDENTITY.md`: visual style reference
- `Docs/STARVIVORS_MVP_HUD_UI_LAYOUT.md`: HUD and screen reference
- `Docs/STARVIVORS_MVP_GAME_FEEL_BALANCE.md`: game feel and balance reference
- `Docs/STARVIVORS_MVP_TECHNICAL_ARCHITECTURE.md`: architecture reference
