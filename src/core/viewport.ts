import type { ViewportSize } from './arena';

export function getViewportSize(scene: Phaser.Scene): ViewportSize {
  return {
    width: scene.scale.width,
    height: scene.scale.height
  };
}
