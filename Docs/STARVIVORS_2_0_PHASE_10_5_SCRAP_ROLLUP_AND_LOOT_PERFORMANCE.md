# Starvivors 2.0 Phase 10.5 Scrap Rollup and Loot Performance

Phase 10.5 keeps scrap plentiful while reducing lag from large kill chains.

## Implementation Notes

- Scrap now has tiered visuals:
  - Tier 1: single cyan shard, 1-4 scrap.
  - Tier 2: green cluster, 5-25 scrap.
  - Tier 3: gold cluster, 26-75 scrap.
  - Tier 4: red cluster, 76+ scrap.
- The old tier 3 and tier 4 plate/core concepts were removed in favor of color variants of the tier 2 cluster shape.
- Scrap pickup art now uses baked PNG textures with the glow included, reducing each pickup body from glow plus image to a single image child.
- Scrap collection grants both run scrap and XP. Enemy kills and asteroid destruction no longer grant XP directly.
- XP from scrap is currently `scrap value x3`, then run growth modifiers apply through the normal XP grant path.
- Dynamic scrap can roll up only after it has been off screen for a delay:
  - Normal rollup starts above the soft pickup limit and requires 5 seconds off screen.
  - Emergency rollup starts near the hard pickup limit and requires 1.5 seconds off screen.
- Rollup conserves scrap value by adding the source pickup value into another off-screen scrap pickup.
- Sector-generated scrap, magnetized scrap, upgrade crates, and rare upgrade pickups are excluded from rollup.
- The minimap colors scrap dots by tier.
- Phase 10.5 verification is available with `?testHarness=phase10_5`.

## Deferred

- Full data-only off-screen pickup storage.
- Object pooling for scrap, debris, and death shards.
- Debris active-simulation culling.
- Death-shard throttling during mass kills.
- Clustered minimap markers for large off-screen scrap piles.
