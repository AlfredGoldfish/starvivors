# Starvivors Complete Game Checklist

Last reviewed: 2026-05-28

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
  - Evidence: 2026-05-28 Enemy Lab pass added vector-outline effect recipes, state preview buttons for idle/pursue/telegraph/attack/hit/death, readability modes, reduced-effects previews, and clutter/stress tests.
  - Evidence: 2026-05-28 prototype completion pass added lab-first ambusher, berserker, orbiter, patrol, frost/electric status shooters, combat summoner, scrap thief, instant bomber, and stationary spawner mechanics while keeping live encounter tables unchanged.
  - Evidence: 2026-05-28 modular attack planning pass added `Docs/ENEMY_LAB_ATTACKS_AND_WORKFLOW_PLAN.md` with Enemy Lab-first attack registry, tabbed workflow, preset hierarchy, default loadout assignments, and reference notes from the Enemy Prototype previews.
  - Evidence: 2026-05-28 attack workflow seed added `src/data/enemyAttackDefinitions.ts`, validation coverage, Basic/Squads/Attack Tester/Stress/Presets tabs, read-only default attack loadout display, and non-executing player-host Attack Tester selection.
  - Evidence: 2026-05-28 Phase 2 Enemy Lab UI pass made Basic loadout drafts, Attack Tester slot stacks, and session-local squad entry attack overrides editable in memory; spawned lab enemies receive cloned attack loadout snapshots for inspection only, while live `GameScene` combat and `enemyLabAi.ts` remain unchanged.
  - Evidence: 2026-05-28 Phase 3 Enemy Lab preset pass added Markdown save/load for variants, squads, Basic attack loadouts, and Attack Tester stacks; desktop saves route to nested `debug-presets/enemy-lab/...` folders, browser fallback downloads safe files, v1 variant/squad imports normalize to v2, and live `GameScene` combat remains unchanged.
  - Evidence: 2026-05-28 Phase 4 Enemy Lab runtime pass added `src/systems/enemyAttackRuntime.ts`, initialized spawned enemies from cloned attack loadout snapshots, enabled player-host Attack Tester Fire Once/Auto-Cycle/target controls, gated legacy lab attack firing/spawning/support/detonation paths to avoid double-firing, and kept live `GameScene` combat untouched.
  - Evidence: 2026-05-28 Phase 4 verification passed full Vitest, `npm.cmd run build`, `npm.cmd run electron:build`, Basic-tab headless smoke with enabled Attack Tester controls, `enemyLabAttacks` harness for `rail-line`, `simple-bolt`, `emp-nova`, and `summon-glyphs`, and the existing `enemyLabPrototype` monochrome harness.
  - Evidence: 2026-05-28 Phase 5 Batch A attack polish marked `rail-line`, `mortar-lob`, `emp-nova`, and `summon-glyphs` ready in the Enemy Lab registry; added rail aim/lock beats, delayed mortar travel/impact, EMP status burst feedback, summon ownership links, repeated Batch A telegraph refresh, and harness coverage for all four Batch A attacks while keeping live `GameScene` combat untouched.
  - Evidence: 2026-05-28 Phase 5 verification passed full Vitest, `npm.cmd run build`, `npm.cmd run electron:build`, Basic-tab headless smoke, `enemyLabAttacks` Batch A harness, and the existing `enemyLabPrototype` monochrome harness.
  - Evidence: 2026-05-28 Phase 5 Batch B attack polish marked `sweep-laser`, `healing-beam`, `shield-wall`, and `plasma-puddle` ready in the Enemy Lab registry; added sustained sweep/heal/puddle ticks, damaged-ally retargeting, reflect shield params, Batch B readability visuals, and harness coverage for all four Batch B attacks while keeping live `GameScene` combat untouched.
  - Evidence: 2026-05-28 Batch B verification passed full Vitest, `npm.cmd run build`, `npm.cmd run electron:build`, Basic-tab headless smoke, `enemyLabAttacks` Batch A+B harness, and the existing `enemyLabPrototype` monochrome harness.
  - Evidence: 2026-05-28 Phase 5 Batch C attack polish marked `cluster-bomb`, `alarm-ping`, `berserker-shockwave`, and `mine-reveal` ready in the Enemy Lab registry; added delayed cluster secondary impacts, alarm `squadId` summon calls, shockwave slow/knockback status params, mine charge/blast timing, Batch C readability visuals, and harness coverage for all four Batch C attacks while keeping live `GameScene` combat untouched.
  - Evidence: 2026-05-28 Batch C verification passed full Vitest with 19 files and 96 tests, `npm.cmd run build`, `npm.cmd run electron:build`, Basic-tab headless smoke with Attack Tester target controls, `enemyLabAttacks` Batch A+B+C harness with `batchCSlots`, and the existing `enemyLabPrototype` monochrome harness.
  - Next: capture Batch C screenshots, tune balance/readability, then pair audio cues after visual attack batches are stable.
- [~] World hazards are readable.
  - Done when: asteroid tiers, debris, black holes, and danger radii have consistent visual language and warning hierarchy.
  - Next: add tier-distinct asteroid marks, debris hazard language, and black-hole warning cues.
- [~] Combat feedback hierarchy is controlled.
  - Done when: critical feedback beats decorative effects, density scales under load, and accessibility options reduce clutter.
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
  - Next: keep manual promotion until quality standards are stable.
