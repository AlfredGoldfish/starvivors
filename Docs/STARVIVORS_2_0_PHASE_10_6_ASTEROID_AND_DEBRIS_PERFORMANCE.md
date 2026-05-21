# Starvivors 2.0 Phase 10.6 Asteroid and Debris Performance

Phase 10.6 protects the game from lockups during large asteroid bursts and removes persistent enemy-death debris spam.

## Implementation Notes

- Enemy deaths no longer spawn persistent wreckage debris.
- Enemy death visuals still use short-lived shards, while debris remains available as a world hazard that can be destroyed for scrap.
- Asteroid breakup now has active-count and burst budgets:
  - Soft asteroid pressure starts at 500 active asteroids.
  - Hard asteroid pressure caps active asteroid fragments at 500.
  - More than 250 asteroid destructions in 500ms triggers burst protection.
- The debug menu Spawns tab now exposes live numeric controls for asteroid breakup soft cap, hard cap, burst limit, and asteroid spawn count. Each stress-test value can be typed up to 1000.
- Asteroids now support tiers 1-10. Higher tiers reuse the existing asteroid art at larger sizes until dedicated art is authored.
- The default upper-tier size curve was widened: T10 is now a true giant tier at double its previous visual diameter, while T6-T9 were increased more moderately.
- Asteroid-vs-asteroid collisions still bounce and can damage each other, but damage is now a simple randomized tier attack roll on cooldown instead of mass/velocity impact damage. Same-tier collisions are tuned to take multiple cooldowns instead of usually one-shotting.
- Asteroid-vs-asteroid movement response now uses simple tier-weighted collision mass, so small asteroids bounce off large tiers instead of launching them.
- Asteroid-to-player hull contact damage now uses `ASTEROID_CONTACT_DAMAGE_BY_TIER` directly instead of generic momentum impact damage caps/scales. Collision physics still handles bounce and separation.
- Normal player body contact no longer damages asteroids through generic momentum impact damage; ramming shield remains the dedicated ship ram damage path.
- High-tier breakup recipes now skip adjacent-tier fragments, so large asteroids break into meaningfully smaller hazards instead of replacing themselves with near-equal sizes.
- Normal asteroid breakup recipes now produce at least five fragments. Active-count and burst pressure can still suppress spawned fragments when performance protection is engaged.
- Fragment motion now uses cheap spawn-time breakup patterns instead of always-even radial spread:
  - `crumble`: tight, low-speed cluster.
  - `shear`: constrained movement along a fracture line.
  - `split`: two rough lobes.
  - `burst`: rarer radial explosion.
- Fragment motion inherits more parent velocity and uses lower burst speed by default, so breakups feel less normalized and less explosive without adding runtime systems.
- Fresh asteroid fragments get a short asteroid-collision damage grace period so breakup pieces can separate before applying chain collision damage.
- Large asteroid breakups keep a short fading parent ghost and grow fragments in visually, making T5-T10 breakups read less like the parent asteroid vanished instantly.
- The debug menu Visuals tab can toggle asteroid damage flashes independently from impact movement and collision response.
- Asteroid hit impact feedback no longer scales from asteroid tier size. The default impact spark stays compact and only scales when a larger projectile hit radius is supplied.
- Weapon hits damage asteroids but no longer accelerate them, preventing player fire from stirring asteroid fields into high-speed collision storms.
- Suppressed asteroid fragments are no longer converted into extra scrap; scrap comes from destroyed hazards, while clutter reduction is handled by asteroid coalescing.
- Offscreen small asteroids can coalesce over time using the tier recipe `10x Tn -> 1x T(n+1)`, with faster cleanup under emergency asteroid pressure.
- Under heavy asteroid pressure, death-shard emission is skipped while the normal breakup feedback remains.
- Asteroid death-shard throttling is independent from fragment burst protection, so the 250-destruction burst setting does not allow hundreds of shard effects at once.
- Asteroid-to-asteroid, enemy-to-asteroid, enemy-to-debris, and asteroid-to-debris collision checks now use a lightweight toroidal spatial hash before exact collision tests.
- Phase 10.6 verification is available with `?testHarness=phase10_6`.

## Gameplay Intent

- Asteroid belts should stay dangerous and rewarding without multiplying into an unbounded object storm.
- Destroying many large asteroids at once should preserve direct hazard rewards without converting cleanup math into extra scrap.
- Dense offscreen fields should gradually consolidate into fewer, larger hazards instead of staying as hundreds of small collision bodies.
- Debris should be intentional sector hazard content, not routine loot clutter from every enemy kill.

## Deferred

- Authoring explicit debris hazard fields in sector generation.
- Object pooling for asteroid fragments, debris, and death shards.
- More nuanced asteroid breakup profiles for special regions.
- Clustered minimap markers for dense off-screen hazard fields.
