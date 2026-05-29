# Starvivors 2.0 GDD and Build Plan

Last updated: 2026-05-22

This document is the working design and implementation guide for converting the current Starvivors prototype into its next major form. It is written for both the developer and Codex. Future work should use this document to move one phase at a time, keep the game buildable, and commit frequently.

## 1. Purpose

Starvivors 2.0 changes the game from a mostly arena-wave survival prototype into an open-sector space survival roguelite.

The new game should still preserve the strongest current pieces:

- Asteroids-style thrust, drift, and wrapping space.
- Fast readable combat.
- Survivor-style upgrades and build pressure.
- Black-hole and debris danger.
- Polygon/vector enemy silhouettes.
- Large enemy roster and squad behavior from the shared enemy runtime.

The new direction is broader:

- The player enters a large hostile sector rather than a small wave arena.
- The sector is partially procedurally generated each run.
- Enemies live in the world as roaming squads, patrols, strongholds, motherships, rare events, and reinforcements.
- Difficulty comes from density, positioning, debris, fuel pressure, low player health, and dangerous enemy compositions rather than massive stat inflation.
- The player chooses between free-range exploration and mission/contract runs.
- Fuel is a thrust-use resource that adds light route and movement pressure.
- Rewards unlock weapons, ships, cosmetics, upgrades, achievements, and future content.

This is not a one-commit rewrite. It is a staged conversion plan.

## 2. Codex Operating Contract

Future Codex sessions must follow these rules unless the user explicitly overrides them.

1. Read this document and the relevant source files before coding.
2. Work one phase or subphase at a time.
3. Keep the game buildable after every implementation task.
4. Run the normal build command before a commit:

```powershell
npm.cmd run build
```

5. When practical, also run a quick browser/dev smoke check.
6. Commit locally after each meaningful phase or stable subphase.
7. Push each completed commit to GitHub.
8. Do not mix unrelated refactors into gameplay phases.
9. Do not delete old systems until the replacement is verified.
10. Prefer compatibility bridges over risky rewrites.
11. If a phase uncovers major design uncertainty, stop and ask before implementing the uncertain part.
12. Treat `src/scenes/GameScene.ts` as orchestration. Prefer existing or new focused modules in `src/systems`, `src/data`, `src/ui`, and `src/core` for gameplay, UI, data, harness, and tuning changes.
13. Do not add large new responsibilities to `GameScene.ts`. If a task would grow it substantially, extract or create a module as part of the focused change.

Each implementation prompt should ideally include:

- Phase or subphase being worked.
- Scope.
- Files likely touched.
- What must not change.
- Acceptance criteria.
- Build/test command.
- Commit message suggestion.

## 3. Current Baseline

As of this document, the project is a Phaser 3, TypeScript, and Vite game.

Important current systems:

- `GameScene.ts` is still the main orchestration scene.
- Generated polygon enemy visuals exist.
- Shared enemy AI and squad definitions exist.
- The live game uses the shared enemy runtime directly.
- A soft/hard enemy deconfliction system exists.
- Black-hole, asteroid, debris, pickups, upgrades, weapons, minimap, debug menu, pause/settings, and HUD systems exist in various levels of maturity.

The conversion goal is not to throw everything away. The goal is to keep working pieces, replace brittle special cases, and move the game toward a small set of reusable simulation systems.

## 4. Design Pillars

### 4.1 Dangerous Space

The world itself should be dangerous. Enemies, debris, black holes, strongholds, patrols, and fuel pressure all matter.

The player should often survive by avoiding bad fights, splitting enemy groups, escaping danger, and reading the sector.

### 4.2 Readable Threats

Every dangerous enemy action should have a clear silhouette, movement pattern, or telegraph.

Examples:

- Wedge Striker: nose glow and charge line before dash.
- Needle Sniper: warning beam before firing.
- Reactor Drone: pulsing core and blast radius.
- Shield Frigate: visible shield/aura.
- Carrier: visible bay pulse before spawning drones.

The player can die quickly, but death should usually feel explainable.

### 4.3 Physical Combat

The game should feel like ships, shots, debris, and gravity exist in the same physical space.

Combat should use:

- Velocity.
- Mass.
- Force.
- Collision radius.
- Knockback.
- Soft deconfliction.
- Hard contact.
- World wrapping.

No large invisible bubbles should control enemy spacing. Soft separation should feel like a small course correction, not a force field.

### 4.4 Build Identity

Weapons and upgrades should create recognizable builds.

The Pulse Cannon should become the baseline manual weapon: hold left click, shoot toward the mouse, fast bolts, clean direct damage.

Other weapons and upgrades should modify clear mechanical ideas:

- Faster.
- Heavier.
- Piercing.
- Explosive.
- Ion/slow.
- Gravity.
- Corrosion.
- Homing.
- Chain.
- Ramming/contact.

### 4.5 Living World Over Pure Waves

Waves can still exist, but they should not be the whole game.

Enemies should live in the sector:

- Roaming squads.
- Patrol routes.
- Strongholds.
- Mothership escorts.
- Ambush pockets.
- Event swarms.
- Reinforcements.
- Rare faction squads.

### 4.6 SVG/Vector Source, Sprite Runtime

Assets should move toward SVG/vector-style source art.

Runtime rule:

```text
Author as SVG/vector/polygon data.
Render as cached Phaser textures or sprites.
Do not redraw expensive vector art every frame.
```

This prevents the old black-hole performance problem where too many live line objects caused major lag.

## 5. Target Run Loop

### 5.1 Free Range Mode

The player chooses:

- Ship.
- Starting primary weapon.
- Starting loadout/module.
- Optional sector type or random sector.
- Optional difficulty/risk modifiers.

Then the player enters a large generated sector and chooses what to do:

- Hunt roaming squads.
- Collect scrap.
- Explore signal pings.
- Raid strongholds.
- Trigger rare events.
- Search for unlocks.
- Fight motherships.
- Eject when satisfied.
- Push deeper for greater rewards.

### 5.2 Mission Mode

The player chooses a mission/contract.

The sector is still generated, but the mission event or target is guaranteed somewhere in the world.

Mission examples:

- Destroy a carrier group.
- Kill a rare enemy squad.
- Recover lost weapon tech.
- Clear a stronghold.
- Investigate black-hole activity.
- Survive a thousand-swarm event.
- Assassinate a command relay.
- Recover salvage from a dead fleet.
- Destroy a mothership.

