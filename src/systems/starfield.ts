import Phaser from 'phaser';
import {
  BACKGROUND_TILE_SIZE,
  DEFAULT_STARFIELD_FAR_PARALLAX,
  DEFAULT_STARFIELD_MID_PARALLAX,
  DEFAULT_STARFIELD_NEAR_PARALLAX,
  STARFIELD_FAR_TEXTURE_KEY,
  STARFIELD_MID_TEXTURE_KEY,
  STARFIELD_NEAR_TEXTURE_KEY,
  STARFIELD_PARALLAX_MAX,
  STARFIELD_PARALLAX_MIN,
  STARFIELD_PARALLAX_STEP,
  STAR_COLORS
} from '../scenes/gameConstants';

export interface StarfieldDebugValues {
  backgroundStarsVisible: boolean;
  starfieldFarParallax: number;
  starfieldMidParallax: number;
  starfieldNearParallax: number;
}

export interface StarfieldSystemConfig {
  scene: Phaser.Scene;
  getWrappedDirection: (fromX: number, fromY: number, toX: number, toY: number) => Phaser.Math.Vector2;
}

export interface StarfieldDiagnosticsSnapshot {
  backgroundScrollX: number;
  backgroundScrollY: number;
  previousPlayerX?: number;
  previousPlayerY?: number;
  farTileX?: number;
  farTileY?: number;
  midTileX?: number;
  midTileY?: number;
  nearTileX?: number;
  nearTileY?: number;
  farWidth?: number;
  farHeight?: number;
}

export class StarfieldSystem {
  private readonly scene: Phaser.Scene;
  private readonly getWrappedDirection: (fromX: number, fromY: number, toX: number, toY: number) => Phaser.Math.Vector2;
  private farStarfield?: Phaser.GameObjects.TileSprite;
  private midStarfield?: Phaser.GameObjects.TileSprite;
  private nearStarfield?: Phaser.GameObjects.TileSprite;
  private farStarfieldParallax = DEFAULT_STARFIELD_FAR_PARALLAX;
  private midStarfieldParallax = DEFAULT_STARFIELD_MID_PARALLAX;
  private nearStarfieldParallax = DEFAULT_STARFIELD_NEAR_PARALLAX;
  private backgroundStarsVisible = true;
  private backgroundScrollX = 0;
  private backgroundScrollY = 0;
  private previousBackgroundPlayerX?: number;
  private previousBackgroundPlayerY?: number;

  constructor(config: StarfieldSystemConfig) {
    this.scene = config.scene;
    this.getWrappedDirection = config.getWrappedDirection;
  }

  createTextures(): void {
    this.createStarLayerTexture(STARFIELD_FAR_TEXTURE_KEY, 'starvivors-starfield-far-tile', 260, 0.45, 1.3, 0.18, 0.7);
    this.createStarLayerTexture(STARFIELD_MID_TEXTURE_KEY, 'starvivors-starfield-mid-tile', 180, 0.65, 2.1, 0.24, 0.82);
    this.createStarLayerTexture(STARFIELD_NEAR_TEXTURE_KEY, 'starvivors-starfield-near-tile', 118, 0.78, 2.6, 0.28, 0.82);
  }

  create(): void {
    this.scene.cameras.main.setBackgroundColor(0x02040a);

    this.farStarfield = this.scene.add
      .tileSprite(0, 0, this.scene.scale.width, this.scene.scale.height, STARFIELD_FAR_TEXTURE_KEY)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-20);

