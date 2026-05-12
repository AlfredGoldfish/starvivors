# STARVIVORS MVP GAME FEEL BALANCE

This file defines the MVP feel and balance targets.

## Core Feel

STARVIVORS should feel like a space survival game with skillful thrust control.

Movement should be:

- Acceleration-based
- Momentum-heavy
- Floaty but controllable
- Punishing when badly positioned
- Recoverable with skilled thrust, braking, and planning

The player should feel endangered by momentum and gravity, but not helpless.

## Arena Feel

The arena is 9 by 9 viewports.

The camera follows the player and shows one viewport-sized section at a time.

The world wraps at the arena edges.

Wrapping applies to:

- Player
- Enemies
- Debris
- Projectiles when weapon rules allow it
- Pickups if enabled
- Black holes unless a specific future mode says otherwise

The arena should feel like open space, not a small boxed room.

## Round Structure

MVP round target:

- 15 minutes

Future mode:

- 30 minutes

Win condition:

- Survive until the timer reaches zero

Loss conditions:

- Hull reaches zero
- Player is consumed by a black hole

## Player Loop

Moment-to-moment:

- Thrust and drift through space
- Aim or position based on ship type
- Destroy enemies
- Avoid collision hazards
- Avoid black hole pull
- Destroy or evade debris
- Collect scrap pickups
- Watch XP bar fill
- Decide when to spend banked upgrades

Minute-to-minute:

- Enemy density increases
- Black holes drift into and out of danger range
- Debris fields accumulate
- Player upgrades weapons
- Player chooses whether to fight, kite, clean debris, or reposition

Run-to-run:

- Complete or fail run
- View results
- Convert collected scrap into credits
- Buy shop upgrades
- Start a new run stronger or with a different ship

## XP And Upgrades

MVP XP rules:

- XP is gained directly from destroying ships and debris
- There are no XP gems
- Filled XP bars create banked upgrades
- Banked upgrades are not forced immediately
- The player chooses when to open the upgrade screen
- Upgrade choices are 1 of 3
- In-run upgrades are weapon-focused

## MVP Ships

MVP includes two playable ships:

- Interceptor: starts with a slow Pulse Cannon
- Bulwark: starts with a Ramming Shield

These ships should test distinct playstyles.

## Balance Direction

Balance should make the player choose between:

- Fighting for XP
- Cleaning debris
- Chasing scrap
- Avoiding black holes
- Repositioning before danger compounds

Do not over-tune permanent progression before the core run is fun.