If the player dies during a mission, the run ends and the player returns to the results flow.

### 5.3 Run End Conditions

Possible run end conditions:

- Player dies.
- Player ejects.
- A mission type explicitly ends the run on completion.
- Sector event forces ejection or death.

Fuel is not a passive timer drain. Fuel is spent by thrust usage and should create a small layer of pressure around route choice, overuse of movement, and emergency recovery. The current target is about 8 minutes of continuous main thrust at the starting fuel stat, scaling up to about 35 minutes at the maximum fuel stat. Running out of fuel should create an emergency mobility state, not immediately end the run.

## 6. World and Sector Design

### 6.1 Scale

The current world should expand over time.

Target experiments:

- 2x map size.
- 3x map size.
- 5x map size.

The final size should be based on travel time, radar usefulness, enemy density, performance, and fuel balance rather than an arbitrary number.

### 6.2 Sector Regions

Generated sectors should contain regions:

- Spawn fringe.
- Open space.
- Debris fields.
- Asteroid clusters.
- Scrap-rich wreck fields.
- Enemy patrol zones.
- Stronghold zones.
- Mothership territory.
- Black-hole anomaly zones.
- Rare event pockets.
- Mission target zone.

Each region should affect play. A debris field should not just be decoration.

### 6.3 Signals and Discovery

The player should discover content through signals.

Signal types:

- Scrap signal.
- Enemy activity.
- Distress beacon.
- Black-hole anomaly.
- Mothership signature.
- Rare tech.
- Mission objective.
- Stronghold ping.

The minimap/radar should show enough information to support decisions without revealing everything.

## 7. Enemy World Model

### 7.1 Enemy Runtime

The main game should use a unified enemy runtime.

Target shape:

```ts
type EnemyInstance = {
  id: string;
  definitionId: string;
  definition: EnemyDefinition;
  body: Phaser.GameObjects.GameObject;
  velocity: Phaser.Math.Vector2;
  hp: number;
  maxHp: number;
  radius: number;
  mass: number;
  state: string;
  stateData: Record<string, unknown>;
};
```

There should not be separate live arrays for chaser, shooter, tank, carrier, sniper, etc. Enemy behavior should come from definitions and behavior handlers.

### 7.2 Enemy Roles

Initial enemy roles:

- Scout: simple chaser.
- Wedge Striker: charge attacker.
- Diamond Gunner: ranged pressure.
- Hex Tank: heavy contact/body blocker.
- Reactor Drone: telegraphed exploder.
- Splitter: splits into shards.
- Needle Sniper: long-range precision threat.
- Carrier: spawns drones.
- Shield Frigate: defensive support.
- Repair Skiff: healing support.
- Command Relay: squad buffer.
- Scrap Jackal: scavenger/thief.
- Flanker: side/back attack route.
- Reflector: timed front shield.
- Phase Skiff: elite repositioning.

### 7.3 Squads

Squads should be first-class content.

Initial squad loadouts:

- Scout Pack.
- Strike Wing.
- Gunner Escort.
- Carrier Group.
- Support Group.
- Sniper Screen.

Future squads:

- Raider Wing.
- Relay Convoy.
- Reactor Minefield.
- Reflector Wall.
- Phase Ambush.
- Mothership Escort.
- Thousand Swarm.

### 7.4 Living Enemy Behaviors

Enemies in the world should support:

- Roaming.
- Guarding.
- Patrolling.
- Ambushing.
- Pursuing.
- Retreating.
- Reinforcing allies.
- Returning to territory.
- Escorting strongholds or motherships.

Early implementation can fake some of this with simple state machines. It does not need a perfect simulation on the first pass.

## 8. Physics Redesign

### 8.1 Unified Body Model

Every physical gameplay object should eventually expose:

```ts
position
velocity
radius
mass
maxSpeed
collisionLayer
collisionMask
```

Optional properties:

```ts
knockbackVelocity
gravityVelocity
steeringVelocity
softCollisionRadius
hardCollisionRadius
```

### 8.2 Movement Update Order

Target update order:

1. Read input or AI intent.
2. Convert intent into acceleration/steering.
3. Apply external forces.
4. Apply soft deconfliction.
5. Clamp or damp velocity.
6. Integrate position.
7. Wrap coordinates.
8. Resolve hard collision/contact.
9. Update visual mirrors.

### 8.3 Hard Collision

Hard collision is the real body/contact area.

Use hard collision for:

- Player damage.
- Enemy contact.
- Projectile hits.
- Asteroid impacts.
- Debris impacts.
- Ramming shield contact.

Hard collision should be fair and close to the visible hull.

### 8.4 Soft Deconfliction

Soft deconfliction is a small steering/push reminder used mostly between enemies.

It should:

- Prevent unreadable stacking.
- Preserve close formations.
- Respect mass.
- Respect enemy state.
- Avoid giant invisible spacing bubbles.

State examples:

- Charging enemy ignores most soft separation during dash.
- Exploder in detonation state has reduced separation so its warning remains honest.
- Tank/carrier moves less.
- Drone/scout moves more.

### 8.5 Black Holes and Gravity

Black holes should use the same force model as other movement effects.

They should affect:

- Player.
- Enemies.
- Projectiles if performance allows.
- Debris and scrap if useful.

Big black-hole visuals should be simple code-rendered/cached geometry, not PNG layer stacks or many live vector lines.

## 9. Weapon and Upgrade Redesign

### 9.1 Weapon Slots

Target weapon categories:

- Primary: manual left-click weapon.
- Auto: survivor-style passive weapon.
- Secondary: compatible manual right-click weapon.
- Contact: ramming/shield/body weapon.

Current implementation note:

- Manual weapons declare slot compatibility individually.
- Pulse Cannon can be equipped as either primary or secondary.
- Ramming Shield can be equipped as either primary or secondary.

### 9.2 Pulse Cannon

Pulse Cannon should become the baseline direct-fire cannon and should feel fast, direct, and readable. It starts as the Interceptor primary, but can also be acquired as a secondary weapon by ships that start with another compatible primary, such as Bulwark.

Target behavior:

- Hold left click to fire.
- Hold right click to fire when equipped as a secondary.
- Aim by mouse/ship facing.
- Fast projectile.
- Short cooldown.
- Clean visible bolt.
- No ammo.
- No lock-on.
- No hidden targeting.

