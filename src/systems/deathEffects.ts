import Phaser from 'phaser';

export type DeathShardStyle = 'ship' | 'player' | 'asteroid' | 'blackHoleShip' | 'blackHoleAsteroid';

export type DeathShardTuningKey =
  | 'countScale'
  | 'lifetimeScale'
  | 'sizeScale'
  | 'inheritedVelocityScale'
  | 'burstSpeedScale'
  | 'alphaScale'
  | 'dissolveStart';

export interface DeathShard {
  image: Phaser.GameObjects.Image;
  velocity: Phaser.Math.Vector2;
  rotationSpeed: number;
  ageMs: number;
  lifetimeMs: number;
  dissolveStart: number;
  startScaleX: number;
  startScaleY: number;
  startAlpha: number;
}

export interface DeathShardEmitterInput {
  scene: Phaser.Scene;
  shards: DeathShard[];
  textureKey: string;
  x: number;
  y: number;
  displaySize: number;
  rotation: number;
  inheritedVelocity: Phaser.Math.Vector2;
  style: DeathShardStyle;
  tuning?: DeathShardStyleTuning;
  maxActive: number;
  getNearestWrappedRenderPosition: (x: number, y: number) => Phaser.Math.Vector2;
}

export interface UpdateDeathShardsInput {
  shards: DeathShard[];
  deltaMs: number;
}

export interface DeathShardStyleTuning {
  countScale: number;
  lifetimeScale: number;
  sizeScale: number;
  inheritedVelocityScale: number;
  burstSpeedScale: number;
  alphaScale: number;
  dissolveStart: number;
}

export type DeathShardTuningMap = Record<DeathShardStyle, DeathShardStyleTuning>;

interface DeathShardStyleConfig {
  countMin: number;
  countMax: number;
  lifetimeMin: number;
  lifetimeMax: number;
  inheritedVelocityScale: number;
  burstMin: number;
  burstMax: number;
  displayScaleMin: number;
  displayScaleMax: number;
  alpha: number;
  depth: number;
  tintChoices: number[];
  dissolveStart: number;
  angleJitter: number;
}

export const DEATH_SHARD_STYLES: DeathShardStyle[] = ['ship', 'player', 'asteroid', 'blackHoleShip', 'blackHoleAsteroid'];

export const DEFAULT_DEATH_SHARD_TUNING: DeathShardTuningMap = {
  ship: {
    countScale: 1.2,
    lifetimeScale: 1.65,
    sizeScale: 1.75,
    inheritedVelocityScale: 1,
    burstSpeedScale: 0.82,
    alphaScale: 1,
    dissolveStart: 0.56
  },
  player: {
    countScale: 1.35,
    lifetimeScale: 1.42,
    sizeScale: 2.35,
    inheritedVelocityScale: 1.15,
    burstSpeedScale: 1.45,
    alphaScale: 1,
    dissolveStart: 0.68
  },
  asteroid: {
    countScale: 1.1,
    lifetimeScale: 1.35,
    sizeScale: 1.45,
    inheritedVelocityScale: 1,
    burstSpeedScale: 0.75,
    alphaScale: 1,
    dissolveStart: 0.5
  },
  blackHoleShip: {
    countScale: 1.15,
    lifetimeScale: 1.35,
    sizeScale: 1.55,
    inheritedVelocityScale: 1.05,
    burstSpeedScale: 0.7,
    alphaScale: 1,
    dissolveStart: 0.46
  },
  blackHoleAsteroid: {
    countScale: 1.1,
    lifetimeScale: 1.25,
    sizeScale: 1.35,
    inheritedVelocityScale: 1,
    burstSpeedScale: 0.68,
    alphaScale: 1,
    dissolveStart: 0.42
  }
};

