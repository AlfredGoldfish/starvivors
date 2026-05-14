# Damage Feedback and Impact Effects Handoff

This note captures the recent damage-readability work so future prompts can refer to the current implementation clearly.

## Current Design Terms

- Direct damage feedback: the damaged object briefly flashes as a white version of itself, similar to Vampire Survivors.
- Bullet impact explosion: a small, sharp burst at the projectile hit point.
- Collision impact explosion: a broader physical contact burst at the collision/contact point between bodies.
- Breakup feedback: the larger asteroid destruction/breakup effect that happens when an asteroid is destroyed and may fragment.

## Current Implementation

All current logic lives in `src/scenes/GameScene.ts`.

### Direct Damage Feedback

- `flashDamageSprites(...)`
- Used on surviving enemy ships and asteroids when they are damaged by the player Pulse Cannon.
- Applies a short white `setTintFill(0xffffff)` flash to the canonical sprite and its visual-only toroidal mirror.
- Does not affect HP, collision, XP, movement, or gameplay state.
- Player damage feedback remains separate in `emitPlayerDamageFeedback(...)` and still uses the existing player red damage visual.

### Ship Bullet Impact Explosion

- `emitShipBulletImpactExplosion(x, y)`
- Used when a projectile hits a ship.
- Current triggers:
  - Player Pulse Cannon hits Chaser enemies.
  - Player Pulse Cannon hits Shooter enemies.
  - Shooter enemy projectiles hit the player.
- Visual language:
  - Small, sharp, bright spark/flash.
  - White/yellow/cyan palette.
  - Short duration and tight radius.
- Purpose:
  - Reads as a weapon/projectile hit, separate from crash/contact feedback.

### Ship Collision Impact Explosion

- `emitShipCollisionImpactExplosion(x, y)`
- Used when the player physically collides with a Chaser enemy.
- Visual language:
  - Warmer red/orange/yellow hull sparks.
  - Slightly broader and softer than ship bullet impact.
- Gated by player invulnerability/contact damage timing so it does not spam every frame while objects overlap.
- Purpose:
  - Reads as ship/body contact rather than a bullet hit.

### Asteroid Impact Explosion

- `emitAsteroidImpactExplosion(x, y, tier)`
- Used for asteroid impacts.
- Current triggers:
  - Player Pulse Cannon hits an asteroid.
  - Player physically collides with an asteroid.
- Visual language:
  - Pale flash/ring with tan/gray chip and dust particles.
  - Scales modestly by asteroid tier.
- This is impact feedback, not asteroid destruction feedback.

### Asteroid Breakup Feedback

- `emitAsteroidBreakupFeedback(x, y, tier)`
- Used when an asteroid is destroyed.
- Separate from damage impact feedback.
- Existing asteroid breakup behavior, XP grants, and fragment spawning are unchanged.

## Collision and Projectile Rules

- Projectile impacts use projectile/collision positions where practical, not only target centers.
- Player contact impacts use `getPlayerContactImpactPoint(...)` to place the effect near the contact side of the player.
- Contact impact explosions are only emitted when contact damage is allowed by player invulnerability timing.
- Toroidal render mirrors remain visual-only and do not participate in collision or gameplay state.

## Important Preservation Notes

These feedback changes are visual-only. They should not change:

- HP values
- XP rewards
- Projectile damage
- Enemy AI
- Player movement
- Collision/knockback rules
- Asteroid breakup rules
- Minimap behavior
- HUD behavior
- Upgrade overlay behavior
- Toroidal wrapping gameplay

## Naming Guidance for Future Work

Use precise names in future prompts:

- "White damage flash" for direct object-color feedback.
- "Ship bullet impact explosion" for projectile hits on ships.
- "Ship collision impact explosion" for ship/body contact.
- "Asteroid impact explosion" for projectile or contact impacts on asteroids.
- "Asteroid breakup feedback" for asteroid destruction/fragmentation visuals.

Avoid using one generic "impact explosion" label unless the prompt intentionally means all impact categories.
