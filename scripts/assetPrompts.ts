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
  notes?: string;
};

export const BACKGROUND_MODE = "pure-white";
export const BACKGROUND_COLOR = "#FFFFFF";
export const MANUAL_BACKGROUND_REMOVAL_EXPECTED = true;

export const BACKGROUND_INSTRUCTION =
  "Background: pure #FFFFFF white background for manual background removal. No checkerboard. No transparent-background preview. No gradient. No texture. No scene. No environmental lighting on the background. No drop shadow on the background. The asset must be isolated, centered, and clearly separated from the white background.";

export const ART_DIRECTION =
  "deep space + industrial punk + salvagepunk machinery + deep neon sci-fi. Dark gunmetal and worn steel, carbon-black plating, exposed bolts, vents, mechanical seams, armored plates, subtle grime and scratches, cyan engine/neon glow, magenta plasma accent lines, amber cockpit/utility lights, and small red emergency lights where useful. Strong readable silhouettes, clean game-ready shapes, high contrast over a dark starfield after manual background removal. Not painterly noise, not generic clean sci-fi, not cartoon, not realistic photo, not franchise-inspired. All assets are generated on a pure #FFFFFF white background for manual background removal. Usable interior areas of UI/HUD frames should be filled with dark gray, gunmetal, dark glass, or appropriate in-world panel material, not white.";

export const GLOBAL_ASSET_CONSTRAINTS =
  "No fake text. No readable text unless explicitly requested. No random letters. No logos. No watermarks. No copyrighted franchise resemblance. No Star Wars. No Star Trek. No realistic photo. No background scene. No gameplay screenshot. No excessive clutter. No blurry edges. No cropped asset. No shadows that require a specific background. No white glow, pale smoke, or light outer rim blending into the white background. Center the asset with clean margins. Keep the silhouette clearly separated from the white background.";

export const NEGATIVE_PROMPT =
  "no fake text, no readable text, no random letters, no unreadable letters, no logo, no watermark, no copyrighted franchise design, no Star Wars, no Star Trek, no realistic photo, no background scene, no gameplay screenshot, no player screenshot, no excessive clutter, no blurry edges, no low contrast, no cinematic perspective, no low-angle render, no angled product render, no horizon, no camera depth shift, no dramatic perspective foreshortening, no perspective for UI frames, no transparent center for HUD/UI frames, no asymmetrical accidental distortion, no cropped asset, no shadows that require a specific background, no white glow, no pale smoke, no light outer rim blending into white, no white UI panel interiors";

export const DEFAULT_STYLE_SLUG = "deep_neon_salvagepunk";

const HUD_UI_FRAME_REQUIREMENTS =
  "HUD/UI frame requirements: flat orthographic front view, no perspective, no transparent center unless explicitly requested, no readable text, no labels, no icons unless this is an icon asset, no numbers, no fake text. Usable panel interiors must be dark gray, gunmetal, dark glass, or appropriate in-world material, not white. The white background must only exist outside the asset silhouette. Design as a reusable frame with a clear interior content area for live Phaser text and meters. Use decorative corners, simple stretchable horizontal and vertical edges, and a production-friendly 9-slice-compatible structure where possible.";

const STRICT_TOP_DOWN_SHIP_VIEW =
  "strict top-down orthographic game sprite view, forward-facing orientation, no cinematic perspective, no low-angle render, no angled product render, no horizon, no camera depth shift, no dramatic perspective foreshortening";

const STRICT_TOP_DOWN_SHIP_CONSTRAINTS =
  "Strict top-down orthographic game sprite view. Forward-facing orientation when the asset has a front. No cinematic perspective, no low-angle render, no angled product render, no horizon, no camera depth shift, no dramatic perspective foreshortening. Keep a strong readable silhouette at small size. The asset must be isolated and centered on pure #FFFFFF white.";

const WEAPON_SLOT_INTERIOR =
  "Weapon slot interior: the center/interior of the slot frame must be filled with a simple dark gray or gunmetal gray panel matching the rest of the frame. Do not leave the center transparent. Do not make the center white. The white background should only exist outside the outer silhouette of the asset. The slot must look like a complete usable game button with an empty dark gray interior where live Phaser text and cooldown meters can be drawn.";