const DEATH_SHARD_STYLE_CONFIGS: Record<DeathShardStyle, DeathShardStyleConfig> = {
  ship: {
    countMin: 5,
    countMax: 10,
    lifetimeMin: 620,
    lifetimeMax: 920,
    inheritedVelocityScale: 0.72,
    burstMin: 58,
    burstMax: 178,
    displayScaleMin: 0.8,
    displayScaleMax: 1.18,
    alpha: 0.94,
    depth: 13,
    tintChoices: [0xf2fbff, 0xffc857, 0xff8f4f, 0x9fb7c8],
    dissolveStart: 0.42,
    angleJitter: 0.58
  },
  player: {
    countMin: 18,
    countMax: 28,
    lifetimeMin: 1450,
    lifetimeMax: 2150,
    inheritedVelocityScale: 1.08,
    burstMin: 145,
    burstMax: 430,
    displayScaleMin: 1.02,
    displayScaleMax: 1.58,
    alpha: 1,
    depth: 14,
    tintChoices: [0xf2fbff, 0xff5964, 0xffc857, 0x73f2ff],
    dissolveStart: 0.56,
    angleJitter: 1.08
  },
  asteroid: {
    countMin: 3,
    countMax: 7,
    lifetimeMin: 520,
    lifetimeMax: 860,
    inheritedVelocityScale: 0.62,
    burstMin: 28,
    burstMax: 105,
    displayScaleMin: 0.7,
    displayScaleMax: 1.05,
    alpha: 0.74,
    depth: 6,
    tintChoices: [0x9b8b75, 0xc2ad8f, 0xe4d6bd, 0x8fb6c8],
    dissolveStart: 0.34,
    angleJitter: 0.58
  },
  blackHoleShip: {
    countMin: 5,
    countMax: 9,
    lifetimeMin: 430,
    lifetimeMax: 720,
    inheritedVelocityScale: 1.05,
    burstMin: 36,
    burstMax: 118,
    displayScaleMin: 0.78,
    displayScaleMax: 1.08,
    alpha: 0.88,
    depth: 13,
    tintChoices: [0xb88cff, 0x73f2ff, 0xf2fbff, 0x6f89b7],
    dissolveStart: 0.28,
    angleJitter: 0.58
  },
  blackHoleAsteroid: {
    countMin: 2,
    countMax: 5,
    lifetimeMin: 380,
    lifetimeMax: 680,
    inheritedVelocityScale: 0.85,
    burstMin: 20,
    burstMax: 76,
    displayScaleMin: 0.64,
    displayScaleMax: 0.95,
    alpha: 0.62,
    depth: 6,
    tintChoices: [0xb88cff, 0x8fb6c8, 0xc2ad8f],
    dissolveStart: 0.24,
    angleJitter: 0.58
  }
};

