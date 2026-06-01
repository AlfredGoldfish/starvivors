# Starvivors Complete Game Checklist

Last reviewed: 2026-06-01

This file tracks the gap between the current playable Starvivors prototype and a complete, polished game. It is intentionally practical: every item should be something a future session can read, update, and verify.

## Session Rules

1. At the start of every Starvivors session, remind the user that this checklist exists and offer one suggested checklist item to work on next.
2. Keep the reminder brief. Suggested wording: `Checklist reminder: the complete-game list is in Docs/STARVIVORS_COMPLETE_GAME_CHECKLIST.md. Suggested next item: <one item>. Say "not right now" or name another Starvivors task and I will follow that.`
3. At the start of every Starvivors session, check whether there are uncommitted changes and ask whether the user wants a checkpoint commit before new work starts.
4. If the user's opening request already names a specific task, give the one-line checklist reminder and checkpoint question only if they do not interrupt the work, then proceed with the requested task.
5. If the user says "not right now", "skip the list", "later", or otherwise chooses a different game task, respect that decision for the session. Do not keep pushing the checklist unless the task becomes checklist-related.
6. If the user declines a checkpoint commit, continue without asking again that session unless the user explicitly requests a commit.
7. When the user asks for checkpoint safety, commit only the intended files and leave unrelated dirty worktree changes alone.
8. Read this file at the start of any session that touches gameplay, UI, content, assets, audio, progression, release, or polish.
9. If the current task maps to this checklist, mention the active checklist item and status in working updates and the final response.
10. Before ending a checklist-related session, update this file when status, evidence, acceptance notes, or next steps changed.
11. Do not mark an item complete unless it has a real user path, has been verified, and no known placeholder remains in that area.
12. Prefer adding evidence notes over deleting scope. Delete an item only when the product direction clearly removes it.

## Status Legend

- `[x]` Complete: implemented, verified, and no known placeholder remains for the target scope.
- `[~]` WIP: playable or partly implemented, but still needs polish, content, balance, verification, or final assets.
- `[ ]` Todo: planned or needed, but not meaningfully implemented yet.
- `[!]` Risk: works now, but has architecture, performance, usability, or release risk that should be handled before shipping.

## Current Product Read

- Prototype state: broad playable vertical slice.
- Complete-game state: not content complete, not audio complete, not final-polish complete.
- Main gap: cohesion. Many systems exist, but player-facing clarity, art direction, audio, accessibility, balance, and release hardening still need dedicated passes.

## A. Whole-Run Loop And Player Clarity

- [~] Free Range and mission launch paths exist.
  - Done when: the player can choose mode, ship, loadout, launch, understand why launch is blocked, and return to hub cleanly.
  - Evidence: Free Range and mission structure are present in the current build.
  - Next: improve command screen first-read for mode, ship, weapon, risk, and launch readiness.
- [~] Run lifecycle states are understandable.
  - Done when: start, mission complete, continue, eject cancel, eject confirm, death, restart, and return-to-hub are all clear and covered by QA.
  - Evidence: 2026-05-31 pass restored manual death debrief behavior on `092af89`: death holds the arena for the 7.6s black-box delay, leaves results closed when the debrief becomes available, shows the debrief button, and only opens results after the explicit debrief action; focused regression tests, full Vitest, build, and `?testHarness=smoke` passed.
  - Evidence: 2026-06-01 death sequence state refactor moved death debrief timing into `gameSceneDeathSequence`, kept `GameScene` as the HUD/results conductor, added focused death-state coverage, and verified default plus `?testHarness=smoke&testShip=bulwark` browser smokes.
  - Evidence: 2026-06-01 harness cleanup stopped `?testHarness=smoke` from opening debrief automatically, made `?testShip=bulwark` work without requiring smoke mode, and verified default plus Bulwark smoke states keep results closed when the debrief button becomes available.
  - Evidence: 2026-06-01 browser query harnesses were removed from runtime code and harness helper scripts were deleted; death flow is now covered by focused tests and manual QA instead of `?testHarness=smoke`.
  - Next: add a run-state QA checklist and keep result language consistent.
- [~] Mission completion does not confuse run end behavior.
  - Done when: completion ceremony explains completed objective, reward, and whether the player can keep exploring.
  - Next: polish mission completion copy and HUD/result state.
- [~] Results screen teaches the player what happened.
  - Done when: results clearly show outcome, contract, cargo, upgrades, threats, sector, rewards, unlocks, and suggested next action.
  - Next: restructure results hierarchy around learning value.
- [ ] New-player onboarding exists.
  - Done when: first launch explains movement, fuel, firing, scrap, upgrades, mission objective, and eject without relying on debug/docs.
  - Next: add lightweight first-run prompts or a tutorial contract after core HUD copy is stable.

## B. HUD, Menus, And UX

- [x] Combat HUD/dashboard has a final default variant.
  - Done when: one default HUD variant is frozen, readable at target resolutions, and non-default research variants are hidden or developer-only.
  - Evidence: 2026-05-27 pass froze HUD variant 10 as the player default and moved URL variant overrides behind `?devHudVariants=1`.
  - Evidence: 2026-05-27 pass removed the default weapon hotbar bay/backplate and flattened weapon button faces so they no longer read as permanent black-bordered buttons.
  - Evidence: 2026-05-27 pass removed the top XP cockpit card, changed XP to a standalone rail, and kept XP/run timer text below it.
  - Evidence: 2026-05-27 pass added a compact narrow-width dashboard so hull/fuel meters, weapon slots, scrap, mission, and eject fit in one bottom panel.
  - Evidence: 2026-05-27 build passed, `testHarness=weaponHotbar` passed, and screenshots were captured at `artifacts/visual-smoke/hud-default-1280x720.png`, `artifacts/visual-smoke/hud-default-1920x1080.png`, and `artifacts/visual-smoke/hud-default-500x844.png`.
  - Next: keep this screenshot set as the regression baseline for future HUD changes.
- [~] Main command and pre-run hub feel like one product.
  - Done when: command, hangar, shop, settings, and debrief share navigation, selected-tab treatment, disabled states, and back behavior.
  - Evidence: 2026-05-27 pass removed split-color header bands and top divider lines from shared and pre-run menu panel shells.
  - Evidence: 2026-05-28 pass added a confirmation popup to hub LAUNCH actions across start, command, hangar, shop, settings, and debrief contexts.
  - Next: normalize the pre-run navigation component and focus states.
