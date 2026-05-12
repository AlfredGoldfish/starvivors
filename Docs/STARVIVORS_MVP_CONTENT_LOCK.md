# STARVIVORS MVP CONTENT LOCK

This file defines the MVP scope lock. Future Codex tasks must follow this scope unless a prompt explicitly changes it.

## MVP Goal

Create a playable browser prototype that proves the core loop is fun.

The MVP is not the full Steam game.

## Required MVP Features

The MVP must eventually include:

1. Modular TypeScript browser project
2. 9 by 9 viewport wrapping arena
3. Player movement with inertia
4. Two playable ships: Interceptor and Bulwark
5. Interceptor Pulse Cannon
6. Bulwark Ramming Shield
7. At least one moving black hole
8. Asteroids
9. Destroyed enemies creating hazardous debris
10. At least three enemy types
11. Direct XP gain with no XP gems
12. XP bar and banked upgrades
13. Player-triggered upgrade overlay
14. 1-of-3 in-run weapon upgrades
15. Scrap pickups
16. End-run scrap-to-currency tally
17. Simple main-menu shop
18. Basic permanent shop upgrades
19. HUD
20. Results screen
21. WIP tags for visible non-MVP content

## Not Required For MVP

Do not add these until the MVP loop is fun and a future task asks for them:

- Steam packaging
- Electron or Tauri wrapper
- Full meta-progression balance
- Bosses
- All ships
- All weapons
- Full attachment system
- Full sound design
- Controller support
- Achievements
- Cloud saves
- Advanced shop upgrades
- Minimap

## Current Repository State

At this documentation stage, do not implement any gameplay features.

The next code task should be the initial Phaser/Vite/TypeScript scaffold only, if requested.

## Content Status Rules

Use these status values for content planning:

- `Implemented`: complete and active
- `MVP`: planned for MVP
- `WIP`: visible work in progress, not active in random gameplay pools
- `Future`: planned after MVP
- `Disabled`: present but not available
- `Locked`: visible but unavailable until unlocked

Only enabled, implemented content can enter active random gameplay pools.

WIP content may appear in menus only if it is clearly tagged and cannot be mistaken for complete content.

Codex must not wire WIP content into gameplay unless the task explicitly says to implement it.

