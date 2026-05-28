import type { ShipId, ShipRegistryEntry } from '../../data/ships';
import type { WeaponId, WeaponRegistryEntry } from '../../data/weapons';
import { formatDisplayUnits, formatIntegerDisplayUnits, isRawScaledStatKey, toDisplayUnits, toRawUnits } from '../statUnits';
import type { DebugShipOverrides, DebugWeaponOverrides } from './debugState';
import type { DebugShipStatKey, DebugWeaponStatKey } from './debugSharedTypes';
import type { SavedDebugShipLoadout, SavedDebugWeaponLoadout } from '../../scenes/gameTypes';
import type { DebugState } from './debugState';
import { getDesktopBridge, type DesktopFileCategory } from '../desktopBridge';

const DEBUG_SHIP_STAT_KEYS: DebugShipStatKey[] = ['maxHull', 'moveSpeed', 'thrust', 'brake', 'strafe', 'hitRadius'];
const DEBUG_WEAPON_STAT_KEYS: DebugWeaponStatKey[] = [
  'damage',
  'cooldownSeconds',
  'projectileSpeed',
  'projectileLifetimeSeconds',
  'projectileRange',
  'shieldMaxHp',
  'shieldRegenDelaySeconds',
  'shieldRegenRatePerSecond',
  'dashMaxCharges',
  'dashChargeRechargeSeconds',
  'dashDistance',
  'dashDurationSeconds',
  'range',
  'width',
  'guardDamage',
  'bashDamage',
  'knockback',
  'contactCooldownMs',
  'tickDamage',
  'tickRatePerSecond',
  'heatMax',
  'heatGainPerSecond',
  'coolingPerSecond',
  'overheatCoolingPerSecond'
];

export function toRawDebugDelta(stat: DebugShipStatKey | DebugWeaponStatKey | 'globalMaxSpeed', delta: number): number {
  return isRawScaledStatKey(stat) ? toRawUnits(delta) : delta;
}

export function toRawDebugValue(stat: DebugShipStatKey | DebugWeaponStatKey | 'globalMaxSpeed', value: number): number {
  return isRawScaledStatKey(stat) ? toRawUnits(value) : value;
}

