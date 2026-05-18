import Phaser from 'phaser';
import { createDebugMenu, type DebugMenuController } from '../../ui/debugMenu';
import type { DebugMenuCallbacks, DebugMenuValues } from './debugTypes';

export interface DebugMenuHostConfig {
  scene: Phaser.Scene;
  callbacks: DebugMenuCallbacks;
  getValues: () => DebugMenuValues;
}

export class DebugMenuHost {
  private readonly scene: Phaser.Scene;
  private readonly callbacks: DebugMenuCallbacks;
  private readonly getValues: () => DebugMenuValues;
  private controller?: DebugMenuController;

  constructor(config: DebugMenuHostConfig) {
    this.scene = config.scene;
    this.callbacks = config.callbacks;
    this.getValues = config.getValues;
  }

  create(): void {
    this.destroy();
    this.controller = createDebugMenu(this.scene, { callbacks: this.callbacks });
    this.refresh();
  }

  destroy(): void {
    this.controller?.destroy();
    this.controller = undefined;
  }

  refresh(): void {
    this.controller?.update(this.getValues());
  }

  open(): void {
    this.controller?.open();
    this.refresh();
  }

  close(): void {
    this.controller?.close();
  }

  isOpen(): boolean {
    return this.controller?.isOpen() ?? false;
  }

  isCreated(): boolean {
    return Boolean(this.controller);
  }

  containsPointer(pointer: Phaser.Input.Pointer): boolean {
    return this.controller?.containsPointer(pointer) ?? false;
  }
}
