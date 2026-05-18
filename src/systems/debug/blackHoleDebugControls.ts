import Phaser from 'phaser';
import { BLACK_HOLE_LENSING_ARC_MAX_COUNT } from '../blackHole';
import {
  DEBUG_BLACK_HOLE_LENS_DENSITY_MIN,
  DEBUG_BLACK_HOLE_LENS_LENGTH_MAX,
  DEBUG_BLACK_HOLE_LENS_LENGTH_MIN,
  DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MAX,
  DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MIN,
  DEBUG_BLACK_HOLE_LENS_SLIDER_GAP,
  DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT,
  DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH,
  DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH,
  DEBUG_BLACK_HOLE_RADIUS_SCALE_MAX,
  DEBUG_BLACK_HOLE_RADIUS_SCALE_MIN
} from '../../scenes/gameConstants';

export interface BlackHoleDebugControlsState {
  collisionDebugEnabled: boolean;
  isUpgradeOverlayOpen: boolean;
  isDebugMenuOpen: boolean;
  isPlayerDead: boolean;
  lensOrbitSpeedMultiplier: number;
  lensDensity: number;
  lensLengthMultiplier: number;
  visualScale: number;
  projectionLensLayersEnabled: boolean;
}

export interface BlackHoleDebugControlsConfig {
  scene: Phaser.Scene;
  getState: () => BlackHoleDebugControlsState;
  setLensOrbitSpeedMultiplier: (value: number) => void;
  setLensDensity: (value: number) => void;
  setLensLengthMultiplier: (value: number) => void;
  setVisualScale: (value: number) => void;
  toggleProjectionLensLayers: () => void;
  onChanged: () => void;
}

interface SliderHandle {
  container: Phaser.GameObjects.Container;
  graphics: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
}

export class BlackHoleDebugControls {
  private readonly scene: Phaser.Scene;
  private readonly getState: () => BlackHoleDebugControlsState;
  private readonly setLensOrbitSpeedMultiplier: (value: number) => void;
  private readonly setLensDensity: (value: number) => void;
  private readonly setLensLengthMultiplier: (value: number) => void;
  private readonly setVisualScale: (value: number) => void;
  private readonly toggleProjectionLensLayers: () => void;
  private readonly onChanged: () => void;
  private orbitSlider?: SliderHandle;
  private densitySlider?: SliderHandle;
  private lengthSlider?: SliderHandle;
  private visualScaleSlider?: SliderHandle;
  private projectionToggle?: SliderHandle;

  constructor(config: BlackHoleDebugControlsConfig) {
    this.scene = config.scene;
    this.getState = config.getState;
    this.setLensOrbitSpeedMultiplier = config.setLensOrbitSpeedMultiplier;
    this.setLensDensity = config.setLensDensity;
    this.setLensLengthMultiplier = config.setLensLengthMultiplier;
    this.setVisualScale = config.setVisualScale;
    this.toggleProjectionLensLayers = config.toggleProjectionLensLayers;
    this.onChanged = config.onChanged;
  }

  create(): void {
    this.orbitSlider = this.createSlider((pointer) => this.handleLinearSliderPointer(pointer, {
      handle: this.orbitSlider,
      min: DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MIN,
      max: DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MAX,
      decimals: 1,
      setValue: this.setLensOrbitSpeedMultiplier
    }));
    this.densitySlider = this.createSlider((pointer) => this.handleLinearSliderPointer(pointer, {
      handle: this.densitySlider,
      min: DEBUG_BLACK_HOLE_LENS_DENSITY_MIN,
      max: BLACK_HOLE_LENSING_ARC_MAX_COUNT,
      decimals: 0,
      setValue: this.setLensDensity
    }));
    this.lengthSlider = this.createSlider((pointer) => this.handleLinearSliderPointer(pointer, {
      handle: this.lengthSlider,
      min: DEBUG_BLACK_HOLE_LENS_LENGTH_MIN,
      max: DEBUG_BLACK_HOLE_LENS_LENGTH_MAX,
      decimals: 1,
      setValue: this.setLensLengthMultiplier
    }));
    this.visualScaleSlider = this.createSlider((pointer) => this.handleLinearSliderPointer(pointer, {
      handle: this.visualScaleSlider,
      min: DEBUG_BLACK_HOLE_RADIUS_SCALE_MIN,
      max: DEBUG_BLACK_HOLE_RADIUS_SCALE_MAX,
      decimals: 1,
      setValue: this.setVisualScale
    }));
    this.projectionToggle = this.createToggle();
  }