const HUD_INTERIORS: Record<string, string> = {
  dashboard_shell:
    "Dashboard shell interior: dark dashboard surface and interior panels, not white. The white background should only exist outside the outer silhouette of the asset.",
  top_status_frame:
    "Top status frame interior: dark gray or gunmetal interior bar, not white. The white background should only exist outside the outer silhouette of the asset.",
  info_bay_frame:
    "Info bay interior: dark gray or gunmetal interior panel, not white. The white background should only exist outside the outer silhouette of the asset.",
  status_readout_frame:
    "Status readout interior: dark gray or gunmetal filled interior panel, not white. The center/interior must look like part of the passive readout bay with clear space for live Phaser text and small meters. The white background should only exist outside the outer silhouette of the asset.",
  weapon_slot_frame: WEAPON_SLOT_INTERIOR,
  mission_console_frame:
    "Mission console interior: dark amber-gray or dark gunmetal interior panel, not white. The white background should only exist outside the outer silhouette of the asset.",
  eject_button_frame:
    "Eject button interior: dark red or gunmetal interior, not white. The white background should only exist outside the outer silhouette of the asset.",
  warning_chip_frame:
    "Warning chip interior: dark, amber, or red interior strip, not white. The white background should only exist outside the outer silhouette of the asset.",
  tooltip_panel:
    "Tooltip panel interior: dark readable interior panel, not white. The white background should only exist outside the outer silhouette of the asset.",
  minimap_frame:
    "Minimap frame interior: dark radar-glass interior or dark gray interior, not white. The white background should only exist outside the outer silhouette of the asset.",
};

