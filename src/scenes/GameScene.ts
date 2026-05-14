import Phaser from 'phaser';
import asteroidVariant1Url from '../../assets/asteroids/astroid_1.png';
import asteroidVariant2Url from '../../assets/asteroids/astroid_2.png';
import asteroidVariant3Url from '../../assets/asteroids/astroid_3.png';
import asteroidVariant4Url from '../../assets/asteroids/astroid_4.png';
import enemyShipUrl from '../../assets/ships/spaceship_enemy_1.png';
import playerShipUrl from '../../assets/ships/spaceship_1.png';
import { createArenaSize, getArenaCenter, wrapCoordinate, type ArenaSize } from '../core/arena';
import { getViewportSize } from '../core/viewport';
import { basicEnemy } from '../data/enemies';
import { interceptorMovement } from '../data/balance';
import { pulseCannon } from '../data/weapons';

const STAR_COLORS = [0x52627f, 0x6f89b7, 0xa8c7ff, 0x42f5d7];
const BASIC_ENEMY_TEXTURE_KEY = 'basic-enemy-spaceship-1';
const PLAYER_SHIP_TEXTURE_KEY = 'player-ship-spaceship-1';
const ASTEROID_TEXTURES = [
  { key: 'asteroid-variant-1', url: asteroidVariant1Url },
  { key: 'asteroid-variant-2', url: asteroidVariant2Url },
  { key: 'asteroid-variant-3', url: asteroidVariant3Url },
  { key: 'asteroid-variant-4', url: asteroidVariant4Url }
] as const;
const STARFIELD_TEXTURE_KEY = 'starvivors-starfield-tile';
const GRID_TEXTURE_KEY = 'starvivors-grid-tile';
const BACKGROUND_TILE_SIZE = 1024;
const DEBUG_UPDATE_INTERVAL_MS = 150;
const PULSE_CANNON_MUZZLE_OFFSET = 36;
const PULSE_TRAIL_OFFSET = 11;
const PULSE_TRAIL_FADE_MS = 220;
const PULSE_TRAIL_INTERVAL_MS = 28;
const PLAYER_SHIP_DISPLAY_SIZE = 118;
const PLAYER_SHIP_VISUAL_ROTATION = Math.PI;
const THRUSTER_FADE_MS = 170;
const FORWARD_THRUSTER_INTERVAL_MS = 26;
const SECONDARY_THRUSTER_INTERVAL_MS = 42;
const BASIC_ENEMY_COUNT = 6;
const BASIC_ENEMY_DISPLAY_SIZE = 86;
const BASIC_ENEMY_VISUAL_ROTATION = Math.PI;
const BASIC_ASTEROID_COUNT = 9;
const ASTEROID_MIN_ROTATION_SPEED = 0.08;
const ASTEROID_MAX_ROTATION_SPEED = 0.26;
const ASTEROID_SAFE_SPAWN_RADIUS = 520;
const ASTEROID_PARENT_VELOCITY_INHERITANCE = 0.62;
const ASTEROID_FRAGMENT_BURST_MIN_SPEED = 36;
const ASTEROID_FRAGMENT_BURST_MAX_SPEED = 128;
const PULSE_CANNON_ASTEROID_DAMAGE = 1;
const PROJECTILE_HIT_RADIUS = 8;

type AsteroidTier = 1 | 2 | 3 | 4 | 5;
type AsteroidBreakupProfileMode = 'many-small' | 'balanced' | 'few-large' | 'single-tier';

interface AsteroidTierConfig {
  displaySize: number;
  hitRadius: number;
  hp: number;
  massBudget: number;
  minSpeed: number;
  maxSpeed: number;
  impactImpulse: number;
  maxVelocity: number;
}

const ASTEROID_TIER_CONFIG: Record<AsteroidTier, AsteroidTierConfig> = {
  1: {
    displaySize: 52,
    hitRadius: 20,
    hp: 1,
    massBudget: 1,
    minSpeed: 92,
    maxSpeed: 160,
    impactImpulse: 94,
    maxVelocity: 245
  },
  2: {
    displaySize: 76,
    hitRadius: 30,
    hp: 2,
    massBudget: 4,
    minSpeed: 76,
    maxSpeed: 138,
    impactImpulse: 78,
    maxVelocity: 220
  },
  3: {
    displaySize: 108,
    hitRadius: 42,
    hp: 3,
    massBudget: 8,
    minSpeed: 54,
    maxSpeed: 112,
    impactImpulse: 58,
    maxVelocity: 190
  },
  4: {
    displaySize: 154,
    hitRadius: 58,
    hp: 5,
    massBudget: 16,
    minSpeed: 34,
    maxSpeed: 78,
    impactImpulse: 36,
    maxVelocity: 155
  },
  5: {
    displaySize: 196,
    hitRadius: 74,
    hp: 8,
    massBudget: 32,
    minSpeed: 22,
    maxSpeed: 56,
    impactImpulse: 24,
    maxVelocity: 125
  }
};

const ASTEROID_TIERS: AsteroidTier[] = [1, 2, 3, 4, 5];
const INITIAL_ASTEROID_TIERS: AsteroidTier[] = [5, 5, 4, 4, 4, 3, 3, 2, 2, 1];

interface PulseCannonProjectile {
  body: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  expiresAt: number;
  distanceRemaining: number;
  nextTrailAt: number;
}

interface BasicEnemy {
  body: Phaser.GameObjects.Container;
}