Initial lab reference:

- Cooldown: 150 ms.
- Fire rate: about 6.67 shots per second.
- Projectile speed: 900 px/sec.
- Damage: 18 in lab scale.
- Range: 1100 px.
- Radius: 8.
- Spawn point: 54 px in front of player.

Live game values may need combat-scale conversion.

### 9.3 Unified Projectile Runtime

All projectiles should use one runtime where possible.

Projectile definition should support:

```ts
speed
damage
radius
range
lifespan
pierce
knockback
splashRadius
homingStrength
statusEffect
visual
onHit
onExpire
```

Enemy shots, player shots, sniper shots, explosive shots, and special weapon shots should share collision and movement logic unless they have a specific reason not to.

### 9.4 Upgrade Categories

Upgrade types:

- Stat upgrades.
- Behavior modifiers.
- Evolutions.
- Economy upgrades.
- Mobility upgrades.
- Defense upgrades.
- Fuel upgrades.

Pulse Cannon upgrade examples:

- Fire rate.
- Damage.
- Projectile speed.
- Range.
- Pierce.
- Forked shots.
- Empowered every N shots.
- Plasma burn/corrosion.
- Impact knockback.
- Splash.
- Focus beam/lance evolution.

### 9.5 Upgrade Card Clarity

Upgrade cards should show exact mechanical impact.

Cards should show:

- Affected weapon/system.
- Current level.
- New level.
- Exact stat change.
- Tags.
- Evolution progress if relevant.

Example:

```text
Pulse Capacitor II
Primary / Pulse Cannon

Every 5th shot becomes empowered.
Empowered damage: 180 -> 240
Empowered radius: 10 -> 12
```

## 10. Economy and Progression

### 10.1 In-Run Resources

Primary resources:

- XP: immediate run upgrades.
- Scrap: repairs, rerolls, shops, mission rewards, permanent progression.
- Fuel: thrust-use resource and light route pressure.
- Rare parts: unlocks, evolutions, ships, cosmetics.

### 10.2 Fuel

Fuel should remain a small pressure layer, not the main run timer.

Fuel may be spent by:

- Active thrust.
- Active braking/strafe at a lower rate than main thrust.
- Boosting.
- Emergency warp.
- Long-range scanning.
- Eject support costs if the later design adds them.
- Special ship abilities.

Current tuning target:

- Starting fuel supports roughly 8 minutes of continuous main thrust.
- Maximum fuel investment supports roughly 35 minutes of continuous main thrust.
- Normal play should usually spend less than continuous-thrust math because coasting, combat positioning, and route choices create natural gaps.
- Fuel-empty behavior should leave limited emergency thrust instead of ending the run.

Fuel upgrade examples, if retained:

- Bigger tank.
- Efficient engines.
- Fuel from elite kills.
- Fuel from scrap.
- Emergency reserve.
- Lower boost cost.
- Black-hole fuel harvesting.

Later design note:

- Fuel may be removed from ship module upgrade progression entirely if it proves to be bookkeeping rather than meaningful pressure.
- Do not make fuel a large progression sink or a major difficulty gate.

### 10.3 Permanent Progression

Permanent progression should not make the unupgraded game feel bad.

Good permanent rewards:

- Ship unlocks.
- Starting weapon unlocks.
- Upgrade pool unlocks.
- Mission types.
- Sector modifiers.
- Cosmetics.
- Reroll economy.
- Small comfort upgrades.

Avoid relying on permanent progression as the primary difficulty balance.

## 11. Ships and Loadouts

Ships should have distinct identities.

Example ship identities:

- Interceptor: fast, precise, manual weapon focused, fragile.
- Bulwark: heavy, shield/ram focused, slower.
- Carrier: drone/auto-weapon focused, weaker direct fire.
- Engineer: scrap economy, deployables, repairs.
- Void Skiff: phase/dodge movement, high skill, low hull.

Each ship should define:

- Movement profile.
- Hull.
- Mass.
- Fuel efficiency.
- Starting weapon/loadout.
- Special mechanic or passive.
- Upgrade affinity.
- Visual silhouette.

## 12. Missions and Events

### 12.1 Mission Templates

Initial mission templates:

- Destroy Target.
- Recover Object.
- Survive Zone.
- Clear Stronghold.
- Hunt Rare Enemy.
- Investigate Signal.
- Assassinate Commander.
- Escape Pursuit.
- Destroy Mothership.

Mission modifiers:

- Black-hole instability.
- Heavy debris.
- Swarm response.
- Sniper presence.
- Shielded target.
- Fuel leak.
- Low visibility radar.
- Carrier reinforcements.

### 12.2 Rare Events

Rare events should create memorable stories and unlock opportunities.

Examples:

- Black-Hole Event.
- Thousand Swarm.
- Mothership Arrival.
- Dead Fleet.
- Command Net.
- Reactor Cascade.
- Sniper Constellation.
- Mirror Shield Convoy.
- Rare themed squad battles.

Rare events may unlock:

- Weapons.
- Ships.
- Cosmetics.
- Achievements.
- Codex entries.
- Upgrade branches.

## 13. Assets and Visual Pipeline

### 13.1 Asset Rule

Use SVG/vector-style assets as source, but cache them for runtime.

Allowed:

- SVG files as source art.
- TypeScript polygon definitions.
- Generated Phaser textures.
- Cached canvas textures.
- Baked PNG/WebP layers for expensive effects that are not black holes.

Avoid:

- Per-frame SVG parsing.
- Hundreds of active Phaser Graphics objects.
- Complex live vector redraws for many entities.
- Large black-hole line systems like the earlier laggy prototype.

### 13.2 Asset Categories

Vector/cached assets:

- Player ships.
- Enemy ships.
- Scrap.
- Projectiles.
- Pickups.
- UI icons.
- Mission icons.
- Upgrade icons.
- Telegraph elements.

Baked/cached effect assets:

- Black holes as simple generated/cached geometry.
- Large explosions.
- Energy storms.
- Massive aura fields.
- High-density particles.

### 13.3 Visual Language

Enemy silhouettes:

- Triangle/kite: fast chase.
- Long wedge: charge.
- Diamond: shooter.
- Hex/block: tank.
- Circle/core: exploder.
- Needle: sniper.
- Crescent/ring: shield/support.
- Cross: repair.
- Large bay body: carrier.

