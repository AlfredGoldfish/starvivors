import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import {
  ENEMY_LAB_DEFINITIONS,
  ENEMY_LAB_SQUADS,
  getEnemyLabDefinition,
  type EnemyLabDefinition,
  type EnemyLabSquadDefinition
} from '../data/enemyLabDefinitions';
import { createEnemyLabVisualContainer } from './enemyVisuals';

export interface EnemyLabTelegraphs {
  chargeLine?: Phaser.GameObjects.Line;
  warningCircle?: Phaser.GameObjects.Arc;
  beamLine?: Phaser.GameObjects.Line;
  auraCircle?: Phaser.GameObjects.Arc;
  shieldArc?: Phaser.GameObjects.Arc;
}

export interface EnemyLabInstance {
  id: string;
  definitionId: string;
  variantId?: string;
  definition: EnemyLabDefinition;
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  knockbackVelocity: Phaser.Math.Vector2;
  blackHoleVelocity: Phaser.Math.Vector2;
  hp: number;
  maxHp: number;
  hitRadius: number;
  state: string;
  stateStartedAt: number;
  nextFireAt: number;
  target?: Phaser.Math.Vector2;
  debugLabel?: Phaser.GameObjects.Text;
  telegraphs: EnemyLabTelegraphs;
  stateData: Record<string, number | string | boolean>;
  childrenSpawned: number;
  carriedScrap: number;
  damageReduction: number;
  speedMultiplier: number;
  fireRateMultiplier: number;
  damageMultiplier: number;
  shieldedUntil: number;
  buffedUntil: number;
  nextBlackHoleDamageAt: number;
}

export interface SpawnEnemyLabEnemyInput {
  scene: Phaser.Scene;
  arena: ArenaSize;
  definitionId: string;
  definitionOverride?: EnemyLabDefinition;
  variantId?: string;
  x: number;
  y: number;
  time: number;
  hpMultiplier: number;
  showDebugLabel: boolean;
}

let nextEnemyLabRuntimeId = 1;

export function getEnemyLabDefinitions(): EnemyLabDefinition[] {
  return ENEMY_LAB_DEFINITIONS;
}

export function getEnemyLabSquads(): EnemyLabSquadDefinition[] {
  return ENEMY_LAB_SQUADS;
}

export function spawnEnemyLabEnemy(input: SpawnEnemyLabEnemyInput): EnemyLabInstance {
  const definition = input.definitionOverride ?? getEnemyLabDefinition(input.definitionId);
  const x = wrapCoordinate(input.x, input.arena.width);
  const y = wrapCoordinate(input.y, input.arena.height);
  const hp = Math.max(1, definition.stats.hp * input.hpMultiplier);
  const body = createEnemyLabVisualContainer(input.scene, x, y, definition);
  const wrapMirrorBody = createEnemyLabVisualContainer(input.scene, x, y, definition);
  wrapMirrorBody.setVisible(false);

  const instance: EnemyLabInstance = {
    id: `enemy-lab-${nextEnemyLabRuntimeId++}`,
    definitionId: definition.id,
    variantId: input.variantId,
    definition,
    body,
    wrapMirrorBody,
    velocity: new Phaser.Math.Vector2(0, 0),
    knockbackVelocity: new Phaser.Math.Vector2(0, 0),
    blackHoleVelocity: new Phaser.Math.Vector2(0, 0),
    hp,
    maxHp: hp,
    hitRadius: definition.stats.radius,
    state: 'idle',
    stateStartedAt: input.time,
    nextFireAt: input.time + Phaser.Math.Between(250, definition.weapon?.cooldownMs ?? 1100),
    telegraphs: {},
    stateData: {},
    childrenSpawned: 0,
    carriedScrap: 0,
    damageReduction: 0,
    speedMultiplier: 1,
    fireRateMultiplier: 1,
    damageMultiplier: 1,
    shieldedUntil: 0,
    buffedUntil: 0,
    nextBlackHoleDamageAt: 0
  };

  if (input.showDebugLabel) {
    instance.debugLabel = createEnemyLabel(input.scene, instance);
  }

  return instance;
}

export function spawnEnemyLabSquad(input: {
  scene: Phaser.Scene;
  arena: ArenaSize;
  squadId: string;
  centerX: number;
  centerY: number;
  time: number;
  hpMultiplier: number;
  showDebugLabel: boolean;
}): EnemyLabInstance[] {
  const squad = ENEMY_LAB_SQUADS.find((candidate) => candidate.id === input.squadId) ?? ENEMY_LAB_SQUADS[0];
  const totalCount = squad.entries.reduce((sum, entry) => sum + entry.count, 0);
  const enemies: EnemyLabInstance[] = [];
  let index = 0;

  for (const entry of squad.entries) {
    for (let i = 0; i < entry.count; i += 1) {
      const angle = (Math.PI * 2 * index) / Math.max(1, totalCount);
      const ring = squad.radius * (0.38 + 0.62 * ((index % 3) / 2));
      enemies.push(
        spawnEnemyLabEnemy({
          scene: input.scene,
          arena: input.arena,
          definitionId: entry.definitionId,
          x: input.centerX + Math.cos(angle) * ring,
          y: input.centerY + Math.sin(angle) * ring,
          time: input.time,
          hpMultiplier: input.hpMultiplier,
          showDebugLabel: input.showDebugLabel
        })
      );
      index += 1;
    }
  }

  return enemies;
}

export function clearEnemyLabEnemies(enemies: EnemyLabInstance[]): EnemyLabInstance[] {
  for (const enemy of enemies) {
    destroyEnemyLabEnemy(enemy);
  }

  return [];
}

export function destroyEnemyLabEnemy(enemy: EnemyLabInstance): void {
  enemy.body.destroy(true);
  enemy.wrapMirrorBody.destroy(true);
  enemy.debugLabel?.destroy();
  destroyTelegraphs(enemy);
}

export function destroyTelegraphs(enemy: EnemyLabInstance): void {
  enemy.telegraphs.chargeLine?.destroy();
  enemy.telegraphs.warningCircle?.destroy();
  enemy.telegraphs.beamLine?.destroy();
  enemy.telegraphs.auraCircle?.destroy();
  enemy.telegraphs.shieldArc?.destroy();
  enemy.telegraphs = {};
}

export function setEnemyLabDebugLabels(
  scene: Phaser.Scene,
  enemies: EnemyLabInstance[],
  enabled: boolean
): void {
  for (const enemy of enemies) {
    if (enabled && !enemy.debugLabel) {
      enemy.debugLabel = createEnemyLabel(scene, enemy);
    } else if (!enabled && enemy.debugLabel) {
      enemy.debugLabel.destroy();
      enemy.debugLabel = undefined;
    }
  }
}

export function updateEnemyLabDebugLabel(enemy: EnemyLabInstance): void {
  if (!enemy.debugLabel) {
    return;
  }

  enemy.debugLabel.setPosition(enemy.body.x, enemy.body.y - enemy.definition.visual.size * 0.62);
  enemy.debugLabel.setText(`${enemy.definition.displayName}\n${Math.ceil(enemy.hp)}/${Math.ceil(enemy.maxHp)} ${enemy.state}`);
}

function createEnemyLabel(scene: Phaser.Scene, enemy: EnemyLabInstance): Phaser.GameObjects.Text {
  return scene.add
    .text(enemy.body.x, enemy.body.y - enemy.definition.visual.size * 0.62, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#f2fbff',
      align: 'center',
      stroke: '#02040a',
      strokeThickness: 3
    })
    .setOrigin(0.5, 1)
    .setDepth(30);
}
