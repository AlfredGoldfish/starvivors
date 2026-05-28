# Binary-Asset Pattern

How to wire a file-backed registry — any subsystem whose entries reference a blob that's too big to serialize inline (audio files, images, icon PNGs, tileset atlases, font files, exported packs).

**When to reach for this pattern:** a registry entry needs to hold bytes that came from the user's filesystem. If you're tempted to inline a base64 string in a `def`, stop — inline base64 bloats the JSON payload, breaks diffs, and loses the Blob type that `AudioContext.decodeAudioData` and `Image.src` want. The binary-asset pattern keeps the def JSON small, stores the bytes once in `ProjectStore`, and re-unifies them through a registered loader.

**When NOT to reach for this pattern:** procedurally-authored content (a particle preset, a shape composition, a behavior graph) — those are pure JSON and round-trip without needing a blob at all. Color-only tile types, synthetic SFX presets — also pure JSON. The pattern kicks in only when real file bytes enter the picture.

---

## Canonical consumers (4 as of S71)

| Session | Subsystem | File | Blob kind | Ownership |
|---|---|---|---|---|
| S59 | `engine.music` | `src/engine/audio/MusicManager.ts` | Audio (`.mp3` / `.wav` / `.ogg`) | Flat: one blob per track |
| S60 | `engine.parallax` | `src/engine/rendering/ParallaxLayer.ts` | Image | Nested: one preset owns N layer images |
| S61 | `engine.inventory` | `src/engine/inventory/InventorySystem.ts` | Image (item icons) | Flat: one blob per item |
| S71 | `engine.tilemap` | `src/engine/tilemap/TilemapRegistry.ts` | Image (tileset atlases) | Flat: one blob per tileset |

Copy the shape from `MusicManager.ts` for flat-ownership, or `ParallaxLayer.ts` for nested-ownership. Don't invent a third storage model.

---

## The 5-step contract

Every binary-asset subsystem must do all five. Skipping a step breaks either persistence, cross-project sharing, or on-load hydration.

### 1. Store the blob in `ProjectStore.assets`, not in the registry

`ProjectStore` is the single source of truth for binary bytes, keyed by a generated `blobId`. Categories today: `'music' | 'inventory' | 'parallax' | 'tilemaps'`. Add a new category only when no existing one fits.

```ts
// Dev environment — imports a file at user request
const blobId = await ProjectStore.saveImageBlob(projectId, 'inventory', filename, file);
engine.inventory.registerItem(itemName, { /* ...def */, iconBlobId: blobId });
```

The registry sees only the `blobId` string. It never holds the file bytes as its canonical copy.

### 2. Keep only `blobId` in the serialized def

```ts
export interface MusicTrackDef {
  blobId: string;            // ← the reference
  filename?: string;         // ← display metadata, not bytes
  mimeType?: string;
  // ...other scalar fields
}
```

`serialize()` emits `{ tracks: Record<name, MusicTrackDef> }` — pure JSON. No blob bytes. This is what makes the generic ForgePack `extractEntries` path work without a special case for binary-asset registries.

### 3. Register a `setBlobLoader` + `hydrateAll`

Subsystem API surface:

```ts
setBlobLoader(loader: (blobId: string) => Promise<Blob | null>): void;
hydrateAll(): Promise<void>;   // iterate entries, pull blobs for any not yet resident
```

The loader is a closure that knows where to look — `ProjectStore.getXBlob(id)` in the dev environment, possibly a network fetch in a future cloud-sync flow. **The engine does not import `ProjectStore`.** The dev environment wires the loader during project open.

```ts
// src/dev-environment/main.ts
engine.music.setBlobLoader(async (id) => ProjectStore.getAudioBlob(id));
engine.parallax.setBlobLoader(async (id) => ProjectStore.getImageBlob(id));
engine.inventory.setBlobLoader(async (id) => ProjectStore.getImageBlob(id));
engine.tilemap.setBlobLoader(async (id) => ProjectStore.getImageBlob(id));

// After project open, eagerly warm the blob caches.
await engine.music.hydrateAll();
await hydrateInventoryBlobs();
// ...etc.
```

The subsystem holds an in-memory `Map<blobId, Blob>` cache. `hydrateAll` walks every def, skips entries already in cache, and requests the rest through the loader. Missing blobs silently skip rather than throw — a missing icon is an editor warning, not a game crash.

### 4. Bundle bytes in ForgePack under `blobs/<blobId>.bin`