The same language should carry into minimap icons and UI whenever useful.

## 14. UI, HUD, and Player Information

The combat HUD should answer urgent questions:

- Hull/shield.
- Fuel.
- XP/level progress.
- Active weapon cooldowns.
- Scrap.
- Mission objective.
- Warning indicators.
- Minimap/radar.

Detailed build stats belong in:

- Upgrade screen.
- Pause screen.
- Ship/loadout screen.
- End-of-run report.

### 14.1 Minimap/Radar

Radar should show:

- Player.
- Enemy clusters.
- Elite/boss signatures.
- Objectives.
- Scrap/cache signals.
- Stronghold/mothership indicators.
- Danger zones.
- Black-hole anomalies.

Radar should support decisions without becoming a full omniscient map.

### 14.2 End-of-Run Report

Show:

- Time survived.
- Fuel used.
- Mission result.
- Enemies killed by type.
- Damage dealt by weapon.
- Damage taken by source.
- Scrap collected/spent.
- Unlock progress.
- Build summary.

## 15. Performance Rules

Performance should be part of design.

Use:

- Object pools for projectiles, pickups, particles, and temporary effects.
- Cached generated textures.
- Spatial queries for collision.
- Capped particles.
- Reduced offscreen effect updates.
- Low-frequency updates for distant world simulation.
- Debug profiler and smoke harnesses.

Avoid:

- Per-object expensive graphics redraws.
- Unbounded enemy/projectile counts without LOD.
- Per-frame allocations in hot loops.
- Always-on expensive debug overlays.

## 16. Implementation Phases

Each phase should be treated as a stable checkpoint. A phase may be split into smaller commits when needed.

Before coding any new feature or major change, Codex and the developer should have a short design dialogue. This dialogue is not mainly about programming. It is about what the feature should feel like, why it belongs in the game, how it should change player decisions, and what tradeoffs are acceptable.

For each phase, start by answering:

- What should the player feel or understand when this feature appears?
- What player decision does this feature create?
- What problem in the current game does this solve?
- What should this feature not become?
- What is the smallest playable version that proves the idea?
- How will we know from play, not just code, that it worked?

Codex should ask these design questions before implementation when the answers are not already clear in the prompt. The developer can answer briefly; the goal is clarity, not a long design meeting.

### Phase 0: Baseline and Documentation

Goal:

- Establish this document as the Starvivors 2.0 source of truth.
- Confirm the current build passes.
- Confirm GitHub push workflow.

Design dialogue before coding:

- What should this document be allowed to decide, and what should stay flexible?
- Which older docs are still useful reference, and which are superseded for 2.0 work?
- What level of detail is most useful for future Codex prompts?
- How strict should the phase order be?

Likely files:

- `Docs/STARVIVORS_2_0_GDD_AND_BUILD_PLAN.md`
- `Docs/README_FOR_CODEX.md`

Acceptance:

- GDD exists.
- Codex README points to the new GDD.
- `npm.cmd run build` passes if source files changed.
- Commit and push.

### Phase 1: Stabilize Current Playable Baseline

Goal:

- Make sure the current main game is usable before deeper conversion.

Design dialogue before coding:

- What currently feels best and must be preserved?
- What current systems feel temporary or awkward from a gameplay standpoint?
- Should the current main game remain playable as a legacy/classic mode during the 2.0 conversion?
- What is the minimum baseline experience that must never break?

Tasks:

- Audit current `GameScene.ts` entry flow.
- Confirm normal game opens.
- Confirm build command passes.
- Identify old enemy arrays and compatibility bridges still present.

Do not:

- Redesign gameplay yet.
- Delete compatibility code unless clearly unused and safe.

Acceptance:

- Normal game is buildable.
- Known risks are listed in a short doc note or task list.
- Commit and push.

### Phase 2: Pulse Cannon as Lab-Style Primary

Goal:

- Make left-click Pulse Cannon behave like the baseline direct-fire weapon.

Design dialogue before coding:

- Should Pulse Cannon be the player's default expression of skill, like aiming and shooting in an arcade space game?
- How lethal should the starting Pulse Cannon feel against early enemies?
- Should holding fire have any downside, such as heat or reduced precision, or should it be purely reliable?
- Should the ship always face the mouse while firing, or should movement and aim be more independent?
- What should make Pulse Cannon satisfying: speed, impact, sound, visual clarity, or upgrade scaling?

Tasks:

- Define live-game Pulse Cannon values.
- Decide combat-scale conversion from lab damage.
- Make left click/hold fire manually toward mouse/ship facing.
- Keep auto weapon slot separate.
- Ensure UI explains primary vs auto vs secondary.

Do not:

- Rewrite all weapons in this phase.
- Remove existing upgrade behavior until replacement is verified.

Acceptance:

- Holding left click fires steady Pulse Cannon shots.
- Shots travel cleanly toward aim direction.
- Build passes.
- Quick smoke check confirms firing works.
- Commit and push.

### Phase 3: Unified Projectile Runtime

Goal:

- Consolidate projectile update/collision behavior into one runtime.

Design dialogue before coding:

- What should make player projectiles feel different from enemy projectiles?
- Should projectiles be mostly fast and readable, or should some weapons fill space with slower hazards?
- How much should knockback, pierce, splash, homing, and status effects affect the feel of combat?
- Should debris and black holes interact with projectiles, or would that add clutter?
- What projectile behaviors are core to Starvivors and which are optional future spice?

Tasks:

- Define projectile runtime type.
- Move player/enemy projectile behavior toward shared update.
- Support radius, range, speed, damage, owner, pierce, knockback.
- Keep special behaviors as optional hooks.

Do not:

- Change every weapon's balance at once.
- Remove enemy projectiles until live parity exists.

Acceptance:

- Player and enemy projectiles use shared logic where practical.
- Existing weapons still work.
- Shared helper behavior remains compatible with the main game.
- Build passes.
- Commit and push.

### Phase 4: Unified Physics Body and Collision Model

Goal:

- Move gameplay objects toward consistent position/velocity/radius/mass rules.

Design dialogue before coding:

- How slippery should the player ship feel compared with enemies?
- Should ramming be a core combat style, an emergency option, or mostly a mistake?
- How much physical pushing should enemies apply to each other and the player?
- What should soft deconfliction feel like: command correction, formation discipline, or invisible physics?
- How close should collision match the visible hull before players call hits unfair?
- Should black holes feel predictable, chaotic, or somewhere between?

