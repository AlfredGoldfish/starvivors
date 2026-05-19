# Starvivors Enemy Lab

Open the standalone lab at `/enemy-lab.html` while the Vite dev server is running.

The lab is intentionally separate from `GameScene`: it duplicates a small amount of player/world behavior so polygon enemy ships, telegraphs, squad compositions, and support mechanics can be tested without changing the live enemy system or balance.

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

The HTML overlay also exposes spawn count, speed, HP, fire-rate multipliers, invulnerability, labels, telegraphs, deconfliction, collision-circle debug, and clear/spawn buttons.

Enemy deconfliction is lab-only. It uses each prototype enemy's `stats.radius` and `stats.mass` as a small traffic-control nudge so enemies stop stacking without maintaining large artificial spacing bubbles. Turn `Deconflict` off to compare against the raw AI behavior, or use `Hit Circles` to inspect the actual collision radii.
