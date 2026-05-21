import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import { applyAcceleration, dampVelocityChannel } from './physics';

export interface PlayerFlightControls {
  strafeLeft: boolean;
  strafeRight: boolean;
  thrustForward: boolean;
  thrustReverse: boolean;
  isThrusting: boolean;
  isWorldRelative: boolean;
}

export interface PlayerFlightStats {
  thrust: number;
  brake: number;
  strafe: number;
  moveSpeed: number;
  velocityLimit: number;
  lowFrictionDamping: number;
  overspeedDamping: number;
}

export function resolvePlayerFlightControls(input: {
  strafeLeft: boolean;
  strafeRight: boolean;
  thrustForward: boolean;
  thrustReverse: boolean;
  isWorldRelative?: boolean;
}): PlayerFlightControls {
  const isWorldRelative = input.isWorldRelative ?? false;

  return {
    strafeLeft: input.strafeLeft,
    strafeRight: input.strafeRight,
    thrustForward: input.thrustForward,
    thrustReverse: input.thrustReverse,
    isThrusting: input.thrustForward || input.thrustReverse || input.strafeLeft || input.strafeRight,
    isWorldRelative
  };
}

export function updatePlayerFacingFromPointer(input: {
  scene: Phaser.Scene;
  player: Phaser.GameObjects.Container;
  getWrappedDirection: (fromX: number, fromY: number, toX: number, toY: number) => Phaser.Math.Vector2;
}): void {
  const pointer = input.scene.input.activePointer;
  const pointerWorld = input.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  const direction = input.getWrappedDirection(input.player.x, input.player.y, pointerWorld.x, pointerWorld.y);

  if (direction.lengthSq() > 0) {
    input.player.rotation = Math.atan2(direction.x, -direction.y);
  }
}

export function applyPlayerFlightAcceleration(input: {
  player: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  controls: PlayerFlightControls;
  stats: PlayerFlightStats;
  deltaSeconds: number;
  accelerationScale?: number;
}): void {
  const shipForward = getForwardDirection(input.player.rotation);
  const shipRight = new Phaser.Math.Vector2(-shipForward.y, shipForward.x);
  const movementForward = input.controls.isWorldRelative ? new Phaser.Math.Vector2(0, -1) : shipForward;
  const movementRight = input.controls.isWorldRelative ? new Phaser.Math.Vector2(1, 0) : shipRight;
  const acceleration = new Phaser.Math.Vector2(0, 0);

  if (input.controls.thrustForward) {
    acceleration.x += movementForward.x * input.stats.thrust;
    acceleration.y += movementForward.y * input.stats.thrust;
  }

  if (input.controls.thrustReverse) {
    acceleration.x -= movementForward.x * input.stats.brake;
    acceleration.y -= movementForward.y * input.stats.brake;
  }

  if (input.controls.strafeLeft) {
    acceleration.x -= movementRight.x * input.stats.strafe;
    acceleration.y -= movementRight.y * input.stats.strafe;
  }

  if (input.controls.strafeRight) {
    acceleration.x += movementRight.x * input.stats.strafe;
    acceleration.y += movementRight.y * input.stats.strafe;
  }

  if (acceleration.lengthSq() <= 0) {
    return;
  }

  applyAcceleration({
    velocity: input.velocity,
    acceleration,
    deltaSeconds: input.deltaSeconds,
    accelerationScale: input.accelerationScale
  });
}

export function dampPlayerFlightVelocity(input: {
  velocity: Phaser.Math.Vector2;
  stats: PlayerFlightStats;
  deltaSeconds: number;
  isThrusting: boolean;
}): void {
  if (!input.isThrusting) {
    applyPlayerFlightCoastDamping(input.velocity, input.stats.lowFrictionDamping, input.deltaSeconds);
  }

  applyPlayerFlightOverspeedDamping(input.velocity, input.stats.velocityLimit, input.stats.overspeedDamping, input.deltaSeconds);
}

export function integratePlayerFlightPosition(input: {
  player: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  deltaSeconds: number;
}): void {
  input.player.x += input.velocity.x * input.deltaSeconds;
  input.player.y += input.velocity.y * input.deltaSeconds;
}

export function wrapPlayerFlightPosition(input: {
  player: Phaser.GameObjects.Container;
  arena: ArenaSize;
  camera: Phaser.Cameras.Scene2D.Camera;
}): boolean {
  const wrappedX = wrapCoordinate(input.player.x, input.arena.width);
  const wrappedY = wrapCoordinate(input.player.y, input.arena.height);
  const didWrap = wrappedX !== input.player.x || wrappedY !== input.player.y;

  input.player.setPosition(wrappedX, wrappedY);

  if (didWrap) {
    input.camera.centerOn(wrappedX, wrappedY);
  }

  return didWrap;
}

export function updatePlayerFlightCameraLead(input: {
  camera: Phaser.Cameras.Scene2D.Camera;
  cameraLead: Phaser.Math.Vector2;
  velocity: Phaser.Math.Vector2;
  maxSpeed: number;
  minSpeed: number;
  maxDistance: number;
  lerp: number;
}): void {
  const speed = input.velocity.length();
  const maxSpeed = Math.max(input.minSpeed + 1, input.maxSpeed);
  const leadProgress = Phaser.Math.Clamp((speed - input.minSpeed) / (maxSpeed - input.minSpeed), 0, 1);
  const targetLead =
    speed > input.minSpeed && leadProgress > 0
      ? input.velocity.clone().normalize().scale(input.maxDistance * leadProgress)
      : new Phaser.Math.Vector2(0, 0);

  input.cameraLead.lerp(targetLead, input.lerp);
  input.camera.setFollowOffset(-input.cameraLead.x, -input.cameraLead.y);
}

export function getForwardDirection(rotation: number): Phaser.Math.Vector2 {
  return new Phaser.Math.Vector2(Math.sin(rotation), -Math.cos(rotation));
}

export function applyPlayerFlightCoastDamping(
  velocity: Phaser.Math.Vector2,
  lowFrictionDamping: number,
  deltaSeconds: number
): void {
  if (deltaSeconds <= 0 || velocity.lengthSq() <= 0.0001) {
    return;
  }

  dampVelocityChannel(velocity, lowFrictionDamping, deltaSeconds);
}

export function applyPlayerFlightOverspeedDamping(
  velocity: Phaser.Math.Vector2,
  velocityLimit: number,
  overspeedDamping: number,
  deltaSeconds: number
): void {
  const speed = velocity.length();

  if (speed <= velocityLimit || speed <= 0.0001 || deltaSeconds <= 0) {
    return;
  }

  const excessSpeed = speed - velocityLimit;
  const dampedExcessSpeed = excessSpeed * Math.exp(-overspeedDamping * deltaSeconds);
  velocity.setLength(velocityLimit + dampedExcessSpeed);
}