Tasks:

- Define common physical body interface or helpers.
- Standardize hard collision radius checks.
- Keep soft enemy deconfliction.
- Route knockback, black-hole force, ramming, and explosion push through consistent velocity channels.

Do not:

- Introduce large invisible collision bubbles.
- Rewrite all asteroid/debris behavior in one unsafe pass.

Acceptance:

- Player/enemy/projectile collision feels fair.
- Enemy stacking remains reduced.
- Ramming and black-hole effects still work.
- Collision debug overlay shows useful information.
- Build passes.
- Commit and push.

### Phase 5: Finish Unified Enemy Runtime

Goal:

- Complete the replacement of old chaser/shooter/tank implementation with the lab-style runtime.

Design dialogue before coding:

- Which lab enemies deserve to become normal early-game enemies first?
- Which enemies should be rare, elite, mission-only, or event-only?
- How much enemy variety is fun before it becomes unreadable?
- Should support enemies appear early to teach priority targeting, or later as advanced pressure?
- How should rewards differ between small drones, heavy enemies, support enemies, and carriers?

Tasks:

- Remove live dependency on old enemy arrays where safe.
- Keep old files only as reference or remove after verification.
- Ensure all live enemies use definitions and behavior handlers.
- Ensure rewards, death effects, minimap, collision debug, combat feedback, and projectiles work.

Do not:

- Delete code that is still used by tests/harnesses without replacing it.

Acceptance:

- Main game uses unified enemy list.
- Old enemy sprites are not required.
- Shared enemy definitions feed the live game.
- Build passes.
- Commit and push.

### Phase 6: Encounter and Squad Director

Goal:

- Replace simple enemy waves with squad/encounter spawning.

Design dialogue before coding:

- What should each squad teach or pressure the player to do?
- Should squads feel like natural patrol groups, tactical formations, or arcade enemy packs?
- How often should the player face mixed-role encounters versus simple swarms?
- Should the game announce dangerous squads, or should players discover them visually/radar-first?
- What makes a squad memorable without making the screen noisy?

Tasks:

- Create encounter definitions.
- Spawn Scout Pack, Gunner Escort, Strike Wing, Carrier Group, Support Group, Sniper Screen based on progression.
- Keep simple ambient spawning as fallback.
- Add debug controls for spawning squads in live game if useful.

Do not:

- Implement full world generation yet.

Acceptance:

- Main game can spawn role-based squads.
- Difficulty comes more from composition than raw stats.
- Build passes.
- Commit and push.

### Phase 7: Controlled Movement, Fuel Use, and Run-End Prototype

Goal:

- Add fuel as a thrust-use pressure layer while shifting the baseline flight model from full drift to normal movement with light drift.

Design dialogue before coding:

- Should fuel feel like battery, maneuvering propellant, travel range, or mission budget?
- Is fuel adding useful pressure without becoming the main run timer?
- What should happen emotionally when fuel gets low: panic, planning, risk-taking, or route pressure?
- Should boosting spend fuel, or would that punish fun movement too much?
- Should running out of fuel kill the run, trigger emergency drift, summon rescue, or create a last-chance state?
- How much drift should remain on the Interceptor as the baseline ship?
- How much extra momentum should Bulwark preserve before it becomes hard to control?

Tasks:

- Apply normal coasting damping so ships no longer drift indefinitely.
- Keep Interceptor more stable and Bulwark slightly more momentum-heavy.
- Add fuel stat to run state.
- Drain fuel only from active thrust/strafe/brake usage.
- Keep main thrust as the primary drain and support movement as lighter drain so movement still feels good.
- Tune starting fuel to roughly 8 minutes of continuous main thrust, with fuel-stat upgrades reaching roughly 35 minutes at cap.
- Display fuel in HUD.
- Use a first fuel-empty behavior: emergency thrust state rather than instant death.
- When fuel is empty, all player thruster power drops by 90%, leaving 10% emergency mobility so the player can still drift, fight, and reach powerups, scrap, or future fuel cells.
- Add a simple prototype run-end condition.

Do not:

- Redesign all progression rewards in this phase.
- Add the later full-drift shop/module system yet.

Acceptance:

- Interceptor movement is controlled with slight drift.
- Bulwark preserves more momentum than Interceptor without feeling uncontrollable.
- Fuel is visible and reacts only to thrust usage.
- Fuel creates light movement and route pressure without functioning as a passive timer.
- A prototype run-end path can end a run.
- Build passes.
- Commit and push.

### Phase 8: Larger Sector Map

Goal:

- Increase the world size safely and verify traversal/camera/minimap behavior.

Design dialogue before coding:

- How large should space feel before it becomes empty or tedious?
- How long should it take to cross the sector at normal speed?
- Should large maps encourage exploration, avoidance, hunting, or all three?
- What should keep the player oriented: radar, landmarks, signals, stars, or mission markers?
- Should wrapping remain obvious and arcade-like, or should a large sector feel less like an arena?

Tasks:

- Add configurable sector size.
- Test 2x, 3x, and 5x map scale.
- Tune camera follow/look-ahead.
- Ensure toroidal wrapping and mirrors still work.
- Ensure starfield movement reads at larger scale.

Do not:

- Add full procedural generation yet.

Acceptance:

- Large map is playable.
- Minimap/radar remains useful.
- Performance remains acceptable.
- Build passes.
- Commit and push.

### Phase 9: Sector Generation V1

Goal:

- Generate simple sector regions.

Design dialogue before coding:

- What kind of sector should the player believe they entered: battlefield, salvage field, enemy territory, anomaly zone, or frontier?
- Which regions should be safe, risky, rewarding, or nearly suicidal?
- How much randomness is good before the world feels shapeless?
- Should the player see region danger before entering, or learn by scouting?
- What is the smallest sector layout that creates real route decisions?

Tasks:

- Add seeded or semi-random sector layout.
- Place debris fields.
- Place asteroid clusters.
- Place scrap pockets.
- Place enemy territory markers.
- Place mission/event signal placeholders.

Do not:

- Build every mission type yet.

Acceptance:

- Each run has a different but readable sector layout.
- Regions affect gameplay.
- Build passes.
- Commit and push.

### Phase 10: Roaming Squads and World Population

Goal:

- Make enemies live in the world instead of only spawning near the player.