function hudFrameConstraints(assetType: string, constraints: string): string {
  return `${constraints} ${HUD_UI_FRAME_REQUIREMENTS} ${HUD_INTERIORS[assetType]}`;
}

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
    styleConstraints: hudFrameConstraints(
      "dashboard_shell",
      "Mostly empty center regions, clear bays for Phaser text, 9-slice-friendly edges where possible.",
    ),
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
    styleConstraints: hudFrameConstraints("top_status_frame", "Thin horizontal frame, empty interior."),
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
    styleConstraints: hudFrameConstraints(
      "info_bay_frame",
      "Empty center, readable at small size, 9-slice-compatible.",
    ),
  },
  {
    assetType: "status_readout_frame",
    category: "hud",
    folderSegments: ["hud", "status_readout_frame"],
    count: 10,
    width: 512,
    height: 256,
    useCase:
      "small reusable passive dashboard readout panel for live Phaser text and meters such as hull, shield, fuel, scrap, radar, and scanner",
    view: "flat orthographic",
    styleConstraints: hudFrameConstraints(
      "status_readout_frame",
      "Create a reusable small sci-fi dashboard status readout frame for Starvivors. It should look like a cockpit instrument bay, not a clickable weapon button. The usable interior is dark gray/gunmetal and empty for live Phaser text and meters. The white background exists only outside the outer silhouette of the asset. Passive instrument/readout panel, not a button. Decorative industrial corners, simple stretchable horizontal and vertical edges, deep neon cyan/magenta/amber accents, no white glow blending into the white background.",
    ),
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
    styleConstraints: hudFrameConstraints(
      "weapon_slot_frame",
      "Pressable mechanical switch/button frame, dark interior area for text, cooldown rail space, 9-slice-compatible.",
    ),
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
    styleConstraints: hudFrameConstraints(
      "mission_console_frame",
      "Amber/yellow accents, navigation console feel, empty dark center.",
    ),
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
    styleConstraints: hudFrameConstraints(
      "eject_button_frame",
      "Red emergency accent, physically guarded, readable at small size.",
    ),
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
    styleConstraints: hudFrameConstraints("warning_chip_frame", "Red/amber emergency strip, empty dark center."),
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
    styleConstraints: hudFrameConstraints("tooltip_panel", "Dark readable center, subtle neon border."),
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
    styleConstraints: hudFrameConstraints(
      "minimap_frame",
      "Circular or square radar frame, dark glass center, cyan radar accents.",
    ),
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
    styleConstraints:
      "Create a clean game UI icon sheet for Starvivors with separated stat icons for hull, shield, fuel, speed, damage, fire rate, pickup range, radar, and scanner. Use a consistent deep-neon industrial sci-fi style. No labels or text. Flat readable game icons, no numbers, no logos, consistent line weight and style, separated icons with clean spacing, readable at small size, dark gunmetal/cyan/magenta/amber/red accent palette, avoid white glow or pale edges that blend into the white background.",
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
    styleConstraints: "consistent style, no text",
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
    styleConstraints: "consistent style, no text",
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
    styleConstraints: "red/amber/cyan accents, no text",
  },
  {
    assetType: "player_ship_interceptor",
    category: "ships",
    folderSegments: ["ships", "player_ships", "player_ship_interceptor"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "fast starter ship candidate",
    view: STRICT_TOP_DOWN_SHIP_VIEW,
    styleConstraints:
      `${STRICT_TOP_DOWN_SHIP_CONSTRAINTS} Create a fast starter player ship sprite candidate for Starvivors. Agile silhouette, not bulky. Dark industrial hull, cyan/blue engine glow, subtle magenta/amber neon details, industrial punk / salvagepunk mechanical plating, avoid white glow, pale smoke, or light outer rim that blends into the white background.`,
  },
  {
    assetType: "player_ship_bulwark",
    category: "ships",
    folderSegments: ["ships", "player_ships", "player_ship_bulwark"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "heavy ramming shield ship candidate",
    view: STRICT_TOP_DOWN_SHIP_VIEW,
    styleConstraints:
      `${STRICT_TOP_DOWN_SHIP_CONSTRAINTS} Heavy ramming shield ship candidate. Bulky armored silhouette, front shield mount implied, dark gunmetal plating, cyan/amber glow, not agile-looking.`,
  },
  {
    assetType: "player_ship_variants",
    category: "ships",
    folderSegments: ["ships", "player_ships", "player_ship_variants"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "future unlockable ship concepts",
    view: STRICT_TOP_DOWN_SHIP_VIEW,
    styleConstraints:
      `${STRICT_TOP_DOWN_SHIP_CONSTRAINTS} Future unlockable ship concepts with varied silhouettes, consistent Starvivors style, no perspective drift.`,
  },
  {
    assetType: "enemy_basic_swarm_ship",
    category: "ships",
    folderSegments: ["ships", "enemy_ships", "enemy_basic_swarm_ship"],
    count: 10,
    width: 768,
    height: 768,
    useCase: "basic chaser enemy",
    view: STRICT_TOP_DOWN_SHIP_VIEW,
    styleConstraints:
      `${STRICT_TOP_DOWN_SHIP_CONSTRAINTS} Basic chaser enemy. Hostile compact silhouette, red/magenta glow, readable at small size.`,
  },
  {
    assetType: "enemy_shooter_ship",
    category: "ships",
    folderSegments: ["ships", "enemy_ships", "enemy_shooter_ship"],
    count: 10,
    width: 768,
    height: 768,
    useCase: "ranged enemy",
    view: STRICT_TOP_DOWN_SHIP_VIEW,
    styleConstraints:
      `${STRICT_TOP_DOWN_SHIP_CONSTRAINTS} Ranged enemy ship. Visible weapon prongs or side cannons, red/magenta glow, readable silhouette.`,
  },
  {
    assetType: "enemy_tank_ship",
    category: "ships",
    folderSegments: ["ships", "enemy_ships", "enemy_tank_ship"],
    count: 10,
    width: 768,
    height: 768,
    useCase: "heavy enemy",
    view: STRICT_TOP_DOWN_SHIP_VIEW,
    styleConstraints:
      `${STRICT_TOP_DOWN_SHIP_CONSTRAINTS} Heavy enemy ship. Chunky armored silhouette, slower/heavier visual language, red/amber hostile accents.`,
  },
  {
    assetType: "enemy_elite_ship_sheet",
    category: "ships",
    folderSegments: ["ships", "enemy_ships", "enemy_elite_ship_sheet"],
    count: 10,
    width: 1024,
    height: 1024,
    useCase: "elite enemy family concepts",
    view: STRICT_TOP_DOWN_SHIP_VIEW,
    styleConstraints:
      `${STRICT_TOP_DOWN_SHIP_CONSTRAINTS} Elite enemy family concepts. Four separated enemy variants on white background, consistent faction style.`,
  },
  {
    assetType: "enemy_boss_ship",
    category: "ships",
    folderSegments: ["ships", "bosses", "enemy_boss_ship"],
    count: 10,
    width: 1536,
    height: 1536,
    useCase: "large boss ship concepts",
    view: STRICT_TOP_DOWN_SHIP_VIEW,
    styleConstraints:
      `${STRICT_TOP_DOWN_SHIP_CONSTRAINTS} Large boss ship concept. Huge readable silhouette, industrial punk menace, deep neon core, no background scene.`,
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
    styleConstraints: "red warning lights, industrial metal",
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
    styleConstraints: "cyan electric arcs, no text",
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
    styleConstraints: "green/yellow toxic glow, readable edge",
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
    styleConstraints: "industrial embedded ore/neon cracks",
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
    styleConstraints: "red/orange reactor core, industrial casing",
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
    styleConstraints: "four separated tiers, cyan/green/gold/red value progression",
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
    styleConstraints: "amber fuel canister/core",
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
    styleConstraints: "green/cyan repair drone or kit",
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
    styleConstraints: "high-value crate, neon accents, industrial casing",
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
    styleConstraints: "cyan/blue energy bolts",
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
    styleConstraints: "magenta/purple energy",
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
    styleConstraints: "industrial mini missiles, engine flare",
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
    styleConstraints: "orange/red/cyan sci-fi energy explosion, separated frames if possible",
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
    styleConstraints: "cyan shield arc, sparks",
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
    styleConstraints: "cyan/blue/amber engine flares",
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
${BACKGROUND_INSTRUCTION}
Style constraints: ${definition.styleConstraints}

${GLOBAL_ASSET_CONSTRAINTS}
Isolated asset only.`;
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
