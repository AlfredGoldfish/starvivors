export const RAW_STAT_UNIT_SCALE = 100;

const RAW_SCALED_KEYS = new Set([
  'moveSpeed',
  'thrust',
  'brake',
  'strafe',
  'hitRadius',
  'projectileSpeed',
  'projectileRange',
  'dashImpulse',
  'range',
  'width',
  'strongRamSpeed',
  'globalMaxSpeed'
]);

export function isRawScaledStatKey(key: string): boolean {
  return RAW_SCALED_KEYS.has(key);
}

export function toDisplayUnits(rawValue: number): number {
  return rawValue / RAW_STAT_UNIT_SCALE;
}

export function toRawUnits(displayValue: number): number {
  return displayValue * RAW_STAT_UNIT_SCALE;
}

export function formatIntegerDisplayUnits(rawValue: number): string {
  return `${Math.round(toDisplayUnits(rawValue))}`;
}

export function formatDisplayUnits(rawValue: number, decimals = 1): string {
  return toDisplayUnits(rawValue).toFixed(decimals).replace(/\.?0+$/, '');
}
