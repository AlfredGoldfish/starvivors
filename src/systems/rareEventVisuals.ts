import Phaser from 'phaser';
import type { RareEventDefinition } from '../data/rareEvents';

export function createRareEventBody(
  scene: Phaser.Scene,
  x: number,
  y: number,
  definition: RareEventDefinition,
  isMirror: boolean
): Phaser.GameObjects.Container {
  const color = definition.kind === 'black-hole' ? 0xb88cff : 0xff5964;
  const accent = definition.kind === 'black-hole' ? 0x73f2ff : 0xffc857;
  const signalRing = scene.add.circle(0, 0, definition.signalRadius, color, isMirror ? 0 : 0.018);
  signalRing.setStrokeStyle(1, color, isMirror ? 0.12 : 0.2);
  const dangerRing = scene.add.circle(0, 0, definition.dangerRadius, color, isMirror ? 0 : 0.035);
  dangerRing.setStrokeStyle(2, color, isMirror ? 0.22 : 0.38);
  const objectiveRing = scene.add.circle(0, 0, definition.objectiveRadius, 0x000000, 0);
  objectiveRing.setStrokeStyle(2, accent, isMirror ? 0.38 : 0.78);
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