export function downloadTextFile(
  filename: string,
  contents: string,
  mimeType: string,
  category: DesktopFileCategory = 'debug-presets'
): void {
  const desktop = getDesktopBridge();
  if (desktop) {
    void desktop.saveTextFile(category, filename, contents).then((result) => {
      if (!result.ok) {
        console.warn(`Unable to save ${filename}: ${result.error ?? 'Unknown desktop file error'}`);
      }
    });
    return;
  }

  const blob = new Blob([contents], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function loadMarkdownFile(
  onLoaded: (contents: string) => void,
  category: DesktopFileCategory = 'debug-presets'
): void {
  const desktop = getDesktopBridge();
  if (desktop) {
    void desktop.readTextFile(category).then((result) => {
      if (result.ok && typeof result.contents === 'string') {
        onLoaded(result.contents);
      } else if (result.error && result.error !== 'No file selected.') {
        console.warn(`Unable to load markdown file: ${result.error}`);
      }
    });
    return;
  }

  const input = document.createElement('input');

  input.type = 'file';
  input.accept = '.md,text/markdown,text/plain';
  input.onchange = () => {
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    void file.text().then(onLoaded);
  };
  input.click();
}

export function openDesktopDataFolder(category?: DesktopFileCategory, relativePath?: string): void {
  const desktop = getDesktopBridge();
  if (!desktop) {
    return;
  }

  void desktop.openDataFolder(category, relativePath).then((result) => {
    if (!result.ok) {
      console.warn(`Unable to open desktop data folder: ${result.error ?? 'Unknown desktop file error'}`);
    }
  });
}

export function getTimestampSlug(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export function parseJsonBlock<T extends object>(markdown: string): T | undefined {
  const jsonBlockMatch = markdown.match(/```json\s*([\s\S]*?)```/i);

  if (!jsonBlockMatch) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(jsonBlockMatch[1]) as unknown;

    return parsed && typeof parsed === 'object' ? (parsed as T) : undefined;
  } catch {
    return undefined;
  }
}

export function parseDebugShipLoadoutMarkdown(expectedShipId: ShipId, markdown: string): DebugShipOverrides | undefined {
  const setup = parseJsonBlock<SavedDebugShipLoadout>(markdown);

  if (!setup || setup.type !== 'starvivors-debug-ship-loadout' || setup.shipId !== expectedShipId) {
    return undefined;
  }

  return normalizeDebugShipOverrides(setup.overrides, getDebugLoadoutSchemaVersion(setup.schemaVersion));
}

export function parseDebugWeaponLoadoutMarkdown(expectedWeaponId: WeaponId, markdown: string): DebugWeaponOverrides | undefined {
  const setup = parseJsonBlock<SavedDebugWeaponLoadout>(markdown);

  if (!setup || setup.type !== 'starvivors-debug-weapon-loadout' || setup.weaponId !== expectedWeaponId) {
    return undefined;
  }

  return normalizeDebugWeaponOverrides(setup.overrides, getDebugLoadoutSchemaVersion(setup.schemaVersion));
}

export function parseDebugPresetMarkdown(markdown: string): Record<string, unknown> | undefined {
  const setup = parseJsonBlock<Record<string, unknown>>(markdown);

  if (!setup || setup.type !== 'starvivors-debug-preset') {
    return undefined;
  }

  return setup;
}

export function createDebugPresetMarkdown(setup: Record<string, unknown>): string {
  return [
    '# Starvivors Debug Preset',
    '',
    `Saved: ${new Date().toLocaleString()}`,
    '',
    'This file stores debug tuning values only. It does not store run progress, credits, active enemies, pickups, projectiles, or player hull.',
    '',
    '## Machine Readable Setup',
    '',
    '```json',
    JSON.stringify(
      {
        type: 'starvivors-debug-preset',
        schemaVersion: 1,
        savedAt: new Date().toISOString(),
        ...setup
      },
      null,
      2
    ),
    '```',
    ''
  ].join('\n');
}

export function createDebugShipLoadoutMarkdown(debugState: DebugState, ship: ShipRegistryEntry): string {
  const overrides = debugState.shipOverrides[ship.id] ?? {};
  const displayOverrides = createDisplayDebugOverrides(overrides);
  const effectiveStats = debugState.getEffectiveShipBaseStats(ship);
  const setup = {
    type: 'starvivors-debug-ship-loadout',
    schemaVersion: 2,
    shipId: ship.id,
    displayName: ship.displayName,
    savedAt: new Date().toISOString(),
    overrides: displayOverrides
  };

  return [
    `# ${ship.displayName} Debug Ship Loadout`,
    '',
    `Saved: ${new Date().toLocaleString()}`,
    '',
    '## Effective Stats',
    '',
    `- Max hull: ${effectiveStats.maxHull}`,
    `- Velocity: ${formatIntegerDisplayUnits(effectiveStats.moveSpeed)}`,
    `- Acceleration: ${formatIntegerDisplayUnits(effectiveStats.thrust)}`,
    `- Brake: ${formatIntegerDisplayUnits(effectiveStats.brake)}`,
    `- Strafe: ${formatIntegerDisplayUnits(effectiveStats.strafe)}`,
    `- Hit radius: ${formatDisplayUnits(debugState.getEffectiveShipHitRadius(ship), 1)}`,
    '',
    '## Machine Readable Setup',
    '',
    '```json',
    JSON.stringify(setup, null, 2),
    '```',
    ''
  ].join('\n');
}

export function createDebugWeaponLoadoutMarkdown(debugState: DebugState, weapon: WeaponRegistryEntry): string {
  const overrides = debugState.weaponOverrides[weapon.id] ?? {};
  const displayOverrides = createDisplayDebugOverrides(overrides);
  const effective = debugState.getEffectiveWeaponDefinition(weapon);
  const setup = {
    type: 'starvivors-debug-weapon-loadout',
    schemaVersion: 2,
    weaponId: weapon.id,
    displayName: weapon.displayName,
    savedAt: new Date().toISOString(),
    overrides: displayOverrides
  };
  const statLines = effective.rammingShield
    ? [
        `- Shield HP: ${effective.rammingShield.shieldMaxHp}`,
        `- Dash charges: ${effective.rammingShield.dashMaxCharges}`,
        `- Dash recharge: ${effective.rammingShield.dashChargeRechargeSeconds}s`,
        `- Dash distance/duration: ${effective.rammingShield.dashDistance}/${effective.rammingShield.dashDurationSeconds}s`,
        `- Guard/bash damage: ${effective.rammingShield.guardDamage}/${effective.rammingShield.bashDamage}`,
        `- Knockback: ${effective.rammingShield.knockback}`,
        `- Range/width: ${formatIntegerDisplayUnits(effective.rammingShield.range)}/${formatIntegerDisplayUnits(effective.rammingShield.width)}`
      ]
    : effective.beam
      ? [
          `- Tick damage: ${effective.beam.tickDamage}`,
          `- Tick rate: ${effective.beam.tickRatePerSecond}/s`,
          `- Range/width: ${formatIntegerDisplayUnits(effective.beam.range)}/${formatIntegerDisplayUnits(effective.beam.width)}`,
          `- Heat max: ${effective.beam.heatMax}`,
          `- Heat gain: ${effective.beam.heatGainPerSecond}/s`,
          `- Cooling: ${effective.beam.coolingPerSecond}/s`,
          `- Overheat venting: ${effective.beam.overheatCoolingPerSecond}/s`
        ]
      : [
        `- Damage: ${effective.damage ?? 0}`,
        `- Cooldown: ${effective.cooldownSeconds ?? 0}s`,
        `- Projectile speed: ${formatIntegerDisplayUnits(effective.projectileSpeed ?? 0)}`,
        `- Projectile lifetime: ${effective.projectileLifetimeSeconds ?? 0}s`,
        `- Projectile range: ${formatIntegerDisplayUnits(effective.projectileRange ?? 0)}`
      ];

  return [
    `# ${weapon.displayName} Debug Weapon Loadout`,
    '',
    `Saved: ${new Date().toLocaleString()}`,
    '',
    '## Effective Stats',
    '',
    ...statLines,
    '',
    '## Machine Readable Setup',
    '',
    '```json',
    JSON.stringify(setup, null, 2),
    '```',
    ''
  ].join('\n');
}

function normalizeDebugShipOverrides(rawOverrides: unknown, schemaVersion = 1): DebugShipOverrides | undefined {
  if (!rawOverrides || typeof rawOverrides !== 'object') {
    return undefined;
  }

  const raw = rawOverrides as Record<string, unknown>;
  const overrides: DebugShipOverrides = {};

  for (const key of DEBUG_SHIP_STAT_KEYS) {
    if (typeof raw[key] === 'number' && Number.isFinite(raw[key])) {
      overrides[key] = schemaVersion >= 2 ? toRawDebugValue(key, raw[key]) : raw[key];
    }
  }

  return overrides;
}

function normalizeDebugWeaponOverrides(rawOverrides: unknown, schemaVersion = 1): DebugWeaponOverrides | undefined {
  if (!rawOverrides || typeof rawOverrides !== 'object') {
    return undefined;
  }

  const raw = rawOverrides as Record<string, unknown>;
  const overrides: DebugWeaponOverrides = {};

  for (const key of DEBUG_WEAPON_STAT_KEYS) {
    if (typeof raw[key] === 'number' && Number.isFinite(raw[key])) {
      overrides[key] = schemaVersion >= 2 ? toRawDebugValue(key, raw[key]) : raw[key];
    }
  }

  return overrides;
}

function getDebugLoadoutSchemaVersion(schemaVersion: unknown): number {
  return typeof schemaVersion === 'number' && Number.isFinite(schemaVersion) ? schemaVersion : 1;
}

function createDisplayDebugOverrides<T extends Record<string, number | undefined>>(overrides: T): T {
  const displayOverrides: Record<string, number> = {};

  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      displayOverrides[key] = isRawScaledStatKey(key) ? toDisplayUnits(value) : value;
    }
  }

  return displayOverrides as T;
}