Design dialogue before coding:

- Should roaming squads feel like animals, military patrols, pirates, machines, or something else?
- How far should enemies pursue before giving up?
- Should enemies call nearby allies, and if so, how obvious should that be?
- Should strong enemy territory be avoidable for weaker builds?
- What makes the world feel alive without making it unfair?

Tasks:

- Add world squad instances.
- Give squads positions, states, and behavior.
- Support patrol, roam, guard, pursue, and disengage states.
- Use lower-frequency updates for distant squads if needed.

Do not:

- Simulate every distant enemy at full fidelity if performance suffers.

Acceptance:

- Player can encounter roaming squads.
- Squads can exist away from the player.
- Performance remains acceptable.
- Build passes.
- Commit and push.

### Phase 10.5: Scrap Rollup and Loot Performance

Goal:

- Keep scrap plentiful and valuable while reducing pickup, debris, and visual-object lag during large kill chains.

Design dialogue before coding:

- Scrap should remain a resource and should also become the source of XP.
- Enemy kills and destroyed hazards should create scrap, and collecting that scrap should grant XP.
- Scrap should visibly burst from kills, then combine only after it has been off screen for a while.
- If pickup counts hit a hard cap, off-screen scrap can combine faster to protect performance.
- Higher-value scrap should be readable through color and cluster shape, not by removing reward value.

Tasks:

- Add tiered scrap visuals.
- Add delayed off-screen scrap rollup that conserves total scrap value.
- Move XP gain from direct kills and asteroid destruction onto scrap collection.
- Keep upgrade crates and rare pickups separate from scrap rollup.
- Document remaining debris, death-shard, pooling, and data-only off-screen pickup work.

Do not:

- Silently delete scrap value as a performance fix.
- Merge on-screen scrap during normal play.
- Solve every debris and particle performance issue in this first pass.

Acceptance:

- Scrap collection grants both resource scrap and XP.
- Enemy and hazard destruction rewards flow through scrap pickup collection.
- Tier 2 scrap covers values 5-25.
- Off-screen scrap can roll up into higher-value pickups after a delay.
- Build passes.
- Commit and push.

### Phase 10.6: Asteroid and Debris Performance

Goal:

- Prevent large asteroid bursts and debris fields from locking the game while preserving hazard danger and scrap value.

Design dialogue before coding:

- Asteroids should break apart when the scene is calm, but mass destruction should stay inside active-count budgets instead of spawning unbounded fragments.
- Suppressed asteroid fragments should not become extra scrap; asteroid rewards come from destroyed hazards, while offscreen asteroid clutter is handled through tier coalescing.
- Asteroid-vs-asteroid damage should remain, but use simple tier attack rolls on cooldown instead of mass/velocity impact damage.
- Weapons should damage asteroids without accelerating them.
- Debris should be a deliberate world hazard, not a persistent loot drop from every enemy death.
- Visual effects should scale down during large bursts before they threaten frame time.
- Spatial filtering should be used before exact asteroid/debris collision checks.

Tasks:

- Remove persistent debris spawning from normal enemy deaths.
- Keep debris as a destructible hazard that can reward scrap.
- Add asteroid breakup soft/hard caps and burst protection. Defaults are 500 soft cap, 500 hard cap, and 250 destructions per 500ms for burst protection.
- Add asteroid tiers 1-10 with increasing size, HP, contact damage, and collision attack damage.
- Widen the upper-tier asteroid size curve so T10 reads as a giant hazard and T6-T9 step upward more clearly.
- Replace asteroid-vs-asteroid mass/velocity damage with cooldown-gated randomized tier damage while preserving bounce/separation.
- Use tier-weighted asteroid collision response so small tiers cannot shove large tiers around like equal bodies.
- Untangle asteroid-to-player hull damage from generic momentum impact damage; use asteroid tier contact damage for hull/shield contact while keeping physics for bounce/separation.
- Remove generic player-body momentum damage against asteroids so ramming shield remains the intentional ship ram damage path.
- Update high-tier breakup recipes so T6-T10 skip adjacent-tier fragments and break into visibly smaller asteroids.
- Keep normal asteroid breakup recipes at five or more fragments, with performance pressure still allowed to suppress actual spawned fragments.
- Replace always-even radial fragment motion with cheap spawn-time breakup motion patterns: crumble, shear, split, and rare burst.
- Lower default fragment burst speed and increase parent velocity inheritance so most breakups stay constrained.
- Tune asteroid-vs-asteroid damage so same-tier collisions take multiple cooldowns, and give fresh fragments a short collision-damage grace period after breakup.
- Add large-asteroid breakup smoothing with a fading parent ghost and fragment grow-in visuals for T5-T10.
- Add a debug Visuals toggle for asteroid damage flashes so impact feedback can be tested with or without sprite flashing.
- Keep asteroid hit impact feedback compact and independent from asteroid tier size; scale it only from projectile hit radius when applicable.
- Stop projectile hits from accelerating asteroids.
- Coalesce offscreen small asteroids with the recipe `10x Tn -> 1x T(n+1)`, with emergency cleanup under high asteroid pressure.
- Throttle asteroid death shards under heavy pressure independently from fragment burst protection.
- Add toroidal spatial collision filtering for asteroid/debris world impacts.
- Add `?testHarness=phase10_6`.

Do not:

- Delete asteroid or scrap reward value as a performance fix.
- Remove asteroid fragmentation entirely during normal play.
- Make debris disappear as a hazard type.

Acceptance:

- Destroying many tier-5 asteroids quickly stays within the asteroid hard cap.
- Suppressed fragments do not become bonus scrap.
- Offscreen small asteroids coalesce into higher tiers over time.
- Normal enemy deaths do not create persistent debris.
- Build passes.
- Commit and push.

### Phase 11: Mission Framework

Goal:

- Add mission/contract selection and guaranteed objective placement.

Design dialogue before coding:

- What should a mission promise the player: specific reward, specific threat, specific story, or specific playstyle?
- Should mission difficulty be obvious before launch?
- Should the player be able to fail forward, retry, or abandon with partial rewards?
- Should missions be short jobs, long expeditions, or both?
- What mission type best proves the new open-sector loop first?

Tasks:

- Create mission definition type.
- Create mission generator.
- Add mission selection UI placeholder.
- Place guaranteed objective in generated sector.
- Track mission state.
- Support success/failure.