- [~] Ship select and hangar communicate ship identity.
  - Done when: each active ship has unique art, clear stats, starting loadout, one visible passive/mechanic, and no misleading "coming soon" promise.
  - Evidence: 2026-05-28 monochrome object pass moved Interceptor, Bulwark, and Engineer to closed black-fill/white-outline ship silhouettes backed by shared 320px source-size profiles.
  - Next: finish or hide ship mastery copy and replace fallback ship art.
- [~] Shop and permanent upgrades communicate value.
  - Done when: each row shows current effect, next effect, cost, owned/maxed state, active level, and why it matters.
  - Next: group shop into Ship, Weapon, Utility, Radar/Scanner.
- [~] Upgrade overlay cards show exact mechanical impact.
  - Done when: cards show affected weapon/system, current level, new level, exact stat delta, tags, and incompatibility/targeting state.
  - Next: add icons and before/after stat deltas.
- [~] Minimap/radar/scanner are understandable.
  - Done when: radar levels have player-facing names, icons, layer explanations, and scanner behavior is visually distinct from radar.
  - Next: label radar unlock layers and add scanner pulse/target category feedback.
- [x] Pause/settings menus are real, not placeholder-heavy.
  - Done when: graphics, sound, controls, gameplay, and accessibility tabs either do real work or hide future-only entries.
  - Evidence: 2026-05-28 pass replaced pre-run/results/pause settings with one shared tabbed editor for Graphics, Sound, Controls, Gameplay, and Accessibility.
  - Evidence: 2026-05-28 pass added persisted VFX density, screen shake amount, brightness, saved audio mix defaults, movement/debrief preferences, reduced shake/flash, high contrast, text scale, color-safe shots, and primary auto-fire assist.
  - Evidence: 2026-05-28 pass blocks duplicate keybind assignment, keeps Esc as binding cancel, and shows conflict copy when a duplicate is attempted or loaded.
  - Evidence: 2026-05-28 build, full Vitest suite, and `testHarness=debriefFlow` passed; settings screenshots captured at `artifacts/visual-smoke/settings-prerun-1280x720.png`, `artifacts/visual-smoke/settings-prerun-500x844.png`, `artifacts/visual-smoke/settings-pause-1280x720.png`, and `artifacts/visual-smoke/settings-pause-500x844.png`.
  - Next: use future audio pass to connect the saved Sound defaults to real menu/run/result audio sources.

## C. Combat Feel And Readability

- [~] Pulse Cannon is the gold-standard weapon pass.
  - Done when: muzzle flash, bolt trail, hit flash, sound, upgrade visuals, tooltip deltas, and balance against squads/events feel final.
  - Next: use Pulse as the reference quality bar for other weapons.
- [~] Ramming Shield has readable state.
  - Done when: shield HP, charge pips, bash window, blocked damage, unsafe recovery, and impact feedback are clear.
  - Next: add shield arc health read and blocked-projectile sparks.
- [~] Salvage Beam has readable heat and contact feedback.
  - Done when: weapon slot heat, overheat warning, beam hit feedback, vent effects, and audio loop are clear.
  - Next: add heat meter and audio ramp.
- [~] Enemy telegraphs are readable.
  - Done when: sniper, charger, exploder, shield/support, carrier, and high-damage projectiles each have clear visual and audio warnings.
  - Evidence: 2026-05-29 cleanup removed the standalone enemy sandbox and migrated shared enemy definitions, spawning, visuals, and AI to neutral live-game module names.
  - Evidence: 2026-05-29 cleanup deleted lab-only modular attack/audit/runtime/audio prototype code and artifacts; live-game enemy behavior remains on the shared enemy runtime.
  - Evidence: 2026-05-29 Scout phase made live enemy validation Scout-only, added a 10-second elapsed-time ramp, enforced a 500 live-enemy cap, and added focused Scout ramp/cap evidence.
  - Evidence: 2026-05-29 Wedge Striker charger phase added a committed aim, windup, charge, and recovery loop with generated lane/recovery warning textures; this was historically verified by now-retired phase browser harnesses, and current regression checks should use focused tests/manual play plus `testHarness=smoke`.
  - Evidence: 2026-05-29 Wedge charge-hit fix keeps committed chargers in the `charging` state after player contact and skips enemy-side contact recoil/displacement during the dash so the striker still reaches the lane endpoint and recovery state.
  - Evidence: 2026-05-29 Hex Tank validation promoted `hex-tank` as the active live validation enemy; solo and controlled mix checks are now covered by focused tests/manual play rather than retired phase browser harnesses.
  - Evidence: 2026-05-30 Reactor Drone validation promoted `reactor-drone` as the active live validation enemy; solo Reactor, controlled mix, detonation, warning, blast, reward cleanup, and body-contact HP safety checks should now use focused tests/manual play plus `testHarness=smoke`.
  - Evidence: 2026-05-30 Reactor Drone follow-up added a smaller player/shield-kill death blast, quieter enemy-to-enemy blast damage feedback, and per-frame explosion VFX budgeting to reduce slowdown when several blasts resolve together; `npm.cmd run build` passed and harnesses were intentionally skipped by request.
  - Evidence: 2026-05-30 Impact Bomber validation promoted `impact-bomber` as the active live validation enemy; a later prototype-match pass changed it to the prototype square instant exploder visual/effects language with orange filled square, black exclamation mark, instant proximity detonation, orange/yellow burst particles, and expanding orange blast fill/ring.
  - Evidence: 2026-05-30 prototype enemy match pass converted the remaining mapped `preview-enemy-*.html` concepts to colored vector recipes with prototype silhouettes, fills, labels/symbols, effect colors, and per-enemy telegraph colors; it also added `poison-leech` for the poisoner/freezer melee DOT role. Focused enemy/status tests, full Vitest, `npm.cmd run build`, and `?testHarness=smoke` passed.
  - Evidence: 2026-05-30 time-based mixed spawn director replaced the scout-only automatic ramp with 5-second first wave timing, randomized 10-30 second follow-up waves, mixed enemy pools, camera-offscreen placement, a 50 active-enemy director cap, and debug spawn summaries.
  - Next: validate sniper, support, carrier, and status enemy readability directly in live gameplay and add main-game harness evidence before marking this complete.
