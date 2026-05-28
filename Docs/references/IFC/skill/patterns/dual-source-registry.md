# Dual-Source Registry Pattern

How to hold both closure-authored (JS functions) and data-authored (JSON) entries in the same registry — and how to serialize across the split without losing either.

**When to reach for this pattern:** your registry needs to accept BOTH game-code-authored content (games register real JS functions at boot) AND editor-authored content (panels produce JSON that round-trips through `serialize`). The closure API is load-bearing because games already use it; the data path is load-bearing because `serialize` has to work. You can't collapse the two.

**When NOT to reach for this pattern:** the registry has only one author type. Pure-data registries (music tracks, inventory items, lighting configs, materials, tilemaps — anything the editor produces and the game only consumes) don't need a split. Pure-closure registries — today there are none in the codebase that pass the 10-gate, because gate 3 forces every registry to serialize.

---

## Canonical consumers (4 as of S70)

| Session | Subsystem | Closure API | Data API |
|---|---|---|---|
| S65 | `engine.behaviors` | `register(name, def)` with `onEnter/onTick/onExit` closures | `registerGraph(name, graphData)` |
| S66 | `engine.sequencer` | `register(name, timelineDef)` with keyframe closures | `registerSequence(name, graphData)` |
| S69 | `engine.postProcess` | `register(name, fn)` — arbitrary render closure | `registerEffect(name, def)` with typed preset |
| S70 | `engine.quests` | `register(name, def)` with `onStart/onComplete/onFail` | `registerQuest(name, data)` |

The closure path keeps games unchanged. The data path lets the editor author the same subsystem graphically. Internally they converge onto the same runtime (behaviors: `BehaviorGraphDefinition`; sequencer: compiled node graph; postprocess: closure wrapper around preset; quests: shared lifecycle runtime).

---

## The contract

### 1. Discriminate on a `source` field

Every entry carries an internal `source: 'code' | 'data'` tag. Set on register; never mutated after.

```ts
interface RegistryEntry {
  def: RuntimeDef;
  source: 'code' | 'data';
  // ...subsystem-specific fields
  graphData?: GraphData;   // only for data-sourced — the JSON shape the editor holds
}
```

### 2. Two registration methods

```ts
register(name: string, def: ClosureDef): void {
  // closure path — closure stays alive; entries stored with source: 'code'
  this.entries.set(name, { def, source: 'code' });
  this.emit('x:registered', { name, source: 'code' });
}

registerGraph(name: string, data: GraphData): void {
  // data path — compile graph into runtime def; keep graphData for serialize
  const def = compileGraph(data);
  if (!def) throw new Error(`Invalid graph for ${name}`);
  this.entries.set(name, { def, source: 'data', graphData: data });
  this.emit('x:registered', { name, source: 'data' });
}
```

Naming convention: the second method includes the data kind (`registerGraph` / `registerSequence` / `registerEffect` / `registerQuest`) so game code and panel code visibly disagree on which path they're using. The closure method stays `register` because it's the historical API.

### 3. `list` reports `source`

```ts
list(): RegistryListEntry[] {
  const out: RegistryListEntry[] = [];
  for (const [name, entry] of this.entries) {
    out.push({ name, source: entry.source, /* ...summary fields */ });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
```

Editor panels use `source` to pick the row marker (`◆` data / `◇` code) and to gray out code-sourced rows that can't be edited in the panel (the closure lives in the game's TS, not in the registry).

### 4. `serialize` emits only data-sourced entries

```ts
serialize(): { graphs: Record<string, GraphData> } {
  const graphs: Record<string, GraphData> = {};
  for (const [name, entry] of this.entries) {
    if (entry.source === 'data' && entry.graphData) {
      graphs[name] = entry.graphData;
    }
  }
  return { graphs };
}
```

Closure entries stay out of the payload — you can't serialize a JS function. Games re-register their closures on boot, same way they register components or prefabs. This is the **hard invariant**: don't try to serialize closures.

### 5. `deserialize` drops stale data; preserves closures