interface BasicAsteroid {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  variant: string;
  tier: AsteroidTier;
  hp: number;
  breakupProfile: AsteroidBreakupProfile;
  velocity: Phaser.Math.Vector2;
  rotationSpeed: number;
  hitRadius: number;
}

interface AsteroidBreakupProfile {
  mode: AsteroidBreakupProfileMode;
  preferredTier?: AsteroidTier;
  burstMultiplier: number;
  spreadMultiplier: number;
}

export class GameScene extends Phaser.Scene {
  private arena!: ArenaSize;
  private player!: Phaser.GameObjects.Container;
  private playerVelocity = new Phaser.Math.Vector2(0, 0);
  private debugText!: Phaser.GameObjects.Text;
  private starfield!: Phaser.GameObjects.TileSprite;
  private grid!: Phaser.GameObjects.TileSprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private fireKey!: Phaser.Input.Keyboard.Key;
  private pulseCannonProjectiles: PulseCannonProjectile[] = [];
  private basicEnemies: BasicEnemy[] = [];
  private basicAsteroids: BasicAsteroid[] = [];
  private asteroidCameraViewCount = 0;
  private asteroidWrappedViewCount = 0;
  private asteroidWrapMirrorCount = 0;
  private nextPulseCannonFireAt = 0;
  private nextForwardThrusterAt = 0;
  private nextReverseThrusterAt = 0;
  private nextLeftStrafeThrusterAt = 0;
  private nextRightStrafeThrusterAt = 0;
  private nextDebugUpdateAt = 0;

  constructor() {
    super('GameScene');
  }

  preload(): void {
    for (const asteroidTexture of ASTEROID_TEXTURES) {
      this.load.image(asteroidTexture.key, asteroidTexture.url);
    }

    this.load.image(BASIC_ENEMY_TEXTURE_KEY, enemyShipUrl);
    this.load.image(PLAYER_SHIP_TEXTURE_KEY, playerShipUrl);
  }

  create(): void {
    this.createInput();
    this.createBackgroundTextures();
    this.rebuildWorld();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  update(time: number, delta: number): void {
    this.updatePlayerMovement(time, delta / 1000);
    this.updateBasicEnemies(delta / 1000);
    this.updateBasicAsteroids(delta / 1000);
    this.updatePulseCannon(time);
    this.updatePulseCannonProjectiles(time, delta / 1000);
    this.wrapPlayer();
    this.updateBackgroundTiles();
    this.updateDebugText(time);
  }

  private createInput(): void {
    if (!this.input.keyboard) {
      throw new Error('Keyboard input is required for the STARVIVORS scaffold.');
    }

    this.input.mouse?.disableContextMenu();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D') as Record<
      'W' | 'A' | 'S' | 'D',
      Phaser.Input.Keyboard.Key
    >;
    this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  private rebuildWorld(): void {
    const viewport = getViewportSize(this);
    this.arena = createArenaSize(viewport);
    const center = getArenaCenter(this.arena);

    this.children.removeAll(true);
    this.playerVelocity.set(0, 0);
    this.pulseCannonProjectiles = [];
    this.basicEnemies = [];
    this.basicAsteroids = [];
    this.asteroidCameraViewCount = 0;
    this.asteroidWrappedViewCount = 0;
    this.asteroidWrapMirrorCount = 0;
    this.nextPulseCannonFireAt = 0;
    this.nextForwardThrusterAt = 0;
    this.nextReverseThrusterAt = 0;
    this.nextLeftStrafeThrusterAt = 0;
    this.nextRightStrafeThrusterAt = 0;
    this.nextDebugUpdateAt = 0;

    this.createStarfield();
    this.player = this.createPlayerShip(center.x, center.y);
    this.createBasicEnemies(center);
    this.createBasicAsteroids(center);
    this.cameras.main.startFollow(this.player, true, 1, 1);
    this.cameras.main.centerOn(center.x, center.y);

    this.debugText = this.add
      .text(16, 16, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '14px',
        color: '#c8f7ff',
        backgroundColor: 'rgba(2, 4, 10, 0.72)',
        padding: { x: 10, y: 8 }
      })
      .setScrollFactor(0)
      .setDepth(1000);

    this.updateDebugText(0);
  }

  private createBackgroundTextures(): void {
    if (!this.textures.exists(STARFIELD_TEXTURE_KEY)) {
      const starTexture = this.textures.createCanvas(
        STARFIELD_TEXTURE_KEY,
        BACKGROUND_TILE_SIZE,
        BACKGROUND_TILE_SIZE
      );

      if (starTexture) {
        const context = starTexture.getContext();
        const random = new Phaser.Math.RandomDataGenerator(['starvivors-starfield-tile']);

        context.fillStyle = '#02040a';
        context.fillRect(0, 0, BACKGROUND_TILE_SIZE, BACKGROUND_TILE_SIZE);

        for (let i = 0; i < 220; i += 1) {
          const x = random.between(0, BACKGROUND_TILE_SIZE);
          const y = random.between(0, BACKGROUND_TILE_SIZE);
          const radius = random.realInRange(0.5, 1.7);
          const alpha = random.realInRange(0.35, 0.95);
          const color = Phaser.Display.Color.IntegerToColor(Phaser.Utils.Array.GetRandom(STAR_COLORS));

          context.globalAlpha = alpha;
          context.fillStyle = color.rgba;
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();
        }

        context.globalAlpha = 1;
        starTexture.refresh();
      }
    }

    if (!this.textures.exists(GRID_TEXTURE_KEY)) {
      const gridTexture = this.textures.createCanvas(GRID_TEXTURE_KEY, BACKGROUND_TILE_SIZE, BACKGROUND_TILE_SIZE);

      if (gridTexture) {
        const context = gridTexture.getContext();
        this.drawTacticalGridTexture(context);
        gridTexture.refresh();
      }
    }
  }

  private createStarfield(): void {
    this.starfield = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, STARFIELD_TEXTURE_KEY)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-20);