  update(): void {
    const state = this.getState();
    const isVisible = this.isVisible(state);
    const panelX = 16 + DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2;
    const panelY = Math.max(220, this.scene.scale.height - 330);

    this.updateSlider(this.orbitSlider, {
      isVisible,
      panelX,
      panelY,
      label: `Lens orbit x${state.lensOrbitSpeedMultiplier.toFixed(1)}`,
      value: state.lensOrbitSpeedMultiplier,
      min: DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MIN,
      max: DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MAX,
      color: 0x42f5d7
    });
    this.updateSlider(this.densitySlider, {
      isVisible,
      panelX,
      panelY: panelY + DEBUG_BLACK_HOLE_LENS_SLIDER_GAP,
      label: `Lens density ${state.lensDensity}`,
      value: state.lensDensity,
      min: DEBUG_BLACK_HOLE_LENS_DENSITY_MIN,
      max: BLACK_HOLE_LENSING_ARC_MAX_COUNT,
      color: 0x9fd8ff
    });
    this.updateSlider(this.lengthSlider, {
      isVisible,
      panelX,
      panelY: panelY + DEBUG_BLACK_HOLE_LENS_SLIDER_GAP * 2,
      label: `Lens length x${state.lensLengthMultiplier.toFixed(1)}`,
      value: state.lensLengthMultiplier,
      min: DEBUG_BLACK_HOLE_LENS_LENGTH_MIN,
      max: DEBUG_BLACK_HOLE_LENS_LENGTH_MAX,
      color: 0xa8c7ff
    });
    this.updateToggle(this.projectionToggle, {
      isVisible,
      panelX,
      panelY: panelY + DEBUG_BLACK_HOLE_LENS_SLIDER_GAP * 3,
      isEnabled: state.projectionLensLayersEnabled
    });
    this.updateSlider(this.visualScaleSlider, {
      isVisible,
      panelX,
      panelY: panelY + DEBUG_BLACK_HOLE_LENS_SLIDER_GAP * 4,
      label: `Visual scale x${state.visualScale.toFixed(1)}`,
      value: state.visualScale,
      min: DEBUG_BLACK_HOLE_RADIUS_SCALE_MIN,
      max: DEBUG_BLACK_HOLE_RADIUS_SCALE_MAX,
      color: 0xffc857
    });
  }

  private createSlider(onPointer: (pointer: Phaser.Input.Pointer) => void): SliderHandle {
    const graphics = this.scene.add.graphics();
    const text = this.scene.add
      .text(0, -15, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#c8f7ff'
      })
      .setOrigin(0.5);
    const container = this.scene.add
      .container(0, 0, [graphics, text])
      .setScrollFactor(0)
      .setDepth(1003)
      .setSize(DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH, DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT)
      .setInteractive({ useHandCursor: true });

    this.scene.input.setDraggable(container);
    container.on('pointerdown', onPointer);
    container.on('drag', onPointer);