- [~] World hazards are readable.
  - Done when: asteroid tiers, debris, black holes, and danger radii have consistent visual language and warning hierarchy.
  - Next: add tier-distinct asteroid marks, debris hazard language, and black-hole warning cues.
- [~] Combat feedback hierarchy is controlled.
  - Done when: critical feedback beats decorative effects, density scales under load, and accessibility options reduce clutter.
  - Evidence: 2026-05-29 player enemy/debris body contact now uses fixed touch damage instead of closing-speed damage; the now-retired `testHarness=enemyContactBalance` historically verified a stationary Scout overlap dealing 8 hull damage while still applying separation/recoil.
  - Evidence: 2026-05-29 enemy contact recoil was simplified to knockback plus a brief scale response, without steering/turning the enemy ship away from the player.
  - Evidence: 2026-05-29 committed Wedge Striker charges bypass generic contact recoil on player hit so the player takes touch damage without freezing the charger before its committed endpoint.
  - Evidence: 2026-05-29 player death now triggers an invisible screen-visible enemy cleanup shockwave using player-style death feedback without rewards, child spawns, or extra death audio; the now-retired `testHarness=playerDeathShockwave` historically verified the five-second center-to-far-width wave timing, on-screen/off-screen behavior, distance ordering, and unchanged reward counters.
  - Evidence: 2026-05-29 player-style death feedback now uses a one-second expanding/fading blast ring and a denser, larger, faster, longer-traveling shard burst shared by the player and death-shockwave enemies.
  - Evidence: 2026-05-29 seam-prone animated and large gameplay rings moved from Phaser stroked circle primitives to generated canvas texture sprites for player death, asteroid impacts/breakups, enemy telegraphs/phase pulses, mission/sector beacons, and world/rare event range rings.
  - Evidence: 2026-05-29 Hex Tank contact now pushes the player harder with a 4.0 player knockback multiplier and takes reduced enemy-side recoil with a 0.45 self-impulse multiplier; the now-retired `testHarness=enemyContactBalance` historically verified stronger tank player shove, reduced tank self-knockback, and no player-body collision damage to tank HP.
  - Next: classify effects as critical, combat, reward, or ambient.

## D. Content Depth

- [~] Three core ships are viable and distinct.
  - Done when: Interceptor, Bulwark, and Engineer each have unique art, feel, passive/mechanic, build path, and balance.
  - Next: finish Bulwark/Engineer art and prove their passives in play.
- [ ] Additional ships are deferred until core ships are polished.
  - Done when: Carrier, Void Skiff, or other ships are added only after the three core ships are complete.
  - Next: do not expand ship roster yet.
- [~] Mission set has enough variety.
  - Done when: mission templates cover core play styles and each has briefing, objective, danger, reward, completion, and result copy.
  - Next: add missions only after existing mission presentation is polished.
- [~] Mothership event is more than a stationary prototype.
  - Done when: mothership has warning radius, guard waves, weak points or bays, staged destruction, reward ceremony, and final art.
  - Next: add weak points or spawn bays before adding another world anchor.
- [ ] Stronghold event exists.
  - Done when: a first stronghold has turrets/bays/weakpoints, guard squads, signal/radar treatment, and reward.
  - Next: build after mothership polish.
- [~] Rare events feel memorable.
  - Done when: each rare event has unique signal, intro ping, danger warning, local visual language, reward reveal, and completion ceremony.
  - Next: uplift Unstable Black-Hole Cache and Hunter Swarm before adding more rare events.
- [ ] Future rare events are intentionally deferred.
  - Done when: Thousand Swarm, Dead Fleet, Command Net, Reactor Cascade, Sniper Constellation, and Mirror Shield Convoy are added only after base events feel special.
  - Next: keep these out of active scope for now.

## E. Progression, Economy, And Saves

- [~] Resource roles are clear.
  - Done when: XP, scrap, credits, fuel, and future rare parts each have a distinct player meaning.
  - Next: define XP as in-run power, scrap as cargo/value, credits as post-run spend, rare parts as unlock milestones.
- [~] Permanent progression is understandable.
  - Done when: owned unlocks, active power, upgrade levels, radar/scanner levels, and pending boosts are clearly separated.
  - Next: improve shop/results copy and save export/debug snapshot.
- [~] Rewards feel meaningful.
  - Done when: missions, world events, rare events, scrap, crates, and unlock hooks create understandable reward moments.
  - Next: add reward ceremony and result-line clarity.
- [ ] Rare parts exist if still desired.
  - Done when: rare parts have a real source, sink, UI icon, and non-grindy unlock purpose.
  - Next: defer until reward loop is clearer.
- [!] Save migration and reset/export/import need hardening.
  - Done when: saves are versioned, migrations are tested, reset has confirmation, and export/import exists for debugging or player support.
  - Next: add save schema notes and reset/export UI.

## F. Assets And Visual Cohesion