    this.grid = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, GRID_TEXTURE_KEY)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-10);

    this.updateBackgroundTiles();
  }

  private drawTacticalGridTexture(context: CanvasRenderingContext2D): void {
    const majorLine = 480;
    const minorLine = 240;

    context.clearRect(0, 0, BACKGROUND_TILE_SIZE, BACKGROUND_TILE_SIZE);
    context.lineWidth = 1;
    context.strokeStyle = 'rgba(18, 50, 74, 0.28)';

    for (let x = 0; x <= BACKGROUND_TILE_SIZE; x += minorLine) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, BACKGROUND_TILE_SIZE);
      context.stroke();
    }

    for (let y = 0; y <= BACKGROUND_TILE_SIZE; y += minorLine) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(BACKGROUND_TILE_SIZE, y);
      context.stroke();
    }

    context.strokeStyle = 'rgba(29, 224, 255, 0.34)';
    for (let x = 0; x <= BACKGROUND_TILE_SIZE; x += majorLine) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, BACKGROUND_TILE_SIZE);
      context.stroke();
    }

    for (let y = 0; y <= BACKGROUND_TILE_SIZE; y += majorLine) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(BACKGROUND_TILE_SIZE, y);
      context.stroke();
    }
  }

  private createPlayerShip(x: number, y: number): Phaser.GameObjects.Container {
    const sprite = this.add.image(0, 0, PLAYER_SHIP_TEXTURE_KEY);
    sprite.setOrigin(0.5, 0.5);
    sprite.setDisplaySize(PLAYER_SHIP_DISPLAY_SIZE, PLAYER_SHIP_DISPLAY_SIZE);
    sprite.setRotation(PLAYER_SHIP_VISUAL_ROTATION);

    const ship = this.add.container(x, y, [sprite]);
    ship.setDepth(10);

    return ship;
  }

  private createBasicEnemies(center: Phaser.Math.Vector2): void {
    const spawnDistance = Math.max(this.scale.width, this.scale.height) * 0.78;

    for (let index = 0; index < BASIC_ENEMY_COUNT; index += 1) {
      const angle = (Math.PI * 2 * index) / BASIC_ENEMY_COUNT + Math.PI / 8;
      const x = wrapCoordinate(center.x + Math.cos(angle) * spawnDistance, this.arena.width);
      const y = wrapCoordinate(center.y + Math.sin(angle) * spawnDistance, this.arena.height);

      this.basicEnemies.push({
        body: this.createBasicEnemy(x, y)
      });
    }
  }

  private createBasicEnemy(x: number, y: number): Phaser.GameObjects.Container {
    const sprite = this.add.image(0, 0, BASIC_ENEMY_TEXTURE_KEY);
    sprite.setOrigin(0.5, 0.5);
    sprite.setDisplaySize(BASIC_ENEMY_DISPLAY_SIZE, BASIC_ENEMY_DISPLAY_SIZE);
    sprite.setRotation(BASIC_ENEMY_VISUAL_ROTATION);

    const enemy = this.add.container(x, y, [sprite]);
    enemy.setDepth(9);

    return enemy;
  }

  private createBasicAsteroids(center: Phaser.Math.Vector2): void {
    for (let index = 0; index < BASIC_ASTEROID_COUNT; index += 1) {
      let x = Phaser.Math.Between(0, this.arena.width);
      let y = Phaser.Math.Between(0, this.arena.height);
      const offsetFromPlayer = this.getWrappedDirection(center.x, center.y, x, y);

      if (offsetFromPlayer.length() < ASTEROID_SAFE_SPAWN_RADIUS) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        x = wrapCoordinate(center.x + Math.cos(angle) * ASTEROID_SAFE_SPAWN_RADIUS, this.arena.width);
        y = wrapCoordinate(center.y + Math.sin(angle) * ASTEROID_SAFE_SPAWN_RADIUS, this.arena.height);
      }

      this.basicAsteroids.push(this.createAsteroidInstance(x, y, this.getRandomInitialAsteroidTier()));
    }
  }

  private createAsteroidInstance(
    x: number,
    y: number,
    tier: AsteroidTier,
    velocity = this.createAsteroidVelocity(tier)
  ): BasicAsteroid {
    const tierConfig = ASTEROID_TIER_CONFIG[tier];
    const texture = ASTEROID_TEXTURES[Phaser.Math.Between(0, ASTEROID_TEXTURES.length - 1)];
    const body = this.createBasicAsteroid(x, y, texture.key, tierConfig.displaySize);
    const wrapMirrorBody = this.createBasicAsteroid(x, y, texture.key, tierConfig.displaySize);
    wrapMirrorBody.setVisible(false);

    return {
      body,
      wrapMirrorBody,
      variant: texture.key,
      tier,
      hp: tierConfig.hp,
      breakupProfile: this.createAsteroidBreakupProfile(tier),
      velocity,
      rotationSpeed:
        Phaser.Math.FloatBetween(ASTEROID_MIN_ROTATION_SPEED, ASTEROID_MAX_ROTATION_SPEED) *
        (Phaser.Math.Between(0, 1) === 0 ? -1 : 1),
      hitRadius: tierConfig.hitRadius
    };
  }

  private createBasicAsteroid(
    x: number,
    y: number,
    textureKey: string,
    displaySize: number
  ): Phaser.GameObjects.Container {
    const sprite = this.add.image(0, 0, textureKey);
    sprite.setOrigin(0.5, 0.5);
    sprite.setDisplaySize(displaySize, displaySize);

    const asteroid = this.add.container(x, y, [sprite]);
    asteroid.setSize(displaySize, displaySize);
    asteroid.setDepth(5);
    asteroid.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));

    return asteroid;
  }

  private getRandomInitialAsteroidTier(): AsteroidTier {
    return INITIAL_ASTEROID_TIERS[Phaser.Math.Between(0, INITIAL_ASTEROID_TIERS.length - 1)];
  }

  private createAsteroidVelocity(tier: AsteroidTier): Phaser.Math.Vector2 {
    const tierConfig = ASTEROID_TIER_CONFIG[tier];
    const driftAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const driftSpeed = Phaser.Math.FloatBetween(tierConfig.minSpeed, tierConfig.maxSpeed);

    return new Phaser.Math.Vector2(Math.cos(driftAngle) * driftSpeed, Math.sin(driftAngle) * driftSpeed);
  }

  private createAsteroidBreakupProfile(tier: AsteroidTier): AsteroidBreakupProfile {
    const modeRoll = Phaser.Math.Between(0, 3);
    const mode: AsteroidBreakupProfileMode =
      modeRoll === 0 ? 'many-small' : modeRoll === 1 ? 'balanced' : modeRoll === 2 ? 'few-large' : 'single-tier';
    const lowerTiers = this.getLowerAsteroidTiers(tier);

    return {
      mode,
      preferredTier:
        mode === 'single-tier' && lowerTiers.length > 0
          ? lowerTiers[Phaser.Math.Between(0, lowerTiers.length - 1)]
          : undefined,
      burstMultiplier: Phaser.Math.FloatBetween(0.85, 1.22),
      spreadMultiplier: Phaser.Math.FloatBetween(0.82, 1.28)
    };
  }

  private updatePlayerMovement(time: number, deltaSeconds: number): void {
    if (!this.player) {
      return;
    }

    this.updatePlayerFacing();

    const strafeLeft = this.wasdKeys.A.isDown || this.cursors.left.isDown;
    const strafeRight = this.wasdKeys.D.isDown || this.cursors.right.isDown;
    const thrustForward = this.wasdKeys.W.isDown || this.cursors.up.isDown;
    const thrustReverse = this.wasdKeys.S.isDown || this.cursors.down.isDown;
    const forward = this.getForwardDirection(this.player.rotation);
    const right = new Phaser.Math.Vector2(-forward.y, forward.x);

    if (thrustForward) {
      this.playerVelocity.x += forward.x * interceptorMovement.thrustAcceleration * deltaSeconds;
      this.playerVelocity.y += forward.y * interceptorMovement.thrustAcceleration * deltaSeconds;
    }

    if (thrustReverse) {
      this.playerVelocity.x -= forward.x * interceptorMovement.reverseThrustAcceleration * deltaSeconds;
      this.playerVelocity.y -= forward.y * interceptorMovement.reverseThrustAcceleration * deltaSeconds;
    }

    if (strafeLeft) {
      this.playerVelocity.x -= right.x * interceptorMovement.strafeThrustAcceleration * deltaSeconds;
      this.playerVelocity.y -= right.y * interceptorMovement.strafeThrustAcceleration * deltaSeconds;
    }

    if (strafeRight) {
      this.playerVelocity.x += right.x * interceptorMovement.strafeThrustAcceleration * deltaSeconds;
      this.playerVelocity.y += right.y * interceptorMovement.strafeThrustAcceleration * deltaSeconds;
    }

    this.updateThrusterEffects(time, thrustForward, thrustReverse, strafeLeft, strafeRight);

    this.playerVelocity.scale(Math.pow(interceptorMovement.lowFrictionDamping, deltaSeconds * 60));
    this.playerVelocity.limit(interceptorMovement.maxSpeed);

    this.player.x += this.playerVelocity.x * deltaSeconds;
    this.player.y += this.playerVelocity.y * deltaSeconds;
  }

  private updatePlayerFacing(): void {
    const pointer = this.input.activePointer;
    const pointerWorld = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const direction = this.getWrappedDirection(this.player.x, this.player.y, pointerWorld.x, pointerWorld.y);

    if (direction.lengthSq() > 0) {
      this.player.rotation = Math.atan2(direction.x, -direction.y);
    }
  }

  private updateThrusterEffects(
    time: number,
    thrustForward: boolean,
    thrustReverse: boolean,
    strafeLeft: boolean,
    strafeRight: boolean
  ): void {
    const forward = this.getForwardDirection(this.player.rotation);
    const right = new Phaser.Math.Vector2(-forward.y, forward.x);

    if (thrustForward && time >= this.nextForwardThrusterAt) {
      this.emitThrusterParticle({ x: -10, y: 39 }, forward.clone().negate(), 1, right);
      this.emitThrusterParticle({ x: 10, y: 39 }, forward.clone().negate(), 1, right);
      this.nextForwardThrusterAt = time + FORWARD_THRUSTER_INTERVAL_MS;
    }

    if (thrustReverse && time >= this.nextReverseThrusterAt) {
      this.emitThrusterParticle({ x: -9, y: -34 }, forward, 0.62, right);
      this.emitThrusterParticle({ x: 9, y: -34 }, forward, 0.62, right);
      this.nextReverseThrusterAt = time + SECONDARY_THRUSTER_INTERVAL_MS;
    }

    if (strafeLeft && time >= this.nextLeftStrafeThrusterAt) {
      this.emitThrusterParticle({ x: 35, y: 2 }, right, 0.48, right);
      this.nextLeftStrafeThrusterAt = time + SECONDARY_THRUSTER_INTERVAL_MS;
    }

    if (strafeRight && time >= this.nextRightStrafeThrusterAt) {
      this.emitThrusterParticle({ x: -35, y: 2 }, right.clone().negate(), 0.48, right);
      this.nextRightStrafeThrusterAt = time + SECONDARY_THRUSTER_INTERVAL_MS;
    }
  }

  private emitThrusterParticle(
    localOffset: { x: number; y: number },
    exhaustDirection: Phaser.Math.Vector2,
    intensity: number,
    right: Phaser.Math.Vector2
  ): void {
    const forward = this.getForwardDirection(this.player.rotation);
    const offset = this.getShipLocalOffset(localOffset.x, localOffset.y, forward, right);
    const jitter = Phaser.Math.FloatBetween(-2.2, 2.2) * intensity;
    const startX = this.player.x + offset.x + right.x * jitter;
    const startY = this.player.y + offset.y + right.y * jitter;
    const particle = this.add.circle(startX, startY, Phaser.Math.FloatBetween(2.2, 4.4) * intensity, 0x73f2ff, 0.75);
    const travel = Phaser.Math.FloatBetween(14, 26) * intensity;

    particle.setDepth(7);
    particle.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: particle,
      x: startX + exhaustDirection.x * travel,
      y: startY + exhaustDirection.y * travel,
      alpha: 0,
      scale: 0.2,
      duration: THRUSTER_FADE_MS,
      ease: 'Quad.easeOut',
      onComplete: () => particle.destroy()
    });
  }

  private wrapPlayer(): void {
    const wrappedX = wrapCoordinate(this.player.x, this.arena.width);
    const wrappedY = wrapCoordinate(this.player.y, this.arena.height);
    const didWrap = wrappedX !== this.player.x || wrappedY !== this.player.y;

    this.player.setPosition(wrappedX, wrappedY);

    if (didWrap) {
      this.cameras.main.centerOn(wrappedX, wrappedY);
    }
  }

  private updateBasicEnemies(deltaSeconds: number): void {
    for (const enemy of this.basicEnemies) {
      const direction = this.getWrappedDirection(enemy.body.x, enemy.body.y, this.player.x, this.player.y);

      if (direction.lengthSq() > 0) {
        direction.normalize();
        enemy.body.x = wrapCoordinate(enemy.body.x + direction.x * basicEnemy.moveSpeed * deltaSeconds, this.arena.width);
        enemy.body.y = wrapCoordinate(enemy.body.y + direction.y * basicEnemy.moveSpeed * deltaSeconds, this.arena.height);
        enemy.body.rotation = Math.atan2(direction.x, -direction.y);
      }
    }
  }

  private updateBasicAsteroids(deltaSeconds: number): void {
    this.asteroidCameraViewCount = 0;
    this.asteroidWrappedViewCount = 0;
    this.asteroidWrapMirrorCount = 0;

    for (const asteroid of this.basicAsteroids) {
      this.validateAsteroidRenderState(asteroid);
      asteroid.body.x = wrapCoordinate(asteroid.body.x + asteroid.velocity.x * deltaSeconds, this.arena.width);
      asteroid.body.y = wrapCoordinate(asteroid.body.y + asteroid.velocity.y * deltaSeconds, this.arena.height);
      asteroid.body.rotation += asteroid.rotationSpeed * deltaSeconds;
      this.updateAsteroidWrapMirror(asteroid);
    }
  }

  private updatePulseCannon(time: number): void {
    const isFiring =
      this.fireKey.isDown || this.input.activePointer.leftButtonDown() || this.input.activePointer.rightButtonDown();

    if (!isFiring || time < this.nextPulseCannonFireAt) {
      return;
    }

    this.firePulseCannon(time);
    this.nextPulseCannonFireAt = time + pulseCannon.cooldownSeconds * 1000;
  }

  private firePulseCannon(time: number): void {
    const direction = this.getForwardDirection(this.player.rotation);
    const spawnX = this.player.x + direction.x * PULSE_CANNON_MUZZLE_OFFSET;
    const spawnY = this.player.y + direction.y * PULSE_CANNON_MUZZLE_OFFSET;
    const body = this.createPulseCannonProjectile(spawnX, spawnY, this.player.rotation);

    this.pulseCannonProjectiles.push({
      body,
      velocity: direction.scale(pulseCannon.projectileSpeed),
      expiresAt: time + pulseCannon.projectileLifetimeSeconds * 1000,
      distanceRemaining: pulseCannon.projectileRange,
      nextTrailAt: time
    });
  }

  private createPulseCannonProjectile(x: number, y: number, rotation: number): Phaser.GameObjects.Container {
    const glow = this.add.ellipse(0, 0, 18, 24, 0x42f5d7, 0.3);
    const body = this.add.ellipse(0, 0, 8, 15, 0x73f2ff, 1);
    body.setStrokeStyle(1, 0xf2fbff, 0.95);

    const projectile = this.add.container(x, y, [glow, body]);

    projectile.setRotation(rotation);
    projectile.setDepth(8);

    return projectile;
  }

  private updatePulseCannonProjectiles(time: number, deltaSeconds: number): void {
    for (let i = this.pulseCannonProjectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.pulseCannonProjectiles[i];
      const travelDistance = pulseCannon.projectileSpeed * deltaSeconds;

      projectile.body.x = wrapCoordinate(projectile.body.x + projectile.velocity.x * deltaSeconds, this.arena.width);
      projectile.body.y = wrapCoordinate(projectile.body.y + projectile.velocity.y * deltaSeconds, this.arena.height);
      projectile.distanceRemaining -= travelDistance;

      if (this.tryHitBasicEnemy(projectile) || this.tryHitBasicAsteroid(projectile)) {
        projectile.body.destroy(true);
        this.pulseCannonProjectiles.splice(i, 1);
      } else if (time >= projectile.expiresAt || projectile.distanceRemaining <= 0) {
        projectile.body.destroy(true);
        this.pulseCannonProjectiles.splice(i, 1);
      } else if (time >= projectile.nextTrailAt) {
        this.emitPulseCannonTrail(projectile);
        projectile.nextTrailAt = time + PULSE_TRAIL_INTERVAL_MS;
      }
    }
  }

  private emitPulseCannonTrail(projectile: PulseCannonProjectile): void {
    const movementDirection = projectile.velocity.clone().normalize();
    const trailDirection = movementDirection.clone().negate();
    const sideDirection = new Phaser.Math.Vector2(-movementDirection.y, movementDirection.x);
    const jitter = Phaser.Math.FloatBetween(-2.4, 2.4);
    const x = projectile.body.x + trailDirection.x * PULSE_TRAIL_OFFSET + sideDirection.x * jitter;
    const y = projectile.body.y + trailDirection.y * PULSE_TRAIL_OFFSET + sideDirection.y * jitter;
    const particle = this.add.circle(x, y, Phaser.Math.FloatBetween(2.2, 4.2), 0x42f5d7, 0.7);

    particle.setDepth(7);
    particle.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: particle,
      x: x + trailDirection.x * 12,
      y: y + trailDirection.y * 12,
      alpha: 0,
      scale: 0.18,
      duration: PULSE_TRAIL_FADE_MS,
      ease: 'Quad.easeOut',
      onComplete: () => particle.destroy()
    });
  }

  private tryHitBasicEnemy(projectile: PulseCannonProjectile): boolean {
    const hitHalfWidth = basicEnemy.hitHalfWidth + PROJECTILE_HIT_RADIUS;
    const hitHalfLength = basicEnemy.hitHalfLength + PROJECTILE_HIT_RADIUS;

    for (let i = this.basicEnemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.basicEnemies[i];
      const offset = this.getWrappedDirection(enemy.body.x, enemy.body.y, projectile.body.x, projectile.body.y);
      const enemyForward = this.getForwardDirection(enemy.body.rotation);
      const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);
      const localX = offset.dot(enemyRight);
      const localY = offset.dot(enemyForward);
      const normalizedHit = (localX * localX) / (hitHalfWidth * hitHalfWidth) + (localY * localY) / (hitHalfLength * hitHalfLength);

      if (normalizedHit <= 1) {
        enemy.body.destroy(true);
        this.basicEnemies.splice(i, 1);
        return true;
      }
    }

    return false;
  }

  private tryHitBasicAsteroid(projectile: PulseCannonProjectile): boolean {
    for (let i = this.basicAsteroids.length - 1; i >= 0; i -= 1) {
      const asteroid = this.basicAsteroids[i];
      const offset = this.getWrappedDirection(asteroid.body.x, asteroid.body.y, projectile.body.x, projectile.body.y);
      const hitRadius = asteroid.hitRadius + PROJECTILE_HIT_RADIUS;

      if (offset.lengthSq() <= hitRadius * hitRadius) {
        asteroid.hp -= PULSE_CANNON_ASTEROID_DAMAGE;

        if (asteroid.hp <= 0) {
          this.destroyBasicAsteroid(i);
        } else {
          this.applyAsteroidImpact(asteroid, projectile);
        }

        return true;
      }
    }

    return false;
  }

  private applyAsteroidImpact(asteroid: BasicAsteroid, projectile: PulseCannonProjectile): void {
    const impactDirection = projectile.velocity.clone().normalize();
    const tierConfig = ASTEROID_TIER_CONFIG[asteroid.tier];

    asteroid.velocity.x += impactDirection.x * tierConfig.impactImpulse;
    asteroid.velocity.y += impactDirection.y * tierConfig.impactImpulse;
    asteroid.velocity.limit(tierConfig.maxVelocity);
  }

  private destroyBasicAsteroid(index: number): void {
    const asteroid = this.basicAsteroids[index];
    const x = asteroid.body.x;
    const y = asteroid.body.y;
    const velocity = asteroid.velocity.clone();
    const fragmentTiers = this.createAsteroidFragmentTiers(asteroid.tier, asteroid.breakupProfile);

    asteroid.body.destroy(true);
    asteroid.wrapMirrorBody.destroy(true);
    this.basicAsteroids.splice(index, 1);

    if (fragmentTiers.length > 0) {
      this.spawnAsteroidFragments(x, y, velocity, asteroid.breakupProfile, fragmentTiers);
    }
  }

  private spawnAsteroidFragments(
    x: number,
    y: number,
    parentVelocity: Phaser.Math.Vector2,
    breakupProfile: AsteroidBreakupProfile,
    fragmentTiers: AsteroidTier[]
  ): void {
    const baseAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);

    for (let i = 0; i < fragmentTiers.length; i += 1) {
      const fragmentTier = fragmentTiers[i];
      const fragmentConfig = ASTEROID_TIER_CONFIG[fragmentTier];
      const angle =
        baseAngle +
        (Math.PI * 2 * i) / fragmentTiers.length +
        Phaser.Math.FloatBetween(-0.22, 0.22);
      const offsetDistance =
        Phaser.Math.FloatBetween(8, fragmentConfig.displaySize * 0.38) * breakupProfile.spreadMultiplier;
      const burstSpeed =
        Phaser.Math.FloatBetween(ASTEROID_FRAGMENT_BURST_MIN_SPEED, ASTEROID_FRAGMENT_BURST_MAX_SPEED) *
        breakupProfile.burstMultiplier;
      const velocity = parentVelocity
        .clone()
        .scale(ASTEROID_PARENT_VELOCITY_INHERITANCE)
        .add(new Phaser.Math.Vector2(Math.cos(angle) * burstSpeed, Math.sin(angle) * burstSpeed));

      velocity.limit(fragmentConfig.maxVelocity);

      this.basicAsteroids.push(
        this.createAsteroidInstance(
          wrapCoordinate(x + Math.cos(angle) * offsetDistance, this.arena.width),
          wrapCoordinate(y + Math.sin(angle) * offsetDistance, this.arena.height),
          fragmentTier,
          velocity
        )
      );
    }
  }

  private createAsteroidFragmentTiers(
    parentTier: AsteroidTier,
    breakupProfile: AsteroidBreakupProfile
  ): AsteroidTier[] {
    if (parentTier === 1) {
      return [];
    }

    if (breakupProfile.mode === 'single-tier' && breakupProfile.preferredTier) {
      return this.createSingleTierAsteroidFragments(parentTier, breakupProfile.preferredTier);
    }

    const mixedMode = breakupProfile.mode === 'single-tier' ? 'balanced' : breakupProfile.mode;
    const fragments: AsteroidTier[] = [];
    let remainingMass = ASTEROID_TIER_CONFIG[parentTier].massBudget;

    while (remainingMass > 0) {
      const validTiers = this.getLowerAsteroidTiers(parentTier).filter(
        (tier) => ASTEROID_TIER_CONFIG[tier].massBudget <= remainingMass
      );

      if (validTiers.length === 0) {
        break;
      }

      const tier = this.pickAsteroidFragmentTier(validTiers, mixedMode);
      fragments.push(tier);
      remainingMass -= ASTEROID_TIER_CONFIG[tier].massBudget;
    }

    return fragments;
  }

  private createSingleTierAsteroidFragments(parentTier: AsteroidTier, fragmentTier: AsteroidTier): AsteroidTier[] {
    const parentMass = ASTEROID_TIER_CONFIG[parentTier].massBudget;
    const fragmentMass = ASTEROID_TIER_CONFIG[fragmentTier].massBudget;
    const fragmentCount = Math.floor(parentMass / fragmentMass);

    return Array.from({ length: fragmentCount }, () => fragmentTier);
  }

  private pickAsteroidFragmentTier(
    validTiers: AsteroidTier[],
    mode: Exclude<AsteroidBreakupProfileMode, 'single-tier'>
  ): AsteroidTier {
    const weightedTiers: AsteroidTier[] = [];

    for (const tier of validTiers) {
      const weight = this.getAsteroidFragmentTierWeight(tier, validTiers, mode);

      for (let i = 0; i < weight; i += 1) {
        weightedTiers.push(tier);
      }
    }

    return weightedTiers[Phaser.Math.Between(0, weightedTiers.length - 1)];
  }

  private getAsteroidFragmentTierWeight(
    tier: AsteroidTier,
    validTiers: AsteroidTier[],
    mode: Exclude<AsteroidBreakupProfileMode, 'single-tier'>
  ): number {
    const minTier = Math.min(...validTiers);
    const maxTier = Math.max(...validTiers);

    if (mode === 'many-small') {
      return maxTier - tier + 1;
    }

    if (mode === 'few-large') {
      return tier - minTier + 1;
    }

    return 1;
  }

  private getLowerAsteroidTiers(tier: AsteroidTier): AsteroidTier[] {
    return ASTEROID_TIERS.filter((candidateTier) => candidateTier < tier);
  }

  private updateAsteroidWrapMirror(asteroid: BasicAsteroid): void {
    const camera = this.cameras.main;
    const cameraCenterX = camera.scrollX + camera.width / 2;
    const cameraCenterY = camera.scrollY + camera.height / 2;
    const mirrorX = this.getNearestWrappedRenderCoordinate(asteroid.body.x, cameraCenterX, this.arena.width);
    const mirrorY = this.getNearestWrappedRenderCoordinate(asteroid.body.y, cameraCenterY, this.arena.height);
    const baseVisible = this.isCircleInCameraView(asteroid.body.x, asteroid.body.y, asteroid.hitRadius);
    const mirrorVisible = this.isCircleInCameraView(mirrorX, mirrorY, asteroid.hitRadius);
    const shouldShowMirror = (mirrorX !== asteroid.body.x || mirrorY !== asteroid.body.y) && mirrorVisible;

    asteroid.wrapMirrorBody.setPosition(mirrorX, mirrorY);
    asteroid.wrapMirrorBody.setRotation(asteroid.body.rotation);
    asteroid.wrapMirrorBody.setVisible(shouldShowMirror);

    if (baseVisible) {
      this.asteroidCameraViewCount += 1;
    }

    if (baseVisible || mirrorVisible) {
      this.asteroidWrappedViewCount += 1;
    }

    if (shouldShowMirror) {
      this.asteroidWrapMirrorCount += 1;
    }
  }

  private getNearestWrappedRenderCoordinate(value: number, cameraCenter: number, arenaSize: number): number {
    const delta = cameraCenter - value;

    if (delta > arenaSize / 2) {
      return value + arenaSize;
    }

    if (delta < -arenaSize / 2) {
      return value - arenaSize;
    }

    return value;
  }

  private isCircleInCameraView(x: number, y: number, radius: number): boolean {
    const camera = this.cameras.main;
    const left = camera.scrollX;
    const top = camera.scrollY;
    const right = left + camera.width;
    const bottom = top + camera.height;

    return x + radius >= left && x - radius <= right && y + radius >= top && y - radius <= bottom;
  }

  private validateAsteroidRenderState(asteroid: BasicAsteroid): void {
    if (
      Number.isNaN(asteroid.body.x) ||
      Number.isNaN(asteroid.body.y) ||
      Number.isNaN(asteroid.velocity.x) ||
      Number.isNaN(asteroid.velocity.y)
    ) {
      console.warn('Invalid asteroid position or velocity.', {
        x: asteroid.body.x,
        y: asteroid.body.y,
        velocityX: asteroid.velocity.x,
        velocityY: asteroid.velocity.y,
        tier: asteroid.tier,
        variant: asteroid.variant
      });
    }

    if (!asteroid.body.scene || asteroid.body.list.length === 0 || !asteroid.wrapMirrorBody.scene) {
      console.warn('Invalid asteroid render object state.', {
        hasBodyScene: Boolean(asteroid.body.scene),
        childCount: asteroid.body.list.length,
        hasMirrorScene: Boolean(asteroid.wrapMirrorBody.scene),
        tier: asteroid.tier,
        variant: asteroid.variant
      });
    }
  }

  private getWrappedDirection(fromX: number, fromY: number, toX: number, toY: number): Phaser.Math.Vector2 {
    let x = toX - fromX;
    let y = toY - fromY;

    if (Math.abs(x) > this.arena.width / 2) {
      x -= Math.sign(x) * this.arena.width;
    }

    if (Math.abs(y) > this.arena.height / 2) {
      y -= Math.sign(y) * this.arena.height;
    }

    return new Phaser.Math.Vector2(x, y);
  }

  private getForwardDirection(rotation: number): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(Math.sin(rotation), -Math.cos(rotation));
  }

  private getShipLocalOffset(
    localX: number,
    localY: number,
    forward: Phaser.Math.Vector2,
    right: Phaser.Math.Vector2
  ): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(right.x * localX - forward.x * localY, right.y * localX - forward.y * localY);
  }

  private updateBackgroundTiles(): void {
    if (!this.starfield || !this.grid) {
      return;
    }

    // Tile sprites replace the old full-arena live Graphics object, avoiding thousands of vector draws each frame.
    this.starfield.tilePositionX = this.cameras.main.scrollX * 0.45;
    this.starfield.tilePositionY = this.cameras.main.scrollY * 0.45;
    this.grid.tilePositionX = this.cameras.main.scrollX;
    this.grid.tilePositionY = this.cameras.main.scrollY;
  }

  private updateDebugText(time: number): void {
    if (!this.debugText || !this.player) {
      return;
    }

    if (time < this.nextDebugUpdateAt) {
      return;
    }

    this.nextDebugUpdateAt = time + DEBUG_UPDATE_INTERVAL_MS;

    const fps = Math.round(this.game.loop.actualFps);
    const viewportWidth = this.scale.width;
    const viewportHeight = this.scale.height;

    this.debugText.setText(
      `FPS: ${fps}\n` +
        `Viewport: ${viewportWidth} x ${viewportHeight}\n` +
        `Arena: ${this.arena.width} x ${this.arena.height}\n` +
        `Player: ${Math.round(this.player.x)}, ${Math.round(this.player.y)} (wrapped)\n` +
        `Velocity: ${Math.round(this.playerVelocity.x)}, ${Math.round(this.playerVelocity.y)}\n` +
        `Pulse: ${this.pulseCannonProjectiles.length} active\n` +
        `Enemies: ${this.basicEnemies.length} active\n` +
        `Asteroids: ${this.basicAsteroids.length} active\n` +
        `Asteroid view: ${this.asteroidCameraViewCount} direct / ${this.asteroidWrappedViewCount} wrapped / ${this.asteroidWrapMirrorCount} mirrored`
    );
  }

  private handleResize(): void {
    this.rebuildWorld();
  }
}
