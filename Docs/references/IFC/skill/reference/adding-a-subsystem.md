# Adding a New Engine Subsystem

How to add a new registry or manager to the `Engine` facade as a `readonly` field. This guide is modeled on `engine.i18n` (`LocalizationRegistry`, added as a small, self-contained example of the full pattern). Source to read alongside this doc: `src/engine/i18n/Localization.ts` and `src/engine/i18n/Localization.test.ts`.

Every subsystem is a TypeScript class in `src/engine/<subsystem>/`. It lives behind a facade field on `Engine`. Games reach it through `engine.<name>` — never by importing the class directly.

Adjacent file: `engine-facade.md` for the existing 49 subsystems; `principles.md` §2 for the API-first rule that requires a matching editor panel.

---

## Checklist

1. Create the subsystem class
2. Add it to `Engine.ts` (import, field declaration, construction, wiring, destroy, serialize/deserialize)
3. Write tests
4. Optionally: create an editor panel (required if the subsystem exposes any authoring API)
5. Verify: `npx tsc --noEmit` and `npx vitest run`

---

## Step 1: create the class

Create `src/engine/<subsystem>/<SubsystemName>.ts`. Follow the conventions:

- One primary export per file.
- File-level comment: one line describing the module's purpose, then a block with use cases.
- Take `engine: EngineInterface` in the constructor if you need to emit events or read other subsystems. Store a reference as `private engine: EngineInterface`.
- Do not import React, Zustand, DOM APIs beyond Canvas2D/Web Audio, or any game-specific code.

**Registry pattern** — the standard shape for a named-content subsystem:

```ts
/** MyRegistry — one-line purpose.
 *
 * Games register named Foo definitions and retrieve them by name.
 * Use cases:
 *   - X
 *   - Y
 */

import type { EngineInterface } from '../types';

export interface FooDef {
  /* the data for each named entry */
}

export interface FooListEntry {
  name: string;
  /* summary fields for listings */
}

export class MyRegistry {
  private entries = new Map<string, FooDef>();
  private engine: EngineInterface;

  constructor(engine: EngineInterface) {
    this.engine = engine;
  }

  // ─── registry CRUD ───

  register(name: string, def: FooDef): void {
    this.entries.set(name, { ...def });   // shallow clone to prevent external mutation
  }

  get(name: string): FooDef | undefined {
    const e = this.entries.get(name);
    return e ? { ...e } : undefined;
  }

  has(name: string): boolean {
    return this.entries.has(name);
  }

  remove(name: string): boolean {
    return this.entries.delete(name);
  }

  list(): FooListEntry[] {
    return Array.from(this.entries.entries()).map(([name, def]) => ({
      name,
      /* summary fields */
    }));
  }

  count(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }

  // ─── serialize / deserialize ───

  serialize(): { entries: Record<string, FooDef> } {
    const out: Record<string, FooDef> = {};
    for (const [k, v] of this.entries) out[k] = { ...v };
    return { entries: out };
  }

  deserialize(data: { entries?: Record<string, FooDef> } | undefined): void {
    if (!data?.entries) return;
    this.entries.clear();
    for (const [k, v] of Object.entries(data.entries)) {
      this.entries.set(k, { ...v });
    }
  }
}
```

**`attach` pattern** — use when the subsystem needs to wire cross-engine connections (events, renderer, etc.) after all siblings are constructed:

```ts
attach(events: EventBusInterface): void {
  this.events = events;
  // e.g. subscribe to 'game:over' here, not in constructor
}
```

`engine.music`, `engine.parallax`, `engine.inventory`, and `engine.animations` all use `attach`. The constructor takes only what it strictly needs to construct; `attach` wires runtime dependencies.

---

## Step 2: add to `Engine.ts`

Five places to touch in `Engine.ts`:

### 2a. Import

```ts
import { MyRegistry } from './<subsystem>/MyRegistry';
```

### 2b. Declare the readonly field

Add it to the class body with the other readonly declarations, alphabetically within its role group:

```ts
readonly myRegistry: MyRegistry;
```

### 2c. Construct in the constructor body

After the other constructions in the constructor, in dependency order (if your subsystem needs `events`, construct after `events`):

```ts
this.myRegistry = new MyRegistry(this);
// If it needs to attach to siblings:
// this.myRegistry.attach(this.events);
```

### 2d. Serialize

In `Engine.save()`, add a key to the `payload.registries` object:

```ts
payload.registries = {
  // ... existing keys ...
  myRegistry: this.myRegistry.serialize(),
};
```

### 2e. Deserialize

In `Engine.load()`, add a conditional deserialize block matching the pattern of adjacent fields:

```ts
const myRegistryData = (r as { myRegistry?: Parameters<MyRegistry['deserialize']>[0] }).myRegistry;
if (myRegistryData) this.myRegistry.deserialize(myRegistryData);
```

### 2f. Destroy

In `Engine.destroy()`, add the clear/detach call. Order: subsystems that hold DOM refs or RAF loops should come earlier:

```ts
this.myRegistry.clear();
```

---

## Step 3: write tests

Create `src/engine/<subsystem>/MyRegistry.test.ts` next to the source file. The test file naming convention is `ModuleName.test.ts`.

**Standard test coverage for a registry:**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MyRegistry } from './MyRegistry';
import type { EngineInterface } from '../types';

function makeEngine(): EngineInterface {
  // Minimal stub — only wire what your registry actually uses
  const handlers: Record<string, Array<(data: unknown) => void>> = {};
  return {
    events: {
      on(e: string, h: (d: unknown) => void) { (handlers[e] ??= []).push(h); },
      off() {},
      once() {},
      emit(e: string, d?: unknown) { for (const h of handlers[e] ?? []) h(d); },
      observe() { return () => {}; },
      clear() {},
    },
  } as unknown as EngineInterface;
}

describe('MyRegistry', () => {
  let reg: MyRegistry;

  beforeEach(() => {
    reg = new MyRegistry(makeEngine());
  });

  it('registers and retrieves an entry', () => {
    reg.register('foo', { /* ... */ });
    expect(reg.has('foo')).toBe(true);
    expect(reg.get('foo')).toMatchObject({ /* ... */ });
  });

  it('lists entries', () => {
    reg.register('a', { /* ... */ });
    reg.register('b', { /* ... */ });
    expect(reg.list()).toHaveLength(2);
  });

  it('removes an entry', () => {
    reg.register('foo', { /* ... */ });
    reg.remove('foo');
    expect(reg.has('foo')).toBe(false);
  });

  it('clears all entries', () => {
    reg.register('a', { /* ... */ });
    reg.clear();
    expect(reg.count()).toBe(0);
  });

  // ── serialize / deserialize round-trip ──
  it('round-trips through serialize/deserialize', () => {
    reg.register('foo', { /* ... */ });
    const saved = reg.serialize();
    const reg2 = new MyRegistry(makeEngine());
    reg2.deserialize(saved);
    expect(reg2.has('foo')).toBe(true);
    expect(reg2.get('foo')).toEqual(reg.get('foo'));
  });

  it('deserialize handles missing data gracefully', () => {
    expect(() => reg.deserialize(undefined)).not.toThrow();
    expect(() => reg.deserialize({} as never)).not.toThrow();
  });
});
```

Cover: creation, core functionality, edge cases, and the round-trip. The round-trip test is the most important — serialization bugs don't surface until a project fails to reload.

---

## Step 4: editor panel (required by API-first rule)

If `MyRegistry` exposes any authoring API (register, edit, remove), ship a matching panel. The minimum viable panel:

1. Create `src/dev-environment/MyRegistryPanel.ts`.
2. Every control maps to an engine API call. No editor-only operations.
3. All mutations go through `engine.editor.commands` for undo/redo.
4. Register as a `DockPanelDef` (see `editor-panels.md` for conventions).
5. Use `ColorPicker` for any color selection.
6. Use `showToast` for save confirmations.

Record the API + panel pairing in `SESSION_LOG.md` under the session's Results (per `CLAUDE.md`).

---

## Step 5: verify

From the repo root:

```sh
npx tsc --noEmit     # must pass — no type errors
npx vitest run       # must pass — all tests green
```

If the subsystem has an editor panel, also boot the dev server and manually verify the panel works.

---

## Example: `engine.i18n` (reference)

`LocalizationRegistry` is the canonical small subsystem to read alongside this guide. It shows:

- `constructor(engine)` storing the engine ref for event emission
- Standard CRUD: `register`, `get`, `has`, `remove`, `list`, `count`, `clear`
- Runtime behavior beyond CRUD: `setLocale`, `t(key, params)`, `missingKeys`, `coverage`
- `serialize` / `deserialize` round-trip
- Event emission (`locale:changed`) via `engine.events.emit`
- How to handle graceful degradation: `t(key)` returns the key itself when translation is missing

`Localization.test.ts` shows the test stub pattern and covers all the cases above.

---

## Common mistakes

**Forgetting `clear()` in `Engine.destroy()`.** If the subsystem holds DOM event listeners or subscribes to `engine.events`, they will leak into the next engine instance if `destroy` doesn't clean them up.

**Not adding to `serialize` / `load`.** The subsystem's content silently disappears when the project is saved and reloaded. Always add both sides.

**Importing from `src/game-*/`, `src/dev-environment/`, or `src/editor/`.** The engine has zero knowledge of those layers. If you need a callback from the dev environment (e.g. a blob loader), accept it as a callback parameter (`setBlobLoader(fn)`) instead of importing.

**Mutating the input to `register`.** Shallow-clone incoming defs (`{ ...def }`) so external code can't mutate registered data by keeping a reference.

**Constructing in the wrong order.** If subsystem B's constructor needs subsystem A, construct A first. The constructor body in `Engine.ts` is the sequence; read it top-to-bottom.