- [~] Asset Forge pipeline is usable.
  - Done when: promoted assets have a repeatable review, export, import, and source promotion process.
  - Evidence: 2026-05-30 AI asset generation runbook added `Docs/STARVIVORS_AI_ASSET_GENERATION_RUNBOOK.md` with repeatable image-generation, chroma-key removal, validation, naming, folder, and batch-order guidance for future raster asset sessions.
  - Evidence: 2026-05-30 generated a first-pass AI raster asset library under `assets/ai-generated-images/` covering style tests, player ships, enemies, projectiles, VFX, asteroids/debris, pickups, UI/buttons, and backgrounds; `asset_generation_manifest_2026-05-30.json` recorded 122 final PNGs with zero dimension/alpha validation warnings.
  - Evidence: 2026-05-30 added `Docs/STARVIVORS_AI_ASSET_PRODUCTION_WORKFLOW.md` as the reusable Codex workflow for one-game-object asset sessions, using the original AI enemy concepts as style references, standalone candidates instead of sheets, explicit variant rules, and a copy/paste future-session prompt.
  - Evidence: 2026-05-30 added `Docs/STARVIVORS_AI_ASSET_PRODUCTION_TRACKER.md` as the user-facing asset checklist for choosing each future session object, tracking candidate/selection/promotion status, and carrying the copy/paste Codex session prompt.
  - Evidence: 2026-05-30 Interceptor one-object production session generated four standalone candidates under `assets/ai-generated-images/production-candidates/`, with preserved chroma-key sources and 512x512 RGBA validation.
  - Evidence: 2026-05-30 Bulwark one-object production session generated four standalone candidates under `assets/ai-generated-images/production-candidates/`, with preserved chroma-key sources and 512x512 RGBA validation.
  - Evidence: 2026-05-30 Engineer one-object production session generated four standalone red/orange-accent candidates under `assets/ai-generated-images/production-candidates/`, with preserved chroma-key sources and 512x512 RGBA validation.
  - Evidence: 2026-05-30 enemy production batch generated four standalone candidates each for Diamond Gunner, Scout, Wedge Striker, Hex Tank, and Reactor Drone under `assets/ai-generated-images/production-candidates/`, with preserved chroma-key sources and 512x512 RGBA validation.
  - Evidence: 2026-05-30 enemy production batch generated four standalone candidates each for Phase Skiff, Splitter, Needle Sniper, Shield Frigate, and Repair Skiff under `assets/ai-generated-images/production-candidates/`, with preserved chroma-key sources, no blue accents, and 512x512 RGBA validation.
  - Evidence: 2026-05-30 enemy production batch generated four standalone candidates each for Command Relay, Frost Gunner, Poison Leech, Combat Summoner, and Spawner Nest under `assets/ai-generated-images/production-candidates/`, with preserved chroma-key sources, role-reflective neon reads, 64px footprint checks, and 512x512 RGBA validation.
  - Evidence: 2026-05-30 Pulse Cannon bolt projectile production session generated four standalone cyan/blue 128x128 RGBA candidates under `assets/ai-generated-images/production-candidates/projectiles/pulse_bolt/`, with preserved chroma-key sources, transparent-corner validation, no detected green fringe, and 64px footprint checks.
  - Evidence: 2026-05-30 projectile/VFX production batch generated four standalone candidates each for enemy bolt, rail shot, frost needle, poison shot, electric arc bolt, summoner shot, impact bomber warning marker, beam contact spark, shield impact shard, and circular energy shield under `assets/ai-generated-images/production-candidates/`, with preserved chroma-key sources, transparent-corner validation, no detected key fringe, and 64px footprint checks.
  - Evidence: 2026-05-31 VFX production batch generated four standalone candidates each for muzzle flash, enemy hit spark, shield block spark, explosion ring, reactor blast, poison tick burst, frost shatter, electric status pulse, scrap pickup glint, upgrade pickup burst, player death shard burst, and black-hole warning ripple under `assets/ai-generated-images/production-candidates/vfx/`, with preserved chroma-key sources, transparent-corner validation, no detected key fringe, and 64px footprint checks.
  - Evidence: 2026-05-31 asteroid mineral-composite production batch generated three standalone 1024x1024 RGBA candidates each for basalt crater, iron ore, copper ore, gold vein, diamond crystal, ice crystal, uranium ore, obsidian glass, quartz vein, and sulfur crater under `assets/ai-generated-images/production-candidates/asteroids/`, with 30 preserved chroma-key sources, transparent-corner validation, padded alpha bounds, no detected key fringe, and 64px footprint checks; no runtime promotion.
  - Next: review the player ship, enemy, projectile, VFX, and asteroid candidate sets at gameplay scale before any runtime promotion.
- [~] Player ship assets are cohesive.
  - Done when: Interceptor, Bulwark, and Engineer share a final visual language and no active ship uses a misleading fallback.
  - Evidence: 2026-05-28 monochrome object pass replaced active ship PNG/Forge rendering with generated `monochrome-outline` silhouettes for gameplay and hangar previews, while leaving legacy asset references available.
  - Evidence: 2026-05-30 Interceptor AI raster production created four Diamond Gunner-anchored blue-white balanced fighter candidates for review; these assets were not wired into runtime.
  - Evidence: 2026-05-30 Bulwark AI raster production created four Diamond Gunner-anchored blue-white heavy defensive ship candidates for review; these assets were not wired into runtime.
  - Evidence: 2026-05-30 Engineer AI raster production created four Diamond Gunner-anchored red/orange utility ship candidates for review; these assets were not wired into runtime.
  - Next: review the Interceptor, Bulwark, and Engineer raster directions at gameplay scale with shield/beam/firing feedback before promotion.
- [~] Enemy assets are cohesive.
  - Done when: all 15 live enemy roles have active final-direction art or an intentional fallback label.
  - Evidence: 2026-05-28 visual passes migrated the shared live enemy roster to active `visualStyle: monochrome-outline` recipes with black fills, white outlines, and shared 320px source-size profiles; legacy Forge/vector data remains available as reference.
  - Evidence: 2026-05-29 cleanup moved shared enemy definitions to `src/data/enemyDefinitions.ts` and kept live-game texture generation through `src/systems/enemyVisuals.ts`.
  - Evidence: 2026-05-29 Scout active phase target added a clearer monochrome directional nose/rear-thruster silhouette, capped sampled movement trail hints, and contact recoil scale feedback for live-game validation.
  - Evidence: 2026-05-29 Scout, Wedge Striker, and Hex Tank monochrome outline strokes were thinned to 1px as a visual-only pass; collision radius, HP, contact damage, speed, and visual footprint remain unchanged.
  - Evidence: 2026-05-30 prototype enemy match pass promoted 23 prototype-mapped live enemy definitions to colored `vector-outline` recipes sourced from the preview files; Scout, Carrier Foundry, Scrap Jackal, and Electric Leech remain intentional live extra/fallback roles.
  - Evidence: 2026-05-30 AI raster production created four review candidates each for Diamond Gunner, Scout, Wedge Striker, Hex Tank, and Reactor Drone, using distinct neon reads: blue, cyan/teal, red/orange, amber/yellow, and violet/magenta. These assets were not wired into runtime.
  - Evidence: 2026-05-30 AI raster production created four review candidates each for Phase Skiff, Splitter, Needle Sniper, Shield Frigate, and Repair Skiff, using distinct non-blue neon reads: violet/hot-pink, acid-yellow, crimson/red, amber/gold, and coral/warm-white. These assets were not wired into runtime.
  - Evidence: 2026-05-30 AI raster production created four review candidates each for Command Relay, Frost Gunner, Poison Leech, Combat Summoner, and Spawner Nest, using combat-role neon reads: electric cyan/deep blue, icy cyan/white, toxic lime/acid green, violet/magenta, and hot orange/amber. These assets were not wired into runtime.
  - Evidence: 2026-05-30 AI raster production created ship-theme v2 review candidates for Combat Summoner and Spawner Nest plus first-pass Impact Bomber and Mothership candidates, all with preserved chroma-key sources, 512x512 RGBA transparent outputs, and no runtime wiring.
  - Next: review the enemy raster directions at gameplay scale before promotion, then validate colored enemy recipes in dense live runs.
