# Enemy Stat Profile Followups

The first enemy stat profile pass moved current enemy values into data and routed the behavior that already existed. Some stats were added as future hooks but were intentionally not made active yet.

## Prepared But Not Fully Used

- `acceleration`
- `turnRate`
- `collisionKnockback`
- `attackRange`
- `aggression`
- `retreatThreshold`
- `strafeBias`
- `orbitBias`
- `burstCount`
- `spread`
- `scrapDropChance`

## Why These Were Deferred

The current enemy AI is still simple:

- Chasers move directly toward the player.
- Shooters maintain a rough preferred range and fire one projectile.
- Tanks move directly toward the player.

Wiring the future-facing stats now would require changing enemy AI behavior, spawn/combat feel, or reward logic. That was outside the stat-profile task.

## Good Next Uses

Use `acceleration` when enemy movement changes from instant velocity setting to acceleration-based steering.

Use `turnRate` when enemy facing becomes limited instead of instantly rotating toward movement or aim direction.

Use `collisionKnockback` when contact collision response becomes enemy-specific instead of shared by broad enemy type.

Use `attackRange`, `aggression`, `retreatThreshold`, `strafeBias`, and `orbitBias` when enemy AI gets behavior states such as chase, hold range, retreat, orbit, or flank.

Use `burstCount` and `spread` when shooter-style enemies support burst fire or multi-shot attacks.

Use `scrapDropChance` when rewards stop being guaranteed and move to probability-based drops.

## Keep Separate From Player Stats

Enemy profiles should stay separate from the player stat sheet. Enemies need AI and identity stats, while the player uses broad progression stats.