Do not:

- Build a polished mission UI yet.

Acceptance:

- Player can start a run with a selected mission.
- Mission objective exists in the world.
- Completion is detected.
- Build passes.
- Commit and push.

### Phase 12: Stronghold and Mothership Prototype

Goal:

- Add first world anchor encounter.

Design dialogue before coding:

- Should a stronghold be something the player raids, avoids, farms, or destroys?
- Should a mothership feel like a boss, a moving base, or a world event?
- What warning should tell the player they are entering a high-threat area?
- How much of the encounter should be about killing guards versus attacking weak points/objectives?
- What reward is big enough to justify the risk?

Tasks:

- Prototype stronghold or mothership.
- Add guard squads.
- Add spawn bays or reinforcements.
- Add reward drop.
- Add minimap/radar signal.

Do not:

- Build final boss art or final balance yet.

Acceptance:

- Player can find and fight a stronghold/mothership encounter.
- Encounter uses existing enemy/squad systems.
- Build passes.
- Commit and push.

### Phase 13: Rare Event Framework

Goal:

- Add framework for unusual high-value sector events.

Design dialogue before coding:

- What should make rare events feel special: visual spectacle, danger, reward, enemy composition, or unlocks?
- How rare should rare events be in normal free-range play?
- Should the player be able to opt into rare events, or can they happen to the player?
- Should black-hole events be scary hazards, treasure opportunities, boss arenas, or all three?
- What event would players tell stories about after the run?

Tasks:

- Create rare event definition type.
- Add event spawn rules.
- Implement one black-hole event.
- Implement one swarm event or themed squad event.
- Add rewards/unlock hooks.

Do not:

- Add many rare events before the framework is stable.

Acceptance:

- Rare event can spawn.
- Event has clear signal, danger, and reward.
- Build passes.
- Commit and push.

### Phase 14: Economy and Reward Loop

Goal:

- Connect XP, scrap, fuel, rare parts, unlocks, and mission rewards.

Design dialogue before coding:

- What should scrap mean to the player: money, repair material, crafting salvage, or permanent progress?
- Should XP and scrap create different decisions, or do they overlap too much?
- Should rare parts be deterministic mission rewards or low-chance drops?
- What should the player spend resources on during a run versus after a run?
- How do we avoid permanent progression making early runs feel weak on purpose?

Tasks:

- Define resource ownership.
- Add reward resolver.
- Add in-run scrap uses.
- Add permanent unlock storage.
- Add unlock triggers for missions/events.

Do not:

- Create grind-heavy permanent stat bloat.

Acceptance:

- Completing objectives gives meaningful rewards.
- Unlock progress persists.
- Build passes.
- Commit and push.

### Phase 15: Ship Identity and Loadout Screen

Goal:

- Make ships meaningfully different.

Design dialogue before coding:

- What fantasy should each ship sell in the first five seconds?
- Should ships have strong tradeoffs, or should they all remain broadly usable?
- How much should starting loadout define a ship versus ship movement/passive mechanics?
- Should new players start with the most balanced ship or the most fun ship?
- What ship identities should exist before adding more content?

Tasks:

- Define ship stat profiles.
- Define starting loadouts.
- Add ship passives or special mechanics.
- Improve loadout screen.
- Ensure ship visuals use the vector/cached asset direction.

Do not:

- Add too many ships before three core identities are fun.

Acceptance:

- At least three ships have distinct playstyles.
- Loadout screen clearly communicates differences.
- Build passes.
- Commit and push.

### Phase 15.5: 2.0 Loop Rebaseline

Goal:

- Re-center the current build on the intended 2.0 run loop before adding more asset, UI, audio, balance, or content work.

Current priority list:

1. Add a clear Free Range run option alongside mission contracts.
2. Change mission completion so it marks the objective complete and rewards the player, then lets the player keep exploring unless the mission explicitly ends the run.
3. Keep fuel as thrust-use-only pressure: no passive timer drain, starting at about 8 minutes of continuous main thrust and scaling toward about 35 minutes at max fuel investment.
4. Remove the world extraction beacon; voluntary run end should come from the ship dashboard EJECT action with confirmation.
5. Improve HUD/results language so the player can immediately understand run mode, objective state, eject/death state, fuel state, and earned rewards.
6. Add or update smoke harness coverage for Free Range start, mission completion without immediate run end, fuel thrust-only drain, eject confirmation/cancel/confirm, and blocked post-run continuation.

Do not:

- Add more ships, enemies, missions, rare events, or permanent upgrades during this rebaseline.
- Move into broad Phase 16 art conversion until the run loop is coherent.
- Reintroduce passive fuel drain.
- Make fuel a large progression sink.

Acceptance:

- Player can choose Free Range or a mission.
- Mission completion does not automatically force results except for explicitly terminal mission types.
- Fuel only drains from thrust usage and fuel-empty behavior remains emergency mobility.
- Eject cleanly ends the run without requiring a map beacon.
- Results explain whether the player ejected, completed a mission, died, or left early.
- Build passes.
- Commit and push.

### Phase 16: SVG/Vector Asset Pipeline

Goal:

- Establish final asset direction without hurting performance.

Design dialogue before coding:

- What should Starvivors look like at a glance: neon vector arcade, tactical radar, clean sci-fi, or something else?
- Which assets need crisp SVG/vector identity most: ships, enemies, scrap, UI, projectiles, or effects?
- Which effects should stay baked/cached because they are too expensive live?
- How much visual detail is useful before readability suffers?
- Should cosmetics be recolors, alternate silhouettes, trails, engine effects, or full skins?

Tasks:

- Decide storage format: `.svg`, TypeScript vector definitions, or both.
- Use **Neon-Forward Salvagepunk** as the locked art theme for AI asset generation: neon energy dominates the first read, salvage/steampunk machinery supports silhouette and texture.
- Continue the Asset Forge as a main-game asset pipeline so assets can be generated, previewed, exported, reviewed, and promoted from structured vector recipes.
- Create generated texture registry.
- Convert scrap to vector/cached texture.
- Convert player ships to vector/cached texture.
- Keep black holes as simple generated/cached geometry; keep other expensive effects baked/cached.

Do not:

- Render high-detail vector art live every frame.

Acceptance:

- At least one player ship, scrap pickup, enemy, projectile, and UI icon use the new pipeline.
- Performance remains acceptable.
- Build passes.
- Commit and push.

