export type HudButtonVariant = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface HudButtonVariantDefinition {
  id: HudButtonVariant;
  title: string;
  shortLabel: string;
  designTarget: string;
  researchBasis: string;
}

export const HUD_BUTTON_VARIANTS: HudButtonVariantDefinition[] = [
  {
    id: 1,
    title: 'Industrial Plate Buttons',
    shortLabel: 'Industrial',
    designTarget: 'Physical salvagepunk affordance: hard plates, rivets, bevels, and clear click bounds.',
    researchBasis: 'Button affordance and contrast guidance: make controls look pressable and distinct from backing panels.'
  },
  {
    id: 2,
    title: 'Command Console Tabs',
    shortLabel: 'Console Tabs',
    designTarget: 'Cockpit control row discipline: weapons centered, utility to the right, exit isolated.',
    researchBasis: 'Action-bar organization patterns: grouped controls reduce scanning and keep combat attention near the center.'
  },
  {
    id: 3,
    title: 'Icon-First Action Blocks',
    shortLabel: 'Icon Blocks',
    designTarget: 'Fast visual parsing: glyph, control label, weapon name, and readiness stacked in larger blocks.',
    researchBasis: 'HUD hierarchy research: recognizable symbols and fewer words improve glance readability during motion.'
  },
  {
    id: 4,
    title: 'Raised Mechanical Switches',
    shortLabel: 'Switches',
    designTarget: 'Strong click affordance: raised surface, top highlight, side shadow, and depressed active state.',
    researchBasis: 'Affordance guidance: pushed-looking controls should visibly differ from passive status bays.'
  },
  {
    id: 5,
    title: 'Neon Edge Cards',
    shortLabel: 'Neon Edge',
    designTarget: 'Cleaner sci-fi polish: gunmetal button bodies with bright side rails and restrained glow.',
    researchBasis: 'Contrast and glow guidance: keep text sharp while using neon edges to signal active controls.'
  },
  {
    id: 6,
    title: 'Segmented Weapon Bay',
    shortLabel: 'Weapon Bay',
    designTarget: 'One intentional combat module: three weapon segments inside a shared machine bay.',
    researchBasis: 'Visual hierarchy guidance: related actions should share containment instead of floating as separate boxes.'
  },
  {
    id: 7,
    title: 'Compact Status + Big Actions',
    shortLabel: 'Big Actions',
    designTarget: 'Clear interaction priority: bigger brighter actions, quieter read-only status bays.',
    researchBasis: 'Accessibility contrast guidance: primary controls need stronger shape, size, and contrast than passive readouts.'
  },
  {
    id: 8,
    title: 'Amber Mission Console',
    shortLabel: 'Mission Console',
    designTarget: 'Objective clarity: mission becomes a distinct amber contract/log control, separate from combat buttons.',
    researchBasis: 'Quest-log and diegetic HUD references: objective UI should feel like an in-world console instead of debug text.'
  },
  {
    id: 9,
    title: 'Cooldown-Focused Combat Bar',
    shortLabel: 'Cooldown Bar',
    designTarget: 'Combat usability first: readiness percentage, bold cooldown rails, and disabled/ready state contrast.',
    researchBasis: 'WoW-style action bars: cooldown darkening and ready states make repeated combat checks faster.'
  },
  {
    id: 10,
    title: 'Final Hybrid Polish Pass',
    shortLabel: 'Hybrid',
    designTarget: 'Best-candidate blend: segmented weapon bay, physical trim, restrained neon, and compact text.',
    researchBasis: 'Ten-gate polish pass: combine the strongest hierarchy, affordance, contrast, and combat-safety traits.'
  }
];

export const DEFAULT_HUD_BUTTON_VARIANT: HudButtonVariant = 4;

export function isHudButtonVariant(value: number): value is HudButtonVariant {
  return Number.isInteger(value) && value >= 1 && value <= 10;
}

export function clampHudButtonVariant(value: number): HudButtonVariant {
  return isHudButtonVariant(value) ? value : DEFAULT_HUD_BUTTON_VARIANT;
}

export function getHudButtonVariantDefinition(variant: HudButtonVariant): HudButtonVariantDefinition {
  return HUD_BUTTON_VARIANTS.find((candidate) => candidate.id === variant) ?? HUD_BUTTON_VARIANTS[HUD_BUTTON_VARIANTS.length - 1];
}