- [~] Pickup/resource assets are cohesive.
  - Done when: scrap tiers, upgrade crates, future fuel cells, and future rare parts are distinct at gameplay scale.
  - Next: finish scrap tier polish and separate debris from collectible scrap.
- [~] UI icon set is cohesive.
  - Done when: mission, radar, resource, stat, weapon, upgrade, and telegraph icons use one locked style in HUD/shop/results.
  - Next: review AI candidates and promote a selected icon set.
- [~] Asteroid/debris/black-hole art matches final direction.
  - Done when: world hazards read clearly and do not feel visually detached from the final object style.
  - Evidence: 2026-05-28 monochrome object pass replaced active asteroid PNG selection with deterministic procedural black-fill/white-outline chunks, seeded by tier/family and sized through shared 320px source profiles.
  - Evidence: 2026-05-28 prototype completion pass expanded deterministic asteroid families from 4 to 12 and promoted the shared asteroid visual generator.
  - Next: validate asteroid readability in dense live runs, then apply the same final-direction treatment to debris and black-hole warnings.

## G. Audio, Accessibility, And Settings

- [~] First audio pass exists.
  - Done when: master/music/SFX/UI sliders work and core sounds exist for player fire, enemy fire, hit, hull damage, pickup, upgrade, low fuel, mission complete, eject, and black-hole warning.
  - Evidence: 2026-05-28 first SFX pass added procedural Web Audio cues for player/enemy fire, impacts, shield/world/debris feedback, hull damage/death/eject, pickups/upgrades, low fuel, mission complete, black-hole warning, and UI confirm/back/tab/error.
  - Evidence: 2026-05-28 pass wired master, SFX, UI, and mute settings to playback and added an audio harness covering effective gains and representative cue recording; music volume remains persisted and clearly reserved for the later music/ambience pass.
  - Evidence: 2026-05-28 pass softened player-fire and player-burst-fire procedural cues by lowering high-frequency content, reducing gain, and switching brittle oscillators to triangle waves.
  - Next: add actual music/ambience sources, then promote this from partial to complete once the music slider controls an active source.
- [~] Enemy and hazard audio cues exist.
  - Done when: dangerous enemy actions and major hazards have recognizable cues that improve readability.
  - Evidence: 2026-05-29 cleanup removed lab-only attack-audio prototype code; current first-pass audio remains focused on live gameplay cues.
  - Next: add live enemy telegraph cues plus asteroid/debris/black-hole warning and impact cues before marking this complete.
- [ ] Music/ambience direction exists in game.
  - Done when: menu, run, danger/event, and results ambience have at least placeholder implementation with volume control.
  - Next: defer until SFX categories are in place.
- [x] Accessibility settings are represented in UI.
  - Done when: reduced shake, reduced flash, high-contrast telegraphs, text scale, color-safe shots, and optional input assist actually affect gameplay/rendering.
  - Evidence: 2026-05-28 pass wired reduced shake to camera shake suppression/scaling, reduced flash to bright feedback alpha, high contrast to warning HUD/enemy projectile readability, text scale to settings/pause/HUD text, color-safe shots to player/enemy projectile palettes, and input assist to primary-slot auto-fire only.
  - Next: broaden accessibility QA during combat polish, especially dense-event readability.
- [~] Controls/keybinds are robust.
  - Done when: rebinding handles conflicts, pause while binding, reset defaults, mouse/keyboard clarity, and a gamepad decision.
  - Evidence: 2026-05-28 pass added duplicate-binding blocking, conflict messaging, Esc cancel, reset controls, reset all, migration/default tests, and persistence coverage.
  - Next: input audit pass, including the explicit gamepad decision.

## H. Performance, QA, And Release Hardening

- [~] Build/test baseline exists.
  - Done when: `npm.cmd run build` passes and focused tests/harnesses cover changed systems.
  - Evidence: 2026-05-28 monochrome object pass added shared size-profile and monochrome recipe unit coverage; full Vitest suite and `npm.cmd run build` passed.
  - Evidence: 2026-05-28 prototype completion pass added player status, enemy roster/behavior, and asteroid visual family unit coverage; full Vitest suite and `npm.cmd run build` passed.
  - Evidence: 2026-05-29 Scout phase pass added `src/systems/scoutPhaseSpawning.test.ts`; focused Vitest, full Vitest, `npm.cmd run build`, `testHarness=scoutPhase`, and baseline `testHarness=smoke` passed.
  - Evidence: 2026-05-29 Hex Tank validation pass added `src/systems/tankPhaseSpawning.test.ts`; focused Vitest, `npm.cmd run build`, `testHarness=tankPhase`, `testHarness=scoutPhase`, `testHarness=wedgeStrikerPhase`, `testHarness=enemyContactBalance`, and `testHarness=smoke` passed.
  - Evidence: 2026-05-30 Reactor Drone validation pass added `src/systems/reactorPhaseSpawning.test.ts`; focused Vitest, `npm.cmd run build`, `testHarness=reactorPhase`, and `testHarness=smoke` passed.
  - Evidence: 2026-05-30 Reactor Drone blast follow-up passed `npm.cmd run build`; harnesses were intentionally skipped by request.
  - Evidence: 2026-05-30 Impact Bomber validation pass added `src/systems/impactBomberPhaseSpawning.test.ts`; focused Vitest for Impact Bomber spawning and enemy visual definitions passed, `npm.cmd run build` passed, `testHarness=impactBomberPhase` passed, and `testHarness=smoke` passed.
  - Evidence: 2026-05-30 Impact Bomber prototype-match pass updated the live enemy to the square instant exploder visual/effects from `Docs/references/Enemy_Prototype/Preview Files/preview-enemy-exploder.html`; focused Impact Bomber/vector tests, full Vitest, and `npm.cmd run build` passed.
  - Evidence: 2026-05-30 Impact Bomber harness refactor moved the phase scenario body to `src/scenes/gameSceneImpactBomberHarness.ts`; focused Impact Bomber/vector tests, full Vitest, `npm.cmd run build`, `testHarness=impactBomberPhase`, and `testHarness=smoke` passed before the later smoke-only harness prune retired that query ID.
  - Evidence: 2026-05-30 smoke-only harness prune removed all non-smoke browser query harnesses and the global `window.starvivorsTestHarness` API; this was later superseded by the 2026-06-01 removal of browser query harnesses entirely.
  - Evidence: 2026-05-30 prototype enemy match pass passed focused enemy vector/status tests, full Vitest, `npm.cmd run build`, and `?testHarness=smoke` on the existing local Vite server.
  - Evidence: 2026-05-30 time-based spawn director pass added pure director and offscreen placement tests; focused Vitest, full Vitest, `npm.cmd run build`, and `?testHarness=smoke` passed on the existing local Vite server.
  - Next: keep build required after implementation changes.
