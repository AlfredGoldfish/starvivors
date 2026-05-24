export type AssetCategory =
  | "hud"
  | "ui"
  | "icons"
  | "ships"
  | "hazards"
  | "pickups"
  | "projectiles"
  | "effects";

export type AssetDefinition = {
  assetType: string;
  category: AssetCategory;
  folderSegments: string[];
  count: number;
  width: number;
  height: number;
  useCase: string;
  view: string;
  styleConstraints: string;
  transparentBackground: boolean;
  notes?: string;
};

export const ART_DIRECTION =
  "deep space + industrial punk + deep neon sci-fi. Dark gunmetal, worn metal, exposed bolts, subtle grime, cyan/magenta/amber neon accents, red emergency accents where appropriate. Strong silhouette, high contrast, readable over a dark moving starfield. Clean shape language, production-friendly, not overly noisy.";

export const NEGATIVE_PROMPT =
  "no fake text, no unreadable letters, no logo, no watermark, no copyrighted franchise design, no Star Wars, no Star Trek, no realistic photo, no background scene, no player screenshot, no excessive clutter, no blurry edges, no low contrast, no perspective for UI frames, no asymmetrical accidental distortion, no cropped asset, no shadows that require a specific background";

export const DEFAULT_STYLE_SLUG = "deep_neon_salvagepunk";

const UI_NINE_SLICE =
  "Design this as a 9-slice-compatible frame: decorative corners, simple stretchable horizontal and vertical edges, mostly empty center, no complex art crossing the stretch zones.";