### Phase 17: UI/HUD/Map/Results Pass

Goal:

- Make the new run structure understandable.

Design dialogue before coding:

- What does the player need to know every second during combat?
- What information should be hidden until radar/scanning reveals it?
- Should mission guidance feel like a cockpit HUD, a contract tracker, or arcade prompts?
- How much minimap detail is helpful before it becomes distracting?
- What should the end-of-run screen teach the player about their build and death?

Tasks:

- Add fuel to HUD.
- Add mission tracker.
- Improve minimap/radar.
- Add sector signal indicators.
- Add end-of-run report.
- Add build summary.

Do not:

- Fill combat view with nonessential text.

Acceptance:

- Player can understand objective, fuel, danger, and rewards.
- End-of-run report explains what happened.
- Build passes.
- Commit and push.

### Phase 18: Audio, Game Feel, and Accessibility

Goal:

- Improve feedback and usability.

Design dialogue before coding:

- Which enemy actions need audio cues because they can kill quickly?
- How much screen shake is exciting before it interferes with aiming?
- Should accessibility options change difficulty, readability, or both?
- What should damage, pickups, upgrades, and rare events sound like emotionally?
- How can effects make the game feel better without reducing visual clarity?

Tasks:

- Add or improve audio categories.
- Add enemy telegraph cues.
- Tune impact effects.
- Add reduced screen shake option.
- Add high-contrast telegraph option.
- Add aim assist or auto-fire accessibility options if desired.

Do not:

- Add noisy effects that reduce readability.

Acceptance:

- Dangerous actions are easier to read.
- Combat feels better without becoming cluttered.
- Build passes.
- Commit and push.

### Phase 19: Balance and Content Expansion

Goal:

- Expand after the architecture is stable.

Design dialogue before coding:

- What content would most improve replayability next: missions, ships, weapons, enemies, rare events, or cosmetics?
- Which player builds are under-supported?
- Which enemies create the best stories and should get variants?
- What unlocks should be achievement-based versus progression-based?
- What should be added only after the core loop is proven?

Tasks:

- Add more missions.
- Add more rare events.
- Add more ships.
- Add more weapons.
- Add more upgrades/evolutions.
- Add cosmetics and achievements.
- Tune sector generation and rewards.

Acceptance:

- New content is mostly data-driven.
- Each addition has clear gameplay purpose.
- Build passes.
- Commit and push.

## 17. Open Questions

These should be answered before or during the relevant phase.

1. Should classic survival mode remain as a separate mode, or should Starvivors 2.0 fully replace it?
2. Should fuel remain in ship/module upgrade progression long term, or be removed after the core loop is proven?
3. Should EJECT remain a pure player-triggered run end, or should some mission/event types force it?
4. Should failed mission contracts be retryable from results, or always require a fresh run?
5. Should SVG assets live as actual `.svg` files, TypeScript vector data, or both?
6. How low should player health be relative to enemy damage in the new quick-death model?
7. Should black holes be rare sector events, recurring hazards, or both?
8. Should permanent progression unlock options only, or also include small stat upgrades?
9. Should mission rewards be known before launch or partially hidden until discovery?
10. Should sectors have named factions/biomes later?

## 18. Commit Protocol

Use this protocol at the end of each phase or stable subphase.

1. Check status:

```powershell
git status --short
```

2. Run build:

```powershell
npm.cmd run build
```

3. If appropriate, run dev smoke check.
4. Stage intended files:

```powershell
git add -A
```

5. Commit:

```powershell
git commit -m "Short phase summary"
```

6. Push:

```powershell
git push origin main
```

If the working tree contains unrelated user changes, do not revert them. Either leave them unstaged or ask how to proceed.

## 19. Definition of Done for Starvivors 2.0 Prototype

The Starvivors 2.0 prototype is successful when:

- The player can choose a ship/loadout.
- The player can choose free range or a mission.
- The game generates a large sector.
- Fuel creates light thrust-use pressure without passive timer drain.
- Enemies live in the world as squads and anchored encounters.
- The player can find signals, scrap, enemies, events, and objectives.
- Combat uses readable polygon/vector enemies.
- The Pulse Cannon feels like the baseline direct-fire weapon.
- Physics/collision feel consistent and fair.
- Rare events can appear.
- At least one stronghold or mothership encounter exists.
- At least one mission can be completed.
- Rewards/unlocks persist.
- The game builds cleanly.
- The implementation is committed and pushed in stable phases.

## 20. Future Systems and Content Expansion Backlog

Use this section for expansion ideas that should not interrupt the current phase order. Items here are candidates for later shop content, sector loot, mission rewards, rare event rewards, or permanent unlocks after the core 2.0 loop is proven.

### Movement and Drift Modifiers

- Full Drift Module: restores a higher-inertia Asteroids-style drift profile for players who want a high-skill movement build.
- Stabilizer Module: increases coasting damping and braking control for safer navigation.
- Bulwark Momentum Kit: preserves heavy-ship momentum while improving recovery after rams.
- Precision Thrusters: lowers drift while aiming/firing, useful for Pulse Cannon builds.

### Fuel Expansions

- Fuel Tank upgrades: increase maximum fuel for longer routes.
- Efficient Thrusters: reduce active-thrust fuel drain.
- Emergency Thruster upgrades: improve fuel-empty emergency thrust above the baseline 10% power without restoring full mobility.
- Emergency Reserve: grants a one-time fuel buffer when the tank hits zero.
- Fuel Siphon: recover small fuel amounts from elite enemies, wreckage, or specific objectives.
- Eject Support: optional late-game tuning for making voluntary run end safer or more rewarding, without restoring a world beacon.

### World Fuel Drops and Sector Resources

- Fuel cells can appear as rare world drops, especially near salvage fields, strongholds, or dead fleet events.
- Fuel caches can be marked by signal pings and create route decisions under pressure.
- Dangerous fuel pickups can sit inside enemy patrol zones or black-hole hazard regions.
- Mission contracts can guarantee fuel cache spawns when the objective requires longer travel.

### Shop and Mission Reward Candidates

- Shop items can temporarily change movement feel for a run, including full drift, stabilizers, or fuel-efficient flight.
- Mission rewards can unlock new fuel economy modifiers.
- Rare events can grant experimental movement/fuel modules with strong upside and clear drawbacks.
