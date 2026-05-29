import Phaser from 'phaser';
import type { RareEventDefinition } from '../data/rareEvents';
import { createEffectRingImage } from './effectTextures';

export function createRareEventBody(
  scene: Phaser.Scene,
  x: number,
  y: number,
  definition: RareEventDefinition,
  isMirror: boolean
): Phaser.GameObjects.Container {
  const color = definition.kind === 'black-hole' ? 0xb88cff : 0xff5964;
  const accent = definition.kind === 'black-hole' ? 0x73f2ff : 0xffc857;
  const signalRing = createEffectRingImage({
    scene,
    x: 0,
    y: 0,
    radius: definition.signalRadius,
    color,
    alpha: isMirror ? 0.12 : 0.2,
    depth: 0
  });
  const dangerRing = createEffectRingImage({
    scene,
    x: 0,
    y: 0,
    radius: definition.dangerRadius,
    color,
    alpha: isMirror ? 0.22 : 0.38,
    depth: 0
  });
  const objectiveRing = createEffectRingImage({
    scene,
    x: 0,
    y: 0,
    radius: definition.objectiveRadius,
    color: accent,
    alpha: isMirror ? 0.38 : 0.78,
    depth: 0
  });
  const coreGlow = scene.add.circle(0, 0, definition.objectiveRadius * 0.18, color, isMirror ? 0.08 : 0.18);
  const core = definition.kind === 'black-hole'
    ? scene.add.circle(0, 0, 12, 0x02040a, 0.95).setStrokeStyle(2, accent, 0.92)
    : scene.add.rectangle(0, 0, 34, 34, 0x182436, 0.94).setStrokeStyle(2, accent, 0.9);
  const label = scene.add
    .text(0, -definition.objectiveRadius - 30, definition.shortName.toUpperCase(), {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '13px',
      color: definition.kind === 'black-hole' ? '#b88cff' : '#ffc857',
      align: 'center'
    })
    .setOrigin(0.5);

  const body = scene.add.container(x, y, [signalRing, dangerRing, objectiveRing, coreGlow, core, label]);
  body.setDepth(isMirror ? 5 : 7);
  body.setSize(definition.objectiveRadius * 2, definition.objectiveRadius * 2);
  return body;
}