    return { container, graphics, text };
  }

  private createToggle(): SliderHandle {
    const graphics = this.scene.add.graphics();
    const text = this.scene.add
      .text(0, 0, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#c8f7ff'
      })
      .setOrigin(0, 0.5);
    const container = this.scene.add
      .container(0, 0, [graphics, text])
      .setScrollFactor(0)
      .setDepth(1003)
      .setSize(DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH, 34)
      .setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => {
      if (!this.isVisible(this.getState())) {
        return;
      }

      this.toggleProjectionLensLayers();
      this.update();
      this.onChanged();
    });

    return { container, graphics, text };
  }

  private handleLinearSliderPointer(
    pointer: Phaser.Input.Pointer,
    config: {
      handle?: SliderHandle;
      min: number;
      max: number;
      decimals: number;
      setValue: (value: number) => void;
    }
  ): void {
    if (!config.handle || !this.isVisible(this.getState())) {
      return;
    }

    const trackX = -DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH / 2;
    const localX = pointer.x - config.handle.container.x;
    const progress = Phaser.Math.Clamp(localX - trackX, 0, DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH) /
      DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH;
    const value = Phaser.Math.Linear(config.min, config.max, progress);

    config.setValue(config.decimals === 0 ? Math.round(value) : Number(value.toFixed(config.decimals)));
    this.update();
    this.onChanged();
  }

  private updateSlider(
    handle: SliderHandle | undefined,
    config: {
      isVisible: boolean;
      panelX: number;
      panelY: number;
      label: string;
      value: number;
      min: number;
      max: number;
      color: number;
    }
  ): void {
    if (!handle) {
      return;
    }

    const trackX = -DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH / 2;
    const trackY = 10;
    const progress = (config.value - config.min) / (config.max - config.min);
    const knobX = trackX + DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH * Phaser.Math.Clamp(progress, 0, 1);

    handle.container.setPosition(config.panelX, config.panelY).setVisible(config.isVisible).setActive(config.isVisible);
    handle.text.setText(config.label);
    handle.graphics.clear();
    handle.graphics.fillStyle(0x02040a, 0.82);
    handle.graphics.fillRoundedRect(
      -DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2,
      -DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT / 2,
      DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH,
      DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT,
      6
    );
    handle.graphics.lineStyle(1, 0x52627f, 0.72);
    handle.graphics.strokeRoundedRect(
      -DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2,
      -DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT / 2,
      DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH,
      DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT,
      6
    );
    handle.graphics.lineStyle(4, 0x24384f, 0.9);
    handle.graphics.lineBetween(trackX, trackY, trackX + DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH, trackY);
    handle.graphics.lineStyle(4, config.color, 0.74);
    handle.graphics.lineBetween(trackX, trackY, knobX, trackY);
    handle.graphics.fillStyle(0xf2fbff, 0.96);
    handle.graphics.fillCircle(knobX, trackY, 6);
  }

  private updateToggle(
    handle: SliderHandle | undefined,
    config: { isVisible: boolean; panelX: number; panelY: number; isEnabled: boolean }
  ): void {
    if (!handle) {
      return;
    }

    const boxX = -DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2 + 12;
    const boxY = -8;

    handle.container.setPosition(config.panelX, config.panelY).setVisible(config.isVisible).setActive(config.isVisible);
    handle.text.setPosition(boxX + 24, 0).setText('Projection lens layers');
    handle.graphics.clear();
    handle.graphics.fillStyle(0x02040a, 0.82);
    handle.graphics.fillRoundedRect(-DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2, -17, DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH, 34, 6);
    handle.graphics.lineStyle(1, 0x52627f, 0.72);
    handle.graphics.strokeRoundedRect(-DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2, -17, DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH, 34, 6);
    handle.graphics.fillStyle(0x071018, 0.95);
    handle.graphics.fillRect(boxX, boxY, 16, 16);
    handle.graphics.lineStyle(1, 0x9fd8ff, 0.82);
    handle.graphics.strokeRect(boxX, boxY, 16, 16);

    if (config.isEnabled) {
      handle.graphics.lineStyle(3, 0x42f5d7, 0.88);
      handle.graphics.lineBetween(boxX + 3, boxY + 8, boxX + 7, boxY + 12);
      handle.graphics.lineBetween(boxX + 7, boxY + 12, boxX + 13, boxY + 4);
    }
  }

  private isVisible(state: BlackHoleDebugControlsState): boolean {
    return state.collisionDebugEnabled && !state.isUpgradeOverlayOpen && !state.isDebugMenuOpen && !state.isPlayerDead;
  }
}