- [~] Smoke harness coverage exists.
  - Done when: key run flows, HUD, results, settings, mission, fuel, eject, and progression flows have stable harness or screenshot coverage.
  - Evidence: 2026-05-28 pass added a `pauseSettings` visual module harness path and captured desktop/narrow settings screenshots for pre-run and pause settings.
  - Evidence: 2026-05-29 cleanup removed standalone enemy sandbox harnesses and artifacts.
  - Evidence: 2026-05-30 smoke-only harness prune made `?testHarness=smoke` the only retained browser query harness; this was later superseded by the 2026-06-01 removal of browser query harnesses entirely.
  - Next: add screenshot smoke set for command, hangar, shop, upgrade overlay, HUD, minimap/radar levels, results, and live enemy readability.
- [~] Performance profiling exists.
  - Done when: repeatable stress scenarios exist for asteroid burst, swarm, mothership, rare event, high-upgrade Pulse, beam, and black hole.
  - Next: create canned 2-minute stress runs.
- [!] GameScene remains a broad orchestration risk.
  - Done when: new work stays in focused modules and existing broad responsibilities are extracted only in behavior-preserving slices.
  - Evidence: 2026-05-30 Impact Bomber phase harness logic was first extracted behind an explicit adapter, then retired by the smoke-only harness prune along with the old query-string harness ID.
  - Next: keep using `Docs/GAMESCENE_REFACTOR_PLAN.md` before moving code; prioritize remaining harness scenario bodies before higher-risk gameplay side-effect extraction.
- [~] Desktop packaging exists but is not release-polished.
  - Done when: desktop icon, fullscreen/window settings, save location behavior, crash logging, installer/portable decision, and desktop smoke are complete.
  - Next: keep browser primary until loop polish is stronger.
- [ ] Release checklist exists.
  - Done when: there is a final pre-release checklist for build, smoke, save migration, options, credits/legal, packaging, and known issues.
  - Next: create after core polish passes A-E are done.

## Recommended Polish Order

Current focus: Pass A.

1. [~] Pass A: freeze HUD/menu/run clarity.
2. [~] Pass B: add screenshot smoke coverage for key screens.
3. [ ] Pass C: finish or hide placeholder promises.
4. [~] Pass D: promote core ship/enemy/icon assets.
5. [ ] Pass E: add first audio pass.
6. [ ] Pass F: add real accessibility toggles.
7. [~] Pass G: polish mothership, rare events, and missions.
8. [~] Pass H: full balance and performance sweep.

## Session Log