- [~] Player ship assets are cohesive.
  - Done when: Interceptor, Bulwark, and Engineer share a final visual language and no active ship uses a misleading fallback.
  - Evidence: 2026-05-28 monochrome object pass replaced active ship PNG/Forge rendering with generated `monochrome-outline` silhouettes for gameplay and hangar previews, while leaving legacy asset references available.
  - Next: verify ship silhouettes at gameplay scale with shield/beam/firing feedback and remove or relabel tint-only skin expectations.
- [~] Enemy assets are cohesive.
  - Done when: all 15 live enemy roles have active final-direction art or an intentional fallback label.
  - Evidence: 2026-05-28 Enemy Lab pass migrated Scout, Diamond Gunner, Hex Tank, Wedge Striker, Needle Sniper, and Reactor Drone to `visualStyle: vector-outline` recipes while leaving Forge texture support as fallback.
  - Evidence: 2026-05-28 monochrome object pass converted all 15 live Enemy Lab roles to active `visualStyle: monochrome-outline` recipes with black fills, white outlines, and shared 320px source-size profiles; legacy Forge/vector data remains available as reference.
  - Evidence: 2026-05-28 prototype completion pass expanded monochrome Enemy Lab coverage to all local prototype concepts from `Docs/references/Enemy_Prototype/Preview Files` and added validation for every active definition.
  - Next: pair the monochrome silhouettes with final telegraph/audio cues for sniper, charger, exploder, support, and carrier roles.
- [~] Pickup/resource assets are cohesive.
  - Done when: scrap tiers, upgrade crates, future fuel cells, and future rare parts are distinct at gameplay scale.
  - Next: finish scrap tier polish and separate debris from collectible scrap.
- [~] UI icon set is cohesive.
  - Done when: mission, radar, resource, stat, weapon, upgrade, and telegraph icons use one locked style in HUD/shop/results.
  - Next: review AI candidates and promote a selected icon set.
- [~] Asteroid/debris/black-hole art matches final direction.
  - Done when: world hazards read clearly and do not feel visually detached from the final object style.
  - Evidence: 2026-05-28 monochrome object pass replaced active asteroid PNG selection with deterministic procedural black-fill/white-outline chunks, seeded by tier/family and sized through shared 320px source profiles.
  - Evidence: 2026-05-28 prototype completion pass expanded deterministic asteroid families from 4 to 12 and replaced Enemy Lab asteroid clutter with the shared asteroid visual generator plus a source-scale gallery.
  - Next: validate asteroid readability in dense live runs, then apply the same final-direction treatment to debris and black-hole warnings.

## G. Audio, Accessibility, And Settings

- [~] First audio pass exists.
  - Done when: master/music/SFX/UI sliders work and core sounds exist for player fire, enemy fire, hit, hull damage, pickup, upgrade, low fuel, mission complete, eject, and black-hole warning.
  - Evidence: 2026-05-28 first SFX pass added procedural Web Audio cues for player/enemy fire, impacts, shield/world/debris feedback, hull damage/death/eject, pickups/upgrades, low fuel, mission complete, black-hole warning, and UI confirm/back/tab/error.
  - Evidence: 2026-05-28 pass wired master, SFX, UI, and mute settings to playback and added an audio harness covering effective gains and representative cue recording; music volume remains persisted and clearly reserved for the later music/ambience pass.
  - Evidence: 2026-05-28 pass softened player-fire and player-burst-fire procedural cues by lowering high-frequency content, reducing gain, and switching brittle oscillators to triangle waves.
  - Next: add actual music/ambience sources, then promote this from partial to complete once the music slider controls an active source.
- [ ] Enemy and hazard audio cues exist.
  - Done when: dangerous enemy actions and major hazards have recognizable cues that improve readability.
  - Next: pair cues with telegraph pass.
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
  - Next: keep build required after implementation changes.
- [~] Smoke harness coverage exists.
  - Done when: key run flows, HUD, results, settings, mission, fuel, eject, and progression flows have stable harness or screenshot coverage.
  - Evidence: 2026-05-28 pass added a `pauseSettings` visual module harness path and captured desktop/narrow settings screenshots for pre-run and pause settings.
  - Evidence: 2026-05-28 Enemy Lab vector harness loads `/enemy-lab.html?testHarness=enemyLabVector`, marks `data-starvivors-enemy-lab-harness="vector-ready"`, and captures `artifacts/visual-smoke/enemy-lab-vector-harness-1280x720.png`.
  - Evidence: 2026-05-28 monochrome object pass added `/enemy-lab.html?testHarness=enemyLabMonochrome`, verified `data-starvivors-enemy-lab-harness="monochrome-ready"`, verified live `?testHarness=smoke` pass, and captured `artifacts/visual-smoke/enemy-lab-monochrome-1280x720.png`.
  - Evidence: 2026-05-28 prototype completion pass added `/enemy-lab.html?testHarness=enemyLabPrototype`, captured `artifacts/visual-smoke/enemy-lab-prototype-gallery-1280x720.png`, and reverified live smoke with `artifacts/visual-smoke/live-smoke-after-prototype-enemies-1280x720.png`.
  - Next: add screenshot smoke set for command, hangar, shop, upgrade overlay, HUD, minimap/radar levels, results, and Enemy Lab Forge.
- [~] Performance profiling exists.
  - Done when: repeatable stress scenarios exist for asteroid burst, swarm, mothership, rare event, high-upgrade Pulse, beam, and black hole.
  - Next: create canned 2-minute stress runs.
- [!] GameScene remains a broad orchestration risk.
  - Done when: new work stays in focused modules and existing broad responsibilities are extracted only in behavior-preserving slices.
  - Next: keep using `Docs/GAMESCENE_REFACTOR_PLAN.md` before moving code.
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
