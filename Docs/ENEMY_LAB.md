# Starvivors Enemy Lab

Open the standalone lab at `/enemy-lab.html` while the Vite dev server is running.

The lab is intentionally separate from `GameScene`: it duplicates a small amount of player/world behavior so monochrome enemy ships, telegraphs, squad compositions, and support mechanics can be tested without changing the live enemy system or balance.

Controls:

- Move with `WASD` or arrow keys.
- Aim with the mouse and hold left mouse to fire test shots.
- Select the first ten enemy types with `1-0`, or cycle all enemy types with `[` and `]`.
- `Space` spawns the selected enemy.
- `Shift+Space` spawns the selected squad.
- `C` clears enemies and projectiles.
- `F` cycles and spawns squad presets.
- `I` toggles enemy AI.
- `L` toggles debug labels.
- `T` toggles telegraphs.
- `P` pauses or resumes the simulation.

The HTML overlay is now centered on the Monochrome Combat Lab workflow:

- `Shape`, `Effects`, `Behavior`, `Squad`, and `Stress` modes keep the main panel focused.
- The default `Effects` mode previews Idle, Pursue, Telegraph, Attack, Hit, and Death states without requiring a full combat spawn.
- Readability controls switch between normal, color-safe, high-contrast, and reduced-effects previews.
- Clutter tests can spawn a single enemy, a squad, a 50-enemy swarm, projectile clutter, monochrome asteroids, debris, or the full stress mix.
- Active enemy, player ship, and asteroid visuals use a shared 320px source-diameter size profile. Runtime scale controls display diameter, and collision radius is derived from that profile.
- Advanced Forge/import/export controls are still available in collapsed Advanced panels as legacy/reference workflows; they are not the default active art direction.

Prototype completion pass:

- Enemy Lab now includes the prototype concepts from `Docs/references/Enemy_Prototype/Preview Files` as monochrome Starvivors enemies: ambusher, berserker, orbiter, patrol, freezer, electric leech, combat summoner, scrap thief, instant-contact bomber, and stationary spawner nest, alongside the existing charger, exploder, flanker, shooter, sniper, splitter, teleporter, tank, repair, shield, buffer, reflector, and carrier roles.
- Frost and electric enemy projectile statuses are shared with `GameScene`; frost slows thrust/strafe/turn response, while electric applies ticking shield/hull damage and acceleration drag with white-blue spark VFX.
- `enemyLabPrototype` harness loads the new prototype samples with the asteroid gallery and marks `data-starvivors-enemy-lab-harness="monochrome-ready"` when the shared 3x enemy scale is intact.
- Asteroid clutter now uses the shared procedural asteroid recipe source. The gallery shows deterministic tier/family examples from the expanded 12-family Asteroids-style set.

The overlay also exposes spawn count, speed, HP, fire-rate multipliers, invulnerability, labels, telegraphs, deconfliction, collision-circle debug, and clear/spawn buttons.

Enemy deconfliction is lab-only. It uses each prototype enemy's resolved collision radius as a small traffic-control nudge so enemies stop stacking without maintaining large artificial spacing bubbles. Turn `Deconflict` off to compare against the raw AI behavior, or use `Hit Circles` to inspect the actual collision radii.