export const ASSET_DEFINITIONS: AssetDefinition[] = [
  {
    assetType: "dashboard_shell",
    category: "hud",
    folderSegments: ["hud", "dashboard_shell"],
    count: 10,
    width: 1536,
    height: 512,
    useCase: "bottom cockpit dashboard frame",
    view: "flat orthographic front view",
    styleConstraints:
      "no text, mostly empty center regions, clear bays for Phaser text, 9-slice-friendly edges where possible, transparent background. " +
      UI_NINE_SLICE,
    transparentBackground: true,
  },
  {
    assetType: "top_status_frame",
    category: "hud",
    folderSegments: ["hud", "top_status_frame"],
    count: 10,
    width: 1536,
    height: 192,
    useCase: "top XP / run timer frame",
    view: "flat orthographic",
    styleConstraints: "thin horizontal frame, empty interior, no text. " + UI_NINE_SLICE,
    transparentBackground: true,
  },
  {
    assetType: "info_bay_frame",
    category: "hud",
    folderSegments: ["hud", "info_bay_frame"],
    count: 10,
    width: 512,
    height: 256,
    useCase: "reusable hull/fuel/scrap/radar/scanner readout bay",
    view: "flat orthographic",
    styleConstraints: "empty center, readable at small size, 9-slice-compatible. " + UI_NINE_SLICE,
    transparentBackground: true,
  },
  {
    assetType: "weapon_slot_frame",
    category: "hud",
    folderSegments: ["hud", "weapon_slot_frame"],
    count: 10,
    width: 512,
    height: 256,
    useCase: "reusable weapon button frame",
    view: "flat orthographic",
    styleConstraints:
      "pressable mechanical switch/button frame, empty center for text, cooldown rail space, 9-slice-compatible. " +
      UI_NINE_SLICE,
    transparentBackground: true,
  },
  {
    assetType: "mission_console_frame",
    category: "hud",
    folderSegments: ["hud", "mission_console_frame"],
    count: 10,
    width: 640,
    height: 320,
    useCase: "amber mission/contract button and mission log panel",
    view: "flat orthographic",
    styleConstraints:
      "amber/yellow accents, navigation console feel, empty center, no text. " + UI_NINE_SLICE,
    transparentBackground: true,
  },
  {
    assetType: "eject_button_frame",
    category: "hud",
    folderSegments: ["hud", "eject_button_frame"],
    count: 10,
    width: 384,
    height: 192,
    useCase: "red guarded emergency eject button",
    view: "flat orthographic",
    styleConstraints:
      "red emergency accent, physically guarded, no text, readable at small size. " + UI_NINE_SLICE,
    transparentBackground: true,
  },
  {
    assetType: "warning_chip_frame",
    category: "hud",
    folderSegments: ["hud", "warning_chip_frame"],
    count: 10,
    width: 512,
    height: 128,
    useCase: "warning label background",
    view: "flat orthographic",
    styleConstraints: "red/amber emergency strip, empty center, no text. " + UI_NINE_SLICE,
    transparentBackground: true,
  },
  {
    assetType: "tooltip_panel",
    category: "hud",
    folderSegments: ["hud", "tooltip_panel"],
    count: 10,
    width: 640,
    height: 384,
    useCase: "tooltip/info popup panel",
    view: "flat orthographic",
    styleConstraints: "dark readable center, subtle neon border, no text. " + UI_NINE_SLICE,
    transparentBackground: true,
  },
  {
    assetType: "minimap_frame",
    category: "hud",
    folderSegments: ["hud", "minimap_frame"],
    count: 10,
    width: 512,
    height: 512,
    useCase: "radar/minimap glass frame",
    view: "flat orthographic",
    styleConstraints:
      "circular or square radar frame, transparent center or dark glass center, cyan radar accents, no text. " +
      UI_NINE_SLICE,
    transparentBackground: true,
  },
  {
    assetType: "stats_icon_sheet",
    category: "icons",
    folderSegments: ["icons", "stats", "stats_icon_sheet"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "icon sheet for hull, shield, fuel, speed, damage, fire rate, pickup range, radar, scanner",
    view: "flat vector-like game icons",
    styleConstraints: "transparent background, consistent line weight, no text, separated icons with spacing",
    transparentBackground: true,
  },
  {
    assetType: "resource_icon_sheet",
    category: "icons",
    folderSegments: ["icons", "resources", "resource_icon_sheet"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "scrap, credits, XP, upgrade crate, reroll, mission reward, rare event",
    view: "flat readable icons",
    styleConstraints: "transparent background, consistent style, no text",
    transparentBackground: true,
  },
  {
    assetType: "weapon_icon_sheet",
    category: "icons",
    folderSegments: ["icons", "weapons", "weapon_icon_sheet"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "pulse cannon, auto turret, beam, missile, plasma, mine, chain lightning, explosive shot, sap shot",
    view: "flat readable icons",
    styleConstraints: "transparent background, consistent style, no text",
    transparentBackground: true,
  },
  {
    assetType: "status_icon_sheet",
    category: "icons",
    folderSegments: ["icons", "status", "status_icon_sheet"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "low hull, fuel emergency, upgrade ready, mission danger, scan complete, shield empowered",
    view: "flat warning/status icons",
    styleConstraints: "transparent background, red/amber/cyan accents, no text",
    transparentBackground: true,
  },
  {
    assetType: "player_ship_interceptor",
    category: "ships",
    folderSegments: ["ships", "player_ships", "player_ship_interceptor"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "fast starter ship candidate",
    view: "top-down or slight three-quarter top-down",
    styleConstraints:
      "readable silhouette, forward-facing, transparent background, dark hull with cyan engine glow",
    transparentBackground: true,
  },
  {
    assetType: "player_ship_bulwark",
    category: "ships",
    folderSegments: ["ships", "player_ships", "player_ship_bulwark"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "heavy ramming shield ship candidate",
    view: "top-down or slight three-quarter top-down",
    styleConstraints:
      "bulky armored silhouette, front shield mount implied, industrial metal, cyan/amber accents",
    transparentBackground: true,
  },
  {
    assetType: "player_ship_variants",
    category: "ships",
    folderSegments: ["ships", "player_ships", "player_ship_variants"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "future unlockable ship concepts",
    view: "top-down or slight three-quarter top-down",
    styleConstraints: "varied silhouettes, each readable at small size, transparent background",
    transparentBackground: true,
  },
  {
    assetType: "enemy_basic_swarm_ship",
    category: "ships",
    folderSegments: ["ships", "enemy_ships", "enemy_basic_swarm_ship"],
    count: 10,
    width: 768,
    height: 768,
    useCase: "basic chaser enemy",
    view: "top-down or slight three-quarter top-down",
    styleConstraints: "hostile silhouette, red/magenta glow, small readable shape",
    transparentBackground: true,
  },
  {
    assetType: "enemy_shooter_ship",
    category: "ships",
    folderSegments: ["ships", "enemy_ships", "enemy_shooter_ship"],
    count: 10,
    width: 768,
    height: 768,
    useCase: "ranged enemy",
    view: "top-down or slight three-quarter top-down",
    styleConstraints: "visible weapon prongs or side cannons, red/magenta glow",
    transparentBackground: true,
  },
  {
    assetType: "enemy_tank_ship",
    category: "ships",
    folderSegments: ["ships", "enemy_ships", "enemy_tank_ship"],
    count: 10,
    width: 768,
    height: 768,
    useCase: "heavy enemy",
    view: "top-down or slight three-quarter top-down",
    styleConstraints: "chunky armored silhouette, slower/heavier visual language",
    transparentBackground: true,
  },
  {
    assetType: "enemy_elite_ship_sheet",
    category: "ships",
    folderSegments: ["ships", "enemy_ships", "enemy_elite_ship_sheet"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "elite enemy family concepts",
    view: "top-down or slight three-quarter top-down",
    styleConstraints:
      "4 separated enemy variants on transparent background, consistent faction style",
    transparentBackground: true,
  },
  {
    assetType: "enemy_boss_ship",
    category: "ships",
    folderSegments: ["ships", "bosses", "enemy_boss_ship"],
    count: 10,
    width: 1536,
    height: 1536,
    useCase: "large boss ship concepts",
    view: "top-down or slight three-quarter top-down",
    styleConstraints:
      "huge readable silhouette, industrial punk menace, deep neon core, no background",
    transparentBackground: true,
  },
  {
    assetType: "space_mine",
    category: "hazards",
    folderSegments: ["hazards", "mines", "space_mine"],
    count: 10,
    width: 512,
    height: 512,
    useCase: "explosive space mine",
    view: "top-down or isometric-like isolated sprite",
    styleConstraints: "red warning lights, industrial metal, transparent background",
    transparentBackground: true,
  },
  {
    assetType: "electric_field_hazard",
    category: "hazards",
    folderSegments: ["hazards", "electric_fields", "electric_field_hazard"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "electric/EMP hazard sprite or tileable patch",
    view: "top-down effect asset",
    styleConstraints: "cyan electric arcs, transparent background, no text",
    transparentBackground: true,
  },
  {
    assetType: "radiation_zone_marker",
    category: "hazards",
    folderSegments: ["hazards", "radiation_zones", "radiation_zone_marker"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "hazardous zone visual marker",
    view: "top-down effect ring",
    styleConstraints: "green/yellow toxic glow, transparent background, readable edge",
    transparentBackground: true,
  },
  {
    assetType: "asteroid_hazard_variants",
    category: "hazards",
    folderSegments: ["hazards", "warning_markers", "asteroid_hazard_variants"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "dangerous asteroid variants",
    view: "top-down isolated sprites",
    styleConstraints: "industrial embedded ore/neon cracks, no background",
    transparentBackground: true,
  },
  {
    assetType: "explosive_barrel_or_reactor",
    category: "hazards",
    folderSegments: ["hazards", "explosive_barrels", "explosive_barrel_or_reactor"],
    count: 10,
    width: 768,
    height: 768,
    useCase: "destructible explosive space object",
    view: "top-down or slight three-quarter top-down",
    styleConstraints: "red/orange reactor core, industrial casing, transparent background",
    transparentBackground: true,
  },
  {
    assetType: "scrap_pickup_sheet",
    category: "pickups",
    folderSegments: ["pickups", "scrap", "scrap_pickup_sheet"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "scrap pickup tiers 1-4",
    view: "isolated sprite sheet",
    styleConstraints:
      "four separated tiers, cyan/green/gold/red value progression, transparent background",
    transparentBackground: true,
  },
  {
    assetType: "fuel_pickup",
    category: "pickups",
    folderSegments: ["pickups", "fuel", "fuel_pickup"],
    count: 10,
    width: 512,
    height: 512,
    useCase: "fuel pickup",
    view: "isolated sprite",
    styleConstraints: "amber fuel canister/core, transparent background",
    transparentBackground: true,
  },
  {
    assetType: "repair_pickup",
    category: "pickups",
    folderSegments: ["pickups", "repair", "repair_pickup"],
    count: 10,
    width: 512,
    height: 512,
    useCase: "hull repair pickup",
    view: "isolated sprite",
    styleConstraints: "green/cyan repair drone or kit, transparent background",
    transparentBackground: true,
  },
  {
    assetType: "upgrade_crate",
    category: "pickups",
    folderSegments: ["pickups", "upgrade_crates", "upgrade_crate"],
    count: 10,
    width: 768,
    height: 768,
    useCase: "upgrade crate pickup",
    view: "isolated sprite",
    styleConstraints: "high-value crate, neon accents, industrial casing, transparent background",
    transparentBackground: true,
  },
  {
    assetType: "pulse_projectile_sheet",
    category: "projectiles",
    folderSegments: ["projectiles", "bullets", "pulse_projectile_sheet"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "pulse cannon projectile variants",
    view: "separated projectile sprites",
    styleConstraints: "cyan/blue energy bolts, transparent background",
    transparentBackground: true,
  },
  {
    assetType: "plasma_projectile_sheet",
    category: "projectiles",
    folderSegments: ["projectiles", "plasma", "plasma_projectile_sheet"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "plasma projectile variants",
    view: "separated projectile sprites",
    styleConstraints: "magenta/purple energy, transparent background",
    transparentBackground: true,
  },
  {
    assetType: "missile_projectile_sheet",
    category: "projectiles",
    folderSegments: ["projectiles", "missiles", "missile_projectile_sheet"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "missile/rocket projectiles",
    view: "top-down small sprites",
    styleConstraints: "industrial mini missiles, engine flare, transparent background",
    transparentBackground: true,
  },
  {
    assetType: "explosion_sheet",
    category: "effects",
    folderSegments: ["effects", "explosions", "explosion_sheet"],
    count: 10,
    width: 1536,
    height: 1536,
    useCase: "explosion concept frames or effect sheet",
    view: "isolated effect sprites",
    styleConstraints:
      "orange/red/cyan sci-fi energy explosion, transparent background, separated frames if possible",
    transparentBackground: true,
  },
  {
    assetType: "shield_hit_effect",
    category: "effects",
    folderSegments: ["effects", "shield_hits", "shield_hit_effect"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "ramming shield impact effect",
    view: "isolated effect sprite",
    styleConstraints: "cyan shield arc, sparks, transparent background",
    transparentBackground: true,
  },
  {
    assetType: "engine_flare_sheet",
    category: "effects",
    folderSegments: ["effects", "engine_flares", "engine_flare_sheet"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "ship thruster effects",
    view: "separated flame/glow sprites",
    styleConstraints: "cyan/blue/amber engine flares, transparent background",
    transparentBackground: true,
  },
];

export function buildAssetPrompt(definition: AssetDefinition): string {
  return `Create a game-ready 2D asset candidate for Starvivors, a space survivors action game.

Art direction: ${ART_DIRECTION}

Asset category: ${definition.category}
Asset type: ${definition.assetType}
Use case: ${definition.useCase}
View: ${definition.view}
Canvas: ${definition.width}x${definition.height}
Background: transparent if supported.
Style constraints: ${definition.styleConstraints}

No readable text unless explicitly requested. No logos. No watermark. No UI mockup screenshot unless requested. Isolated asset only.`;
}

export function getEstimatedNineSliceBorders(definition: AssetDefinition) {
  if (definition.category !== "hud" && definition.category !== "ui") {
    return null;
  }

  const horizontal = Math.max(24, Math.round(definition.width * 0.12));
  const vertical = Math.max(16, Math.round(definition.height * 0.18));

  return {
    suggestedLeftBorder: horizontal,
    suggestedRightBorder: horizontal,
    suggestedTopBorder: vertical,
    suggestedBottomBorder: vertical,
    note: "Default estimate only. Manually inspect HUD/UI candidates before production 9-slice use.",
  };
}
