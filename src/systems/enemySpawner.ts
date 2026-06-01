import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import {
  ENEMY_DEFINITIONS,
  ENEMY_SQUADS,
  getEnemyDefinition,
  type EnemyDefinition,
  type EnemySquadDefinition
} from '../data/enemyDefinitions';
import {
  getEnemyVariantAsset,
  getRandomEnemyVariantAsset
} from '../data/gameplayPngAssets';
import { createEnemyVisualContainer } from './enemyVisuals';
import { resolveEnemyDefinitionSize } from './enemyVectorRecipes';

export interface EnemyTelegraphs {
  chargeLine?: Phaser.GameObjects.Line;
  chargeLane?: Phaser.GameObjects.Image;
  warningCircle?: Phaser.GameObjects.Image;
  beamLine?: Phaser.GameObjects.Line;
  auraCircle?: Phaser.GameObjects.Image;
  shieldArc?: Phaser.GameObjects.Image;
  patrolPath?: Phaser.GameObjects.Graphics;
}

export interface EnemyInstance {
  id: string;
  definitionId: string;
  variantId?: string;
  definition: EnemyDefinition;
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  previousX: number;
  previousY: number;
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
  telegraphs: EnemyTelegraphs;
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

export interface SpawnEnemyInput {
  scene: Phaser.Scene;
  arena: ArenaSize;
  definitionId: string;
  definitionOverride?: EnemyDefinition;
  variantId?: string;
  x: number;
  y: number;
  time: number;
  hpMultiplier: number;
  showDebugLabel: boolean;
  random?: () => number;
}

let nextEnemyRuntimeId = 1;

export function getEnemyDefinitions(): EnemyDefinition[] {
  return ENEMY_DEFINITIONS;
}

export function getEnemySquads(): EnemySquadDefinition[] {
  return ENEMY_SQUADS;
}

export function spawnEnemy(input: SpawnEnemyInput): EnemyInstance {
  const definition = input.definitionOverride ?? getEnemyDefinition(input.definitionId);
  const x = wrapCoordinate(input.x, input.arena.width);
  const y = wrapCoordinate(input.y, input.arena.height);
  const hp = Math.max(1, definition.stats.hp * input.hpMultiplier);
  const variant =
    getEnemyVariantAsset(definition.id, input.variantId) ??
    getRandomEnemyVariantAsset(definition.id, input.random);
  const body = createEnemyVisualContainer(input.scene, x, y, definition, { textureKey: variant?.textureKey });
  const wrapMirrorBody = createEnemyVisualContainer(input.scene, x, y, definition, { textureKey: variant?.textureKey });
  wrapMirrorBody.setVisible(false);

  const instance: EnemyInstance = {
    id: `enemy-${nextEnemyRuntimeId++}`,
    definitionId: definition.id,
    variantId: variant?.variantId,
    definition,
    body,
    wrapMirrorBody,
    previousX: x,
    previousY: y,
    velocity: new Phaser.Math.Vector2(0, 0),
    knockbackVelocity: new Phaser.Math.Vector2(0, 0),
    blackHoleVelocity: new Phaser.Math.Vector2(0, 0),
    hp,
    maxHp: hp,
    hitRadius: resolveEnemyDefinitionSize(definition).collisionRadiusPx,
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
    instance.debugLabel = createEnemyDebugLabel(input.scene, instance);
  }

  return instance;
}

export function spawnEnemySquad(input: {
  scene: Phaser.Scene;
  arena: ArenaSize;
  squadId: string;
  centerX: number;
  centerY: number;
  time: number;
  hpMultiplier: number;
  showDebugLabel: boolean;
  random?: () => number;
}): EnemyInstance[] {
  const squad = ENEMY_SQUADS.find((candidate) => candidate.id === input.squadId) ?? ENEMY_SQUADS[0];
  const totalCount = squad.entries.reduce((sum, entry) => sum + entry.count, 0);
  const enemies: EnemyInstance[] = [];
  let index = 0;

  for (const entry of squad.entries) {
    for (let i = 0; i < entry.count; i += 1) {
      const angle = (Math.PI * 2 * index) / Math.max(1, totalCount);
      const ring = squad.radius * (0.38 + 0.62 * ((index % 3) / 2));
      enemies.push(
        spawnEnemy({
          scene: input.scene,
          arena: input.arena,
          definitionId: entry.definitionId,
          x: input.centerX + Math.cos(angle) * ring,
          y: input.centerY + Math.sin(angle) * ring,
          time: input.time,
          hpMultiplier: input.hpMultiplier,
          showDebugLabel: input.showDebugLabel,
          random: input.random
        })
      );
      index += 1;
    }
  }

  return enemies;
}

export function clearEnemyInstances(enemies: EnemyInstance[]): EnemyInstance[] {
  for (const enemy of enemies) {
    destroyEnemyInstance(enemy);
  }

  return [];
}

export function destroyEnemyInstance(enemy: EnemyInstance): void {
  enemy.body.destroy(true);
  enemy.wrapMirrorBody.destroy(true);
  enemy.debugLabel?.destroy();
  destroyTelegraphs(enemy);
}

export function destroyTelegraphs(enemy: EnemyInstance): void {
  enemy.telegraphs.chargeLine?.destroy();
  enemy.telegraphs.chargeLane?.destroy();
  enemy.telegraphs.warningCircle?.destroy();
  enemy.telegraphs.beamLine?.destroy();
  enemy.telegraphs.auraCircle?.destroy();
  enemy.telegraphs.shieldArc?.destroy();
  enemy.telegraphs.patrolPath?.destroy();
  enemy.telegraphs = {};
}

export function setEnemyDebugLabels(
  scene: Phaser.Scene,
  enemies: EnemyInstance[],
  enabled: boolean
): void {
  for (const enemy of enemies) {
    if (enabled && !enemy.debugLabel) {
      enemy.debugLabel = createEnemyDebugLabel(scene, enemy);
    } else if (!enabled && enemy.debugLabel) {
      enemy.debugLabel.destroy();
      enemy.debugLabel = undefined;
    }
  }
}

export function updateEnemyDebugLabel(enemy: EnemyInstance): void {
  if (!enemy.debugLabel) {
    return;
  }

  enemy.debugLabel.setPosition(enemy.body.x, enemy.body.y - resolveEnemyDefinitionSize(enemy.definition).visualDiameterPx * 0.62);
  enemy.debugLabel.setText(`${enemy.definition.displayName}\n${Math.ceil(enemy.hp)}/${Math.ceil(enemy.maxHp)} ${enemy.state}`);
}

function createEnemyDebugLabel(scene: Phaser.Scene, enemy: EnemyInstance): Phaser.GameObjects.Text {
  return scene.add
    .text(enemy.body.x, enemy.body.y - resolveEnemyDefinitionSize(enemy.definition).visualDiameterPx * 0.62, '', {
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