```ts
deserialize(payload: { graphs?: Record<string, GraphData> }): void {
  if (!payload) return;
  // Drop data-sourced entries (prevents leftover renames from bleeding through)
  for (const [name, entry] of this.entries) {
    if (entry.source === 'data') this.entries.delete(name);
  }
  // Restore from payload
  for (const [name, data] of Object.entries(payload.graphs ?? {})) {
    try { this.registerGraph(name, data); }
    catch { /* malformed entry — skip silently */ }
  }
}
```

Closure entries survive deserialize untouched. A project file never carries closure entries, so there's no conflict.

---

## The Quests variation — definitions vs. instances

Quests (S70) discovered that "serialize only data-sourced entries" is too narrow when the registry carries **per-definition runtime state** rather than per-closure state. A quest's progress belongs to the quest *name*, not to whether that name was code- or data-registered. Opening a project with an in-progress quest should restore progress for closure-registered quests too — otherwise the run is silently broken.

Solution: serialize *definitions* filtered by source AND serialize *instances* across both sources.

```ts
serialize(): { definitions: Record<string, QuestData>, instances: Record<string, RuntimeState> } {
  const definitions: Record<string, QuestData> = {};
  const instances: Record<string, RuntimeState> = {};
  for (const [name, entry] of this.entries) {
    if (entry.source === 'data' && entry.data) definitions[name] = entry.data;
    if (entry.runtimeState) instances[name] = entry.runtimeState;   // both sources
  }
  return { definitions, instances };
}

deserialize(payload): void {
  // Drop data definitions; restore from payload
  for (const [name, e] of this.entries) if (e.source === 'data') this.entries.delete(name);
  for (const [name, data] of Object.entries(payload.definitions ?? {})) this.registerQuest(name, data);
  // Restore instances onto ALL currently-registered entries (code + data)
  for (const [name, state] of Object.entries(payload.instances ?? {})) {
    const entry = this.entries.get(name);
    if (entry) entry.runtimeState = state;
  }
}
```

**Rule of thumb:**
- If state is per-closure (behaviors, sequencer): serialize definitions only, filtered by source.
- If state is per-name and meaningful across sources (quests, anything with progress/score/unlock): serialize definitions filtered by source AND instances across both sources.

Today quests is the only per-name-state case. If you hit a second, the same structural decision applies.

---

## Events

Registry lifecycle events include `source` in the payload:

```ts
this.emit('x:registered', { name, source: 'code' | 'data' });
this.emit('x:updated',    { name, source: 'code' | 'data' });
this.emit('x:removed',    { name });   // source not useful after removal
```

Re-register flow: when a name already exists, emit `x:updated` (not a `removed + registered` pair). Makes listener logic simpler.

---

## Malformed data handling

`deserialize` + `registerGraph` both tolerate malformed input without throwing:
- Entries with missing required fields skip (log to console in dev; silent in prod).
- Graph compilation failures (no entry node, no out-edge) reject the registration but don't break the whole deserialize.
- A previously-good registration stays live when a mid-edit panel flush produces an uncompilable graph — keep the last known-good runtime def until a valid replacement arrives.

Games re-register their closures on boot; malformed JSON in a shared pack shouldn't brick a project.

---

## Test checklist

Dual-source tests should cover, at minimum:

- [ ] `register` sets `source: 'code'`; `registerGraph` sets `source: 'data'`
- [ ] `list` reports `source` for each entry
- [ ] `serialize` includes data-sourced defs; excludes code-sourced defs
- [ ] `deserialize` drops stale data entries + preserves closure entries
- [ ] `deserialize({})` preserves closure entries (no-op on data side)
- [ ] Re-register emits `x:updated`, not a pair
- [ ] Malformed graph data rejects gracefully; doesn't crash
- [ ] For quests-shaped registries: instance state serializes for BOTH sources; deserialize restores progress onto currently-registered entries

See `BehaviorGraph.test.ts` / `Sequencer.test.ts` / `PostProcess.test.ts` / `QuestSystem.test.ts` for concrete shapes.

---

## Adjacent docs

- [`ten-gate-checklist.md`](ten-gate-checklist.md) — gate 3 (serialize) is where this pattern becomes load-bearing.
- [`graph-editor-as-backbone.md`](graph-editor-as-backbone.md) — the data-path authoring surface for behaviors / sequencer; includes the quests-declined counterexample.
- [`../reference/engine-facade.md`](../reference/engine-facade.md) — full API shapes for each of the 4 dual-source consumers.