export function emitDeathShards(input: DeathShardEmitterInput): void {
  const textureFrame = input.scene.textures.getFrame(input.textureKey);
  if (!textureFrame) {
    return;
  }

  const config = DEATH_SHARD_STYLE_CONFIGS[input.style];
  const tuning = input.tuning ?? DEFAULT_DEATH_SHARD_TUNING[input.style];
  const count = Math.max(
    1,
    Math.round(Phaser.Math.Between(config.countMin, config.countMax) * tuning.countScale)
  );
  const sourceWidth = textureFrame.width;
  const sourceHeight = textureFrame.height;
  const origin = input.getNearestWrappedRenderPosition(input.x, input.y);

  for (let i = 0; i < count; i += 1) {
    while (input.shards.length >= input.maxActive) {
      destroyDeathShard(input.shards.shift());
    }

    const cropWidth = Phaser.Math.Between(
      Math.max(6, Math.round(sourceWidth * 0.14)),
      Math.max(7, Math.round(sourceWidth * 0.34))
    );
    const cropHeight = Phaser.Math.Between(
      Math.max(6, Math.round(sourceHeight * 0.14)),
      Math.max(7, Math.round(sourceHeight * 0.34))
    );
    const cropX = Phaser.Math.Between(0, Math.max(0, sourceWidth - cropWidth));
    const cropY = Phaser.Math.Between(0, Math.max(0, sourceHeight - cropHeight));
    const localX = ((cropX + cropWidth * 0.5) / sourceWidth - 0.5) * input.displaySize;
    const localY = ((cropY + cropHeight * 0.5) / sourceHeight - 0.5) * input.displaySize;
    const rotatedOffset = new Phaser.Math.Vector2(localX, localY).rotate(input.rotation);
    const angle = Math.atan2(rotatedOffset.y, rotatedOffset.x) + Phaser.Math.FloatBetween(-config.angleJitter, config.angleJitter);
    const burstSpeed = Phaser.Math.FloatBetween(config.burstMin, config.burstMax) * tuning.burstSpeedScale;
    const displayScale = Phaser.Math.FloatBetween(config.displayScaleMin, config.displayScaleMax) * tuning.sizeScale;
    const image = input.scene.add.image(origin.x + rotatedOffset.x, origin.y + rotatedOffset.y, input.textureKey);

    image.setOrigin(0.5, 0.5);
    image.setCrop(cropX, cropY, cropWidth, cropHeight);
    image.setDisplaySize(
      Math.max(3, input.displaySize * (cropWidth / sourceWidth) * displayScale),
      Math.max(3, input.displaySize * (cropHeight / sourceHeight) * displayScale)
    );
    image.setRotation(input.rotation + Phaser.Math.FloatBetween(-0.28, 0.28));
    const alpha = Phaser.Math.Clamp(config.alpha * tuning.alphaScale, 0, 1);

    image.setAlpha(alpha);
    image.setTint(Phaser.Utils.Array.GetRandom(config.tintChoices));
    image.setDepth(config.depth);

    if (input.style !== 'asteroid' && input.style !== 'blackHoleAsteroid') {
      image.setBlendMode(Phaser.BlendModes.ADD);
    }

    input.shards.push({
      image,
      velocity: input.inheritedVelocity
        .clone()
        .scale(config.inheritedVelocityScale * tuning.inheritedVelocityScale)
        .add(new Phaser.Math.Vector2(Math.cos(angle) * burstSpeed, Math.sin(angle) * burstSpeed)),
      rotationSpeed: Phaser.Math.FloatBetween(1.4, 5.6) * (Phaser.Math.Between(0, 1) === 0 ? -1 : 1),
      ageMs: 0,
      lifetimeMs: Math.round(Phaser.Math.Between(config.lifetimeMin, config.lifetimeMax) * tuning.lifetimeScale),
      dissolveStart: Phaser.Math.Clamp(tuning.dissolveStart, 0, 0.9),
      startScaleX: image.scaleX,
      startScaleY: image.scaleY,
      startAlpha: alpha
    });
  }
}

export function updateDeathShards(input: UpdateDeathShardsInput): DeathShard[] {
  const shards = [...input.shards];
  const deltaSeconds = input.deltaMs / 1000;

  for (let i = shards.length - 1; i >= 0; i -= 1) {
    const shard = shards[i];
    shard.ageMs += input.deltaMs;

    const progress = Phaser.Math.Clamp(shard.ageMs / Math.max(1, shard.lifetimeMs), 0, 1);
    const dissolveProgress =
      progress <= shard.dissolveStart
        ? 0
        : (progress - shard.dissolveStart) / Math.max(0.01, 1 - shard.dissolveStart);
    const easedDissolve = Phaser.Math.Easing.Quadratic.In(Phaser.Math.Clamp(dissolveProgress, 0, 1));

    shard.image.x += shard.velocity.x * deltaSeconds;
    shard.image.y += shard.velocity.y * deltaSeconds;
    shard.image.rotation += shard.rotationSpeed * deltaSeconds;
    shard.image.setAlpha(shard.startAlpha * (1 - easedDissolve));
    shard.image.setScale(
      shard.startScaleX * Phaser.Math.Linear(1, 0.38, easedDissolve),
      shard.startScaleY * Phaser.Math.Linear(1, 0.38, easedDissolve)
    );
    shard.velocity.scale(Math.pow(0.988, input.deltaMs / 16.6667));

    if (progress >= 1) {
      destroyDeathShard(shard);
      shards.splice(i, 1);
    }
  }

  return shards;
}

export function clearDeathShards(shards: DeathShard[]): DeathShard[] {
  for (const shard of shards) {
    destroyDeathShard(shard);
  }

  return [];
}

function destroyDeathShard(shard: DeathShard | undefined): void {
  if (!shard) {
    return;
  }

  shard.image.destroy();
}