ForgePack is the cross-project sharing container. For every binary-asset registry, add a `collectXBlobs(engine)` helper to `src/engine/saves/ForgePackExporter.ts` and bundle into the zip:

```ts
// In exportForgePack() after the section JSON is written
if (key === 'inventory') {
  const { blobs, missing } = await collectInventoryBlobs(engine);
  for (const [blobId, blob] of blobs) {
    zip.file(`${PACK_BLOBS_DIR}/${blobId}.bin`, blob);
  }
  if (missing.length) exportWarnings.push(`inventory: blobs missing for ${missing.join(', ')}`);
}
```

`PACK_BLOBS_DIR = 'blobs'`. Flat directory. Blob filenames are `<blobId>.bin` — no extension inference; the `mimeType` in the def tells consumers how to decode.

Model the collector on `collectInventoryBlobs` (flat) or `collectParallaxBlobs` (nested — one preset owns N layer images).

### 5. On import, re-persist + rewrite `blobId`

ForgePack import must re-persist blobs into the target project's `ProjectStore` and rewrite the `blobId` in each entry before calling `registerX`. The new project has its own asset namespace — the imported blobId would be unresolvable against the target store.

```ts
// In importForgePack()
if (subKey === 'inventory' && def.iconBlobId) {
  const srcBlob = blobsFromPack.get(def.iconBlobId);
  if (srcBlob) {
    const newBlobId = await ProjectStore.saveImageBlob(targetProjectId, 'inventory', def.filename ?? 'icon.bin', srcBlob);
    def.iconBlobId = newBlobId;   // rewrite to target-project id
  }
}
engine.inventory.registerItem(name, def);
```

**Invariant:** after import, the new project's registry entries point at blobs owned by the new project. Cross-project blobId references are a bug.

---

## Nested-ownership variant

Parallax is the one nested case so far: one preset owns N layer images. The contract is the same, but step 4 and step 5 walk the nested array:

```ts
// Collect
for (const entry of engine.parallax.list()) {
  const def = engine.parallax.get(entry.name);
  for (const layer of def.layers ?? []) {
    if (!layer.blobId || blobs.has(layer.blobId)) continue;
    const blob = await ProjectStore.getImageBlob(layer.blobId).catch(() => null);
    if (blob) blobs.set(layer.blobId, blob);
  }
}

// Rewrite on import
for (const layer of def.layers ?? []) {
  if (!layer.blobId) continue;
  const srcBlob = blobsFromPack.get(layer.blobId);
  if (srcBlob) {
    layer.blobId = await ProjectStore.saveImageBlob(targetProjectId, 'parallax', layer.label ?? 'layer', srcBlob);
  }
}
```

If you find yourself wanting a THIRD ownership model (doubly-nested, shared across entries, etc.), push back — it's almost certainly simpler to flatten or split the registry.

---

## Events

Emit a blob-hydration event when a blob becomes resident. The event name follows the subsystem's namespace:

- `track:blob-attached { name, blobId }` (music)
- `item:blob-attached { name, blobId }` (inventory)
- `tileset:blob-attached { name, blobId }` (tilemap)

Asset browser tabs + editor panels subscribe to toggle the "✓ hydrated" / "◯ unhydrated" indicator. Don't skip this — the indicator is the only feedback an author gets that the blob actually loaded.

---

## Test checklist

Binary-asset tests should cover, at minimum:

- [ ] `register` stores def without requiring a blob
- [ ] `register` with a direct blob arg caches it immediately
- [ ] `setBlobLoader` + `hydrateAll` resolves a def whose blob wasn't passed inline
- [ ] `getBlob` returns null for an entry registered without a blob and no loader
- [ ] `serialize` emits defs with `blobId` but no blob bytes
- [ ] `deserialize` restores defs; blobs hydrate via loader on subsequent `hydrateAll`
- [ ] `remove` deletes def + drops any cached blob under the same `blobId`
- [ ] Loader returning `null` doesn't throw — silent skip

See `MusicManager.test.ts` / `InventorySystem.test.ts` / `TilemapRegistry.test.ts` for concrete shapes.

---

## Adjacent docs

- `principles.md` §5 — the one-paragraph statement of this pattern (high-level summary).
- `reference/adding-a-subsystem.md` — general registry scaffold; this doc extends it for file-backed registries.
- `reference/engine-facade.md` — the four binary-asset consumers' API surface.
- `docs/roadmap/PASS_3_PLAN.md` — S79 (engine.saves + ForgePack extractor fix) depends on this pattern.