- 2026-05-27: Created this checklist from the complete-game scope review and wired it into Codex session instructions.
- 2026-05-27: Added start-of-session checklist reminder protocol with an explicit opt-out/respect-current-task rule.
- 2026-05-27: Added start-of-session checkpoint commit prompt and scoped-commit rule.
- 2026-05-27: Continued Pass A by freezing HUD variant 10 as the player default and tightening mission/eject/result wording; screenshot verification remains next.
- 2026-05-27: Removed the stray top menu header band/divider from shared and pre-run menu panel shells; build and pre-run screenshot smoke passed.
- 2026-05-27: Removed the default weapon hotbar backplate/rim treatment that read as an always-visible black border; build and HUD screenshot smoke passed.
- 2026-05-27: Removed the top XP cockpit card, replaced the segmented XP meter with a standalone rail, and kept the XP counter/run timer below it; build and 1280x720 HUD screenshot smoke passed.
- 2026-05-27: Completed the combat HUD/dashboard checklist item by adding a compact narrow-width dashboard and refreshing 1280x720, 1920x1080, and 500x844 HUD screenshots; build and `testHarness=weaponHotbar` passed.
- 2026-05-28: Completed the basic settings pass with a shared settings editor, persisted graphics/sound/gameplay/accessibility fields, keybind conflict blocking, primary auto-fire assist, rendering/accessibility hooks, full Vitest pass, build pass, and four settings smoke screenshots.
- 2026-05-28: Softened rapid player shooting SFX and added a hub launch confirmation popup; full Vitest, build, startup-navigation smoke, and launch-confirm screenshot smoke passed.
- 2026-05-28: Reworked Enemy Lab into a Vector Combat Lab first pass with six vector-outline enemy recipes, reusable effect previews, lab modes, clutter/readability tests, outline asteroid/debris props, unit coverage, build/test pass, and vector harness screenshot smoke.
- 2026-05-28: Replaced active enemy, player ship, and asteroid visuals with a monochrome Asteroids-style source-scale system using shared 320px object size profiles; full Vitest, build, Enemy Lab monochrome smoke, live smoke, and `enemy-lab-monochrome-1280x720.png` passed.
- 2026-05-28: Completed the lab-first enemy prototype roster with portable AI/status/scrap hooks, expanded shared asteroid visuals to 12 deterministic families, added the Enemy Lab prototype harness/gallery screenshot, and reverified full Vitest, build, Enemy Lab smoke, and live smoke.
- 2026-05-28: Added the Enemy Lab modular attacks and workflow plan, covering attack registry shape, tabbed lab UI, desktop-first preset hierarchy, default enemy attack loadouts, attack batches, and reference notes from the Enemy Prototype preview files.
- 2026-05-28: Started the Enemy Lab modular attack workflow implementation with a typed attack registry/default loadouts, registry validation tests, workflow tabs, Basic loadout preview, and Attack Tester attack selection; Vitest, build, basic UI smoke, and `enemyLabPrototype` harness passed.
- 2026-05-28: Completed Enemy Lab Phase 3 preset persistence with v2 variant/squad attack overrides, standalone attack loadout and attack-test Markdown presets, nested desktop preset folders, browser-safe fallback downloads, full Vitest/build/electron build pass, Basic-tab browser smoke, and `enemyLabPrototype` harness recheck.
- 2026-05-28: Completed Enemy Lab Phase 4 modular attack runtime with lab-only host/slot runtimes, Attack Tester execution, enemy loadout snapshot execution, legacy attack gating, runtime unit coverage, build/electron build pass, Basic-tab smoke, `enemyLabAttacks` smoke, and `enemyLabPrototype` recheck.
- 2026-05-28: Completed Enemy Lab Phase 5 Batch A attack polish for `rail-line`, `mortar-lob`, `emp-nova`, and `summon-glyphs` with delayed mortar impact timing, rail aim/lock targeting, Batch A readability visuals, runtime/unit coverage, full Vitest, build, electron build, Basic-tab smoke, `enemyLabAttacks` Batch A smoke, and `enemyLabPrototype` recheck.
- 2026-05-28: Completed Enemy Lab Phase 5 Batch B attack polish for `sweep-laser`, `healing-beam`, `shield-wall`, and `plasma-puddle` with sustained tick runtime support, damaged-ally retargeting, reflect shield clarity, lingering puddle feedback, Batch B readability visuals, full Vitest, build, electron build, Basic-tab smoke, `enemyLabAttacks` Batch A+B smoke, and `enemyLabPrototype` recheck.
- 2026-05-28: Completed Enemy Lab Phase 5 Batch C attack polish for `cluster-bomb`, `alarm-ping`, `berserker-shockwave`, and `mine-reveal` with delayed cluster secondary impacts, alarm squad calls, shockwave/mine status timing, Batch C readability visuals, full Vitest, build, electron build, Basic-tab smoke, `enemyLabAttacks` Batch A+B+C smoke, and `enemyLabPrototype` recheck.
- 2026-05-28: Completed Enemy Lab Phase 6 verification and polish with Phase 6 harness JSON details, Basic/Squads/Attack Tester/stress-high-contrast screenshots, full Vitest with 99 tests, build, electron build, Basic-tab smoke, `enemyLabAttacks` Phase 6 smoke, and `enemyLabPrototype` recheck.
- 2026-05-28: Completed Enemy Lab Phase 7 attack audio and player-host attack mode with generated procedural attack cue coverage for all 20 registry attacks, lab-only runtime audio callbacks, a session-local Player Fire toggle, `enemyLabAttackAudio` harness coverage, full Vitest with 104 tests, build, electron build, existing harness rechecks, and `enemy-lab-attack-audio-player-mode-1280x720.png`.
- 2026-05-29: Completed Enemy Lab Phase 8 attack visual profiles and audit harness with all 20 registry attacks covered by visual grammar/profile data, all core compatibility attacks promoted to Enemy Lab-ready visual coverage, full Vitest with 114 tests, build, electron build, existing harness rechecks, and normal/reduced/high-contrast visual audit screenshots.
- 2026-05-29: Removed the standalone enemy sandbox as a runnable/debug surface, deleted lab-only attack/preset/harness/docs/artifacts, renamed shared enemy modules to neutral live-game names, and moved enemy readability follow-up to direct live-game validation.
- 2026-05-29: Started the Scout-only enemy polish phase with no starting enemy batch, a 10-second elapsed-time Scout ramp, a 500 live-enemy cap, Scout-only spawn enforcement across directed/squad/event/debug/AI child paths, focused unit coverage, build pass, Scout phase harness pass, smoke harness pass, and updated enemy/asteroid checklist evidence.
- 2026-05-29: Changed player enemy/debris body contact to fixed touch damage, kept contact separation/recoil active, and verified the zero-velocity Scout overlap path with `testHarness=enemyContactBalance`.
- 2026-05-29: Simplified enemy contact recoil so Scouts and other live enemy ships keep their facing during knockback instead of rotating to face the recoil direction.
- 2026-05-29: Added a player-death invisible cleanup shockwave that removes on-screen enemies with player-style death feedback, freezes gameplay systems during the death sequence, slowed the wave to five seconds from center to far screen width, and verified build, `enemyContactBalance`, `scoutPhase`, `smoke`, and `playerDeathShockwave` harnesses.
- 2026-05-29: Tuned player-style death feedback with a one-second expanding/fading ring, higher shard cap, and larger/faster/longer-lived player-style ship fragments shared by player death and shockwave enemy cleanup.
- 2026-05-29: Replaced seam-prone stroked circle gameplay rings with reusable generated canvas texture sprites across player death, asteroid impact/breakup, enemy telegraphs/phase pulses, mission/sector beacons, and world/rare event range rings.
- 2026-05-29: Added the Wedge Striker charger validation phase with committed aim/windup/charge/recovery behavior, generated charge-lane and recovery telegraph textures, moving-enemy swept contact coverage, Scout+Wedge controlled mix setup, focused unit coverage, build pass, and `wedgeStrikerPhase`, `scoutPhase`, `enemyContactBalance`, and `smoke` harness passes.
- 2026-05-29: Switched the active live validation enemy from Scout to Wedge Striker, historically kept `testHarness=scoutPhase` pinned to Scout-only regression coverage before the smoke-only harness prune, and enlarged the Wedge Striker into a broader triangular charger silhouette.
- 2026-05-30: Pruned browser query harnesses to `?testHarness=smoke` only, removed the global manual `window.starvivorsTestHarness` API, deleted harness-only scene modules/tests, and made focused unit tests/manual play the path for retired phase, visual, shop, audio, and debug-menu scenarios.
- 2026-05-29: Made the Wedge Striker charge travel to the end of its displayed lane and standardized live enemy telegraphs to shared red warning tint/alpha across enemy AI lanes, rings, beams, paths, and support shapes.
- 2026-05-29: Added randomized shared telegraph timing and near-complete brightening for Wedge windups plus normal projectile shot telegraphs, and removed regular player-body collision damage against enemies while keeping enemy touch damage/knockback active.
- 2026-05-29: Promoted Hex Tank as the active live validation enemy with solo and Scout+Wedge+Tank harness coverage, tank-specific player/self knockback multipliers, visual-only 1px outline thinning for Scout/Wedge/Tank, focused unit coverage, build pass, and `tankPhase`, `scoutPhase`, `wedgeStrikerPhase`, `enemyContactBalance`, and `smoke` harness passes.
- 2026-05-30: Promoted Reactor Drone as the active live validation enemy with focused solo and exact Scout+Wedge+Tank+Reactor mix coverage, unchanged `proximityDetonate` identity checks, warning-radius telegraph-before-damage validation, inside/outside blast checks, reward cleanup verification, player-body-contact HP safety, focused unit coverage, build pass, `reactorPhase` pass, and `smoke` pass.
- 2026-05-30: Added the Reactor Drone blast follow-up with smaller player/shield-kill death AOE, quieter enemy-to-enemy blast feedback, per-frame explosion VFX budgeting, and a build pass; harnesses were intentionally not run by request.
- 2026-05-30: Promoted Impact Bomber as the active live validation enemy with focused solo and exact Scout+Wedge+Tank+Reactor+Impact mix coverage, square danger-mark silhouette, restartable non-contact proximity-fuse countdown behavior, blast-ring feedback on completed detonation, inside/escaped blast checks, reward cleanup verification, player-body-contact HP safety, focused unit coverage, build pass, `impactBomberPhase` pass, and `smoke` pass.
- 2026-05-30: Updated Impact Bomber to match the prototype square instant exploder visual/effects: orange filled square, black exclamation mark, no fuse countdown ring, orange/yellow particle burst, and expanding orange blast fill/ring; focused Impact Bomber/vector tests, full Vitest, and build passed.
- 2026-05-30: Checkpointed the Impact Bomber validation baseline, removed generated dev-smoke logs/PIDs from tracking, added the missing `Docs/README_FOR_CODEX.md` shim, extracted the Impact Bomber phase harness body out of `GameScene.ts`, and reverified focused tests, full Vitest, build, `impactBomberPhase`, and `smoke`.
- 2026-05-30: Matched the remaining enemy prototype preview concepts with colored live vector recipes, per-enemy telegraph colors, a new `poison-leech` melee DOT role, poison player status feedback, updated enemy prototype docs for 27 live entries, focused enemy/status tests, full Vitest, build, and `?testHarness=smoke`.
- 2026-05-30: Added the time-based mixed enemy spawn director with 5-second first wave timing, randomized 10-30 second follow-up waves, staggered mixed enemy batches, camera-offscreen placement, a 50 active-enemy director cap, debug spawn summary updates, focused director tests, full Vitest, build, and `?testHarness=smoke`.
- 2026-05-30: Added `Docs/STARVIVORS_AI_ASSET_GENERATION_RUNBOOK.md` as the future Codex workflow for AI-generated raster asset batches, including folders, naming, prompt templates, chroma-key removal, validation, and reporting rules.
- 2026-05-30: Generated the first one-object AI production candidate set for the Interceptor player ship, including four standalone candidates, selected candidate 04 as the preferred direction, preserved chroma-key sources, and 512x512 RGBA validation under `assets/ai-generated-images/production-candidates/`.
- 2026-05-30: Generated the one-object AI production candidate set for the Bulwark player ship, including four standalone candidates, preserved chroma-key sources, and 512x512 RGBA validation under `assets/ai-generated-images/production-candidates/`.
- 2026-05-30: Generated the one-object AI production candidate set for the Engineer player ship, including four standalone red/orange-accent candidates, preserved chroma-key sources, and 512x512 RGBA validation under `assets/ai-generated-images/production-candidates/`.
- 2026-05-30: Generated the first enemy AI raster production batch for Diamond Gunner, Scout, Wedge Striker, Hex Tank, and Reactor Drone, including four standalone candidates per enemy, preserved chroma-key sources, distinct neon color reads, and 512x512 RGBA validation under `assets/ai-generated-images/production-candidates/`.
- 2026-05-30: Generated the second enemy AI raster production batch for Phase Skiff, Splitter, Needle Sniper, Shield Frigate, and Repair Skiff, including four standalone candidates per enemy, preserved chroma-key sources, non-blue neon color reads, 64px preview spot-check, and 512x512 RGBA validation under `assets/ai-generated-images/production-candidates/`.
- 2026-05-30: Generated the third enemy AI raster production batch for Command Relay, Frost Gunner, Poison Leech, Combat Summoner, and Spawner Nest, including four standalone candidates per enemy, preserved chroma-key sources, role-reflective neon color reads, 64px footprint checks, and 512x512 RGBA validation under `assets/ai-generated-images/production-candidates/`.
- 2026-05-30: Generated ship-theme AI raster candidates for Combat Summoner v2, Spawner Nest v2, Impact Bomber, and Mothership, including preserved chroma-key sources, cyan/blue/orange ship-palette alignment, 64px footprint checks, and 512x512 RGBA validation under `assets/ai-generated-images/production-candidates/`.
- 2026-05-30: Generated the projectile/VFX AI raster production batch for enemy bolt, rail shot, frost needle, poison shot, electric arc bolt, summoner shot, impact bomber warning marker, beam contact spark, shield impact shard, and circular energy shield, including preserved chroma-key sources, transparent candidate PNGs, 64px footprint checks, and dimension/alpha/key-fringe validation under `assets/ai-generated-images/production-candidates/`.
- 2026-05-31: Generated the VFX AI raster production batch for muzzle flash, enemy hit spark, shield block spark, explosion ring, reactor blast, poison tick burst, frost shatter, electric status pulse, scrap pickup glint, upgrade pickup burst, player death shard burst, and black-hole warning ripple, including preserved chroma-key sources, transparent candidate PNGs, 64px footprint checks, and dimension/alpha/key-fringe validation under `assets/ai-generated-images/production-candidates/vfx/`; no runtime promotion.
- 2026-05-31: Generated the asteroid mineral-composite AI raster production batch for basalt crater, iron ore, copper ore, gold vein, diamond crystal, ice crystal, uranium ore, obsidian glass, quartz vein, and sulfur crater, including 30 preserved chroma-key sources, 30 transparent 1024x1024 candidate PNGs, 64px footprint checks, padded alpha bounds, and dimension/alpha/key-fringe validation under `assets/ai-generated-images/production-candidates/asteroids/`; no runtime promotion.
- 2026-06-01: Refactored player death debrief gating into `src/scenes/gameSceneDeathSequence.ts`, removed death timing ownership from `GameScene`, added unit/static regression coverage, and verified focused tests, full Vitest, build, default smoke, and Bulwark smoke.
