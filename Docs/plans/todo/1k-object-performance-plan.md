# 1k Object Performance Plan

Goal: support stress-test scenarios with up to roughly 1,000 active gameplay objects without visible frame lag.

## Main Bottleneck To Address

The profiler report showed `player-projectiles` becoming expensive when active projectiles reached roughly 200-280. The likely cause is broad collision scanning: each projectile checks too many possible targets every frame.

## Priority Fixes

1. Add a spatial hash/grid broad phase.
   - Index enemies, asteroids, debris, pickups, and other collidable bodies by world cell.
   - Query only nearby cells for projectile hits and physical impact checks.
   - Handle arena wrapping inside the query helper.

2. Split profiler detail inside `player-projectiles`.
   - Measure movement, black hole/gravity, trail emission, enemy checks, asteroid checks, debris checks, mirror updates, and cleanup separately.
   - Use this before and after broad-phase work to confirm the actual win.

3. Add object pooling.
   - Pool projectiles, enemy projectiles, damage numbers, death shards, debris, and short-lived effects.
   - Avoid frequent Phaser object creation/destruction during high-count combat.

4. Add dynamic visual budgets.
   - Reduce trails, damage numbers, health bars, death shards, and collision-debug redraws when object counts are high.
   - Keep gameplay simulation accurate while lowering visual-only cost.

5. Time-slice noncritical UI/debug systems.
   - Update minimap, debug text, and debug menu values at lower rates.
   - Avoid refreshing debug UI every frame unless a value actually changed.

## Acceptance Target

- 1,000 active simple gameplay objects should remain playable.
- P95 frame time should stay near or below 16.7ms on the target dev machine.
- Worst-frame spikes should identify a specific subsystem rather than broad unmeasured overhead.

## Notes

1,000 fully effect-heavy Phaser objects may still require stricter visual caps. The first target is 1,000 gameplay objects with controlled visual effects.
