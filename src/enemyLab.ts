import Phaser from 'phaser';
import './styles.css';
import { EnemyLabScene } from './scenes/EnemyLabScene';

const enemyLabConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#02040a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight
  },
  render: {
    antialias: true,
    pixelArt: false
  },
  scene: [EnemyLabScene]
};

new Phaser.Game(enemyLabConfig);