    this.midStarfield = this.scene.add
      .tileSprite(0, 0, this.scene.scale.width, this.scene.scale.height, STARFIELD_MID_TEXTURE_KEY)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-19);

    this.nearStarfield = this.scene.add
      .tileSprite(0, 0, this.scene.scale.width, this.scene.scale.height, STARFIELD_NEAR_TEXTURE_KEY)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-18);

    this.applyTilePositions();
    this.applyStarVisibility();
  }

  resize(width = this.scene.scale.width, height = this.scene.scale.height): void {
    this.farStarfield?.setSize(width, height);
    this.midStarfield?.setSize(width, height);
    this.nearStarfield?.setSize(width, height);
  }

  resetState(): void {
    this.backgroundStarsVisible = true;
    this.backgroundScrollX = 0;
    this.backgroundScrollY = 0;
    this.previousBackgroundPlayerX = undefined;
    this.previousBackgroundPlayerY = undefined;
  }

  resetPlayerTracking(player: Phaser.GameObjects.Container): void {
    this.previousBackgroundPlayerX = player.x;
    this.previousBackgroundPlayerY = player.y;
  }

  update(time: number, player: Phaser.GameObjects.Container): void {
    if (!this.farStarfield || !this.midStarfield || !this.nearStarfield) {
      return;
    }

    const twinkleTime = time * 0.001;

    if (this.previousBackgroundPlayerX === undefined || this.previousBackgroundPlayerY === undefined) {
      this.previousBackgroundPlayerX = player.x;
      this.previousBackgroundPlayerY = player.y;
    }

    const playerDelta = this.getWrappedDirection(
      this.previousBackgroundPlayerX,
      this.previousBackgroundPlayerY,
      player.x,
      player.y
    );

    this.backgroundScrollX += playerDelta.x;
    this.backgroundScrollY += playerDelta.y;
    this.previousBackgroundPlayerX = player.x;
    this.previousBackgroundPlayerY = player.y;

    this.applyTilePositions();

    if (!this.backgroundStarsVisible) {
      this.applyStarVisibility();
      return;
    }

    this.farStarfield.setAlpha(0.72);
    this.midStarfield.setAlpha(0.82 + Math.sin(twinkleTime * 0.32 + 1.8) * 0.012);
    this.nearStarfield.setAlpha(0.78 + Math.sin(twinkleTime * 0.42 + 3.4) * 0.016);
  }

  adjustParallax(layer: 'far' | 'mid' | 'near', direction: number): void {
    const delta = direction * STARFIELD_PARALLAX_STEP;

    if (layer === 'far') {
      this.farStarfieldParallax = this.clampParallax(this.farStarfieldParallax + delta);
    } else if (layer === 'mid') {
      this.midStarfieldParallax = this.clampParallax(this.midStarfieldParallax + delta);
    } else {
      this.nearStarfieldParallax = this.clampParallax(this.nearStarfieldParallax + delta);
    }

    this.applyTilePositions();
  }

  resetParallax(): void {
    this.farStarfieldParallax = DEFAULT_STARFIELD_FAR_PARALLAX;
    this.midStarfieldParallax = DEFAULT_STARFIELD_MID_PARALLAX;
    this.nearStarfieldParallax = DEFAULT_STARFIELD_NEAR_PARALLAX;
    this.applyTilePositions();
  }

  setDebugValues(values: Partial<StarfieldDebugValues>): void {
    if (typeof values.backgroundStarsVisible === 'boolean') {
      this.backgroundStarsVisible = values.backgroundStarsVisible;
    }

    if (typeof values.starfieldFarParallax === 'number' && Number.isFinite(values.starfieldFarParallax)) {
      this.farStarfieldParallax = this.clampParallax(values.starfieldFarParallax);
    }

    if (typeof values.starfieldMidParallax === 'number' && Number.isFinite(values.starfieldMidParallax)) {
      this.midStarfieldParallax = this.clampParallax(values.starfieldMidParallax);
    }

    if (typeof values.starfieldNearParallax === 'number' && Number.isFinite(values.starfieldNearParallax)) {
      this.nearStarfieldParallax = this.clampParallax(values.starfieldNearParallax);
    }

    this.applyTilePositions();
    this.applyStarVisibility();
  }

  toggleStars(): void {
    this.backgroundStarsVisible = !this.backgroundStarsVisible;
    this.applyStarVisibility();
  }

  getDebugValues(): StarfieldDebugValues {
    return {
      backgroundStarsVisible: this.backgroundStarsVisible,
      starfieldFarParallax: this.farStarfieldParallax,
      starfieldMidParallax: this.midStarfieldParallax,
      starfieldNearParallax: this.nearStarfieldParallax
    };
  }

  getDiagnosticsSnapshot(): StarfieldDiagnosticsSnapshot {
    return {
      backgroundScrollX: roundDiagnosticNumber(this.backgroundScrollX),
      backgroundScrollY: roundDiagnosticNumber(this.backgroundScrollY),
      previousPlayerX: roundOptionalDiagnosticNumber(this.previousBackgroundPlayerX),
      previousPlayerY: roundOptionalDiagnosticNumber(this.previousBackgroundPlayerY),
      farTileX: roundOptionalDiagnosticNumber(this.farStarfield?.tilePositionX),
      farTileY: roundOptionalDiagnosticNumber(this.farStarfield?.tilePositionY),
      midTileX: roundOptionalDiagnosticNumber(this.midStarfield?.tilePositionX),
      midTileY: roundOptionalDiagnosticNumber(this.midStarfield?.tilePositionY),
      nearTileX: roundOptionalDiagnosticNumber(this.nearStarfield?.tilePositionX),
      nearTileY: roundOptionalDiagnosticNumber(this.nearStarfield?.tilePositionY),
      farWidth: roundOptionalDiagnosticNumber(this.farStarfield?.width),
      farHeight: roundOptionalDiagnosticNumber(this.farStarfield?.height)
    };
  }

  private createStarLayerTexture(
    textureKey: string,
    seed: string,
    starCount: number,
    minRadius: number,
    maxRadius: number,
    minAlpha: number,
    maxAlpha: number
  ): void {
    if (this.scene.textures.exists(textureKey)) {
      return;
    }

    const starTexture = this.scene.textures.createCanvas(textureKey, BACKGROUND_TILE_SIZE, BACKGROUND_TILE_SIZE);

    if (!starTexture) {
      return;
    }

    const context = starTexture.getContext();
    const random = new Phaser.Math.RandomDataGenerator([seed]);

    context.clearRect(0, 0, BACKGROUND_TILE_SIZE, BACKGROUND_TILE_SIZE);

    for (let i = 0; i < starCount; i += 1) {
      const x = random.between(0, BACKGROUND_TILE_SIZE);
      const y = random.between(0, BACKGROUND_TILE_SIZE);
      const radius = random.realInRange(minRadius, maxRadius);
      const alpha = random.realInRange(minAlpha, maxAlpha);
      const color = Phaser.Display.Color.IntegerToColor(Phaser.Utils.Array.GetRandom(STAR_COLORS));
      const glowRadius = radius * random.realInRange(1.8, 3.4);

      context.globalAlpha = alpha * 0.22;
      context.fillStyle = color.rgba;
      context.beginPath();
      context.arc(x, y, glowRadius, 0, Math.PI * 2);
      context.fill();

      context.globalAlpha = alpha;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }

    context.globalAlpha = 1;
    starTexture.refresh();
  }

  private applyTilePositions(): void {
    if (!this.farStarfield || !this.midStarfield || !this.nearStarfield) {
      return;
    }

    this.farStarfield.tilePositionX = this.backgroundScrollX * this.farStarfieldParallax;
    this.farStarfield.tilePositionY = this.backgroundScrollY * this.farStarfieldParallax;
    this.midStarfield.tilePositionX = this.backgroundScrollX * this.midStarfieldParallax;
    this.midStarfield.tilePositionY = this.backgroundScrollY * this.midStarfieldParallax;
    this.nearStarfield.tilePositionX = this.backgroundScrollX * this.nearStarfieldParallax;
    this.nearStarfield.tilePositionY = this.backgroundScrollY * this.nearStarfieldParallax;
  }

  private applyStarVisibility(): void {
    if (!this.farStarfield || !this.midStarfield || !this.nearStarfield) {
      return;
    }

    this.farStarfield.setVisible(this.backgroundStarsVisible);
    this.midStarfield.setVisible(this.backgroundStarsVisible);
    this.nearStarfield.setVisible(this.backgroundStarsVisible);
  }

  private clampParallax(value: number): number {
    return Number(Phaser.Math.Clamp(value, STARFIELD_PARALLAX_MIN, STARFIELD_PARALLAX_MAX).toFixed(2));
  }
}

function roundDiagnosticNumber(value: number): number {
  return Number(value.toFixed(3));
}

function roundOptionalDiagnosticNumber(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? roundDiagnosticNumber(value) : undefined;
}
