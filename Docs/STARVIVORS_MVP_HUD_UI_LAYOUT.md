# STARVIVORS MVP HUD UI LAYOUT

This file defines the MVP screens, HUD priorities, and UI rules.

## MVP Screens

The MVP should eventually include:

- Main Menu
- Ship Select
- Shop
- Game HUD
- Upgrade Overlay
- Pause Menu
- Results Screen

Do not create these screens until a future implementation task asks for them.

## HUD Priorities

The HUD must be readable during fast movement and combat.

Required HUD information:

- Run timer
- XP bar
- Banked upgrade count
- Hull or health
- Shield, if the selected ship uses shield mechanics
- Scrap or resource count
- Weapon status
- Upgrade prompt when upgrades are banked
- Black hole danger readability through world visuals

## Layout Direction

Recommended MVP layout:

- XP bar near the top
- Timer clearly visible
- Hull and shield grouped together
- Scrap count visible but secondary
- Weapon status grouped near combat information
- Upgrade bank count prominent enough that players know when they can spend upgrades

The HUD should not block central gameplay space.

## Upgrade Overlay

Upgrade selection is player-triggered.

Rules:

- XP fills the bar
- Level-ups become banked upgrades
- The player chooses when to open the upgrade overlay
- Gameplay pauses only while the player is spending an upgrade
- The overlay presents 1 of 3 in-run weapon upgrade choices

In-run upgrades are weapon-focused for MVP.

## Shop UI

The MVP shop should be simple.

Shop upgrades are permanent and purchased with credits earned from run resource tally.

MVP shop categories may include:

- Ship survivability
- Weapon damage
- Attack speed
- Melee damage
- Ram shield recharge
- Scrap value

Do not build an advanced sphere grid or complex progression board for MVP.

## WIP UI Rules

WIP content can appear in menus if useful, but must be clearly tagged.

WIP content should not be active in random gameplay pools.

Disabled, future, locked, and WIP states must be visually distinct enough that the player understands they are not available yet.

