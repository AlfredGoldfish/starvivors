# GraphEditor as Backbone

How to decide whether a new subsystem should reuse the shared `GraphEditor` component — and what to do instead when it shouldn't.

**When to reach for this pattern:** you're surveying a new graph-shaped subsystem (state machines, DAGs, flows, trees with branching) for its editor panel. You need to decide: mount a `GraphEditor` with a custom palette, or build something else?

**When NOT to reach for this pattern:** the data is list-shaped (objectives in order, timeline of keyframes without branches) or canvas-shaped (tile painter, scene layout). Forcing graph authoring onto non-graph data fragments the UX and adds authoring friction — see the Quests declined case below.

The reference for the component itself is [`../reference/graph-editor.md`](../reference/graph-editor.md). This doc is about the *decision*, not the API.

---

## The core rule

**If it's graph-shaped, mount the shared `GraphEditor` with a `NodeTypeSpec[]` palette. Do not fork.**

The component in `src/editor/components/GraphEditor.ts` handles pan / zoom / selection / edge drawing / minimap / keyboard nav / JSON round-trip / undo-redo. Consumers supply only the palette and the inspector. Three sessions in a row confirmed the backbone covers every authoring need without modification.

---

## Validated consumers (3 as of S66)

| Session | Subsystem | Palette size | GraphEditor extensions needed |
|---|---|---|---|
| S62 | `engine.dialog` | 6 nodes (Line / Choice / Branch / SetVar / Jump / End) | Added `portsForNode`, `bodyPreview`, `hideFieldsInNode`, `onSelectionChange` |
| S65 | `engine.behaviors` | 2 nodes (entry / state, with dynamic transitions via ports) | **Zero** — reused S62 additions |
| S66 | `engine.sequencer` | 6 nodes (entry / wait / event / parallel / branch / end) | **Zero** — reused S62 additions |

**The backbone is validated.** S62's four extensions are sufficient for every graph-shape subsystem shipped so far. A 4th consumer that hits a real gap should fix the shared component — not fork.

---

## The palette contract (summary)

Full spec in [`../reference/graph-editor.md`](../reference/graph-editor.md). Operationally, you supply:

```ts
const palette: NodeTypeSpec[] = [
  {
    type: 'state',                      // stable key — matches GraphNode.type
    label: 'State',
    color: '#3a82ff',                   // titlebar color
    description: 'A behavior state',    // empty-state tooltip
    ports: [
      { id: 'in',  kind: 'input'  },
      { id: 'out', kind: 'output' },    // static port; use portsForNode() for dynamic
    ],
    fields: [
      { key: 'name',        widget: 'text',     default: 'idle' },
      { key: 'onEnter',     widget: 'textarea', placeholder: 'entity.vx = 0' },
      { key: 'onTick',      widget: 'textarea' },
      { key: 'onExit',      widget: 'textarea' },
      { key: 'transitions', widget: 'textarea' },
    ],
  },
  // ...more node types
];
```

And optionally:

- `portsForNode(node)` — dynamic output ports driven by a field (parallel branches, Choice options, state transitions).
- `bodyPreview(node)` — one-line summary rendered on the compact card body.
- `hideFieldsInNode(node)` — hide fields on the card; render them in the right-sidebar inspector.
- `onSelectionChange(selection)` — drive the right-sidebar inspector.

If a new consumer needs a 5th extension, **fix the shared component**. Don't fork.

---

## Counterexample — Quests declined the backbone (S70)

Quests is graph-*adjacent* (objectives can gate on prerequisites, forming a DAG over quest names) but NOT graph-shaped inside a single quest. A quest's objectives are a list: `talk → bring → kill`. The ordering is authorial, but there's no branching inside the quest itself — branches between story paths are handled by the meta-level `prerequisites: string[]` field on each quest, giving a DAG over the registry without forking `GraphEditor` as a 4th consumer.

**The decision.** Use a flat objective-list panel with a prerequisites chip-list picker. Skip `GraphEditor` for this subsystem. The backbone stays validated-for-3; the 4th-consumer milestone waits for a subsystem genuinely graph-shaped inside a single entry.

**When to apply this reasoning.** If your subsystem's "graph" is just a 1-deep parent/child relationship over named entries (quest prerequisites, scene dependencies, asset references), it's meta-DAG — use a chip-list or dropdown, not a graph editor. A graph editor is for authoring the *internal* shape of a single entry.

**What would bring quests back.** If a single quest grows internal branches (objective A succeeds → do X; objective A fails → do Y), that's graph-shape. Then the prerequisites DAG stays as metadata + you mount a `GraphEditor` inside the quest inspector. Pass 3 S70 follow-up flagged this as a possible future extension.

---

## The decision tree

Walk this list before deciding to mount `GraphEditor`:

1. **Is the data genuinely graph-shaped?** Meaning: entries have edges between sub-items inside a single entry, edges have semantics, sub-items have more than 2 types. If any answer is "no", list-shape or form-shape is better. → See quests.
2. **Is the graph author-facing?** The AI operator emits JSON either way — `GraphEditor` is primarily for the human. If the registry is intended to be game-authored only (closures all the way down), skip the panel entirely; a read-only Asset Browser tab is sufficient.
3. **Does the existing `GraphEditor` extension surface cover your needs?** Read [`../reference/graph-editor.md`](../reference/graph-editor.md). If you'd need a 5th extension mechanism, propose the extension to the shared component in your session's survey — don't fork.
4. **Are you tempted to override Canvas2D rendering for a special case?** Stop. `GraphEditor` renders with Canvas2D and the tile-painter / level-editor are separate Canvas surfaces for deliberate reasons. Graph rendering stays in `GraphEditor`.

---

## Known extension gaps (Pass 3 follow-ups)

These are gaps flagged across S65 / S66 that *might* need shared-component fixes, depending on whether a future subsystem actually hits them:

- **Visual transition labels on edges.** Edges today don't carry field data. Sequencer parallel-branch names and branch true/false labels read better on edges than on source nodes. Would need `edgeLabels: (edge) => string`. Bundle with any GraphEditor touch-up surfaced by the S86 Asset Browser audit. Else post-1.0.
- **Live runtime preview inside nodes.** Dialog has a "Start → advance" strip at the panel level; Sequencer / Behaviors could highlight the active node as a graph runs. Pattern-wise this is an overlay on top of `GraphEditor`'s render, not a backbone change — bundle with S83 engine.docs live surface (same "consume registry → render live" shape).
- **Nested / sub-graph nodes.** A node that embeds another graph as its body. Significant scope — deferred.

**If a 4th consumer lands and hits any of these, fix the shared component.** Don't hack around it.

---

## Test checklist

Graph-shape tests should cover, at minimum:

- [ ] Palette registers every expected node type
- [ ] `GraphData → registry.registerGraph(name, data) → runtime` round-trip
- [ ] Panel inspector edits flow through `engine.editor.commands` (unified undo)
- [ ] `portsForNode` driven by a field mutation updates port count without losing existing edges when edges still map to valid port ids
- [ ] `bodyPreview` renders for every node type
- [ ] Malformed graph (missing entry, dangling edge) rejects gracefully without crashing the panel

See `BehaviorGraph.test.ts` / `Sequencer.test.ts` for test shapes that exercise compile + register + serialize round-trip in one flow.

---

## Adjacent docs

- [`../reference/graph-editor.md`](../reference/graph-editor.md) — full API surface for `GraphEditor` + `NodeTypeSpec`.
- [`dual-source-registry.md`](dual-source-registry.md) — every graph-shape consumer (dialog excepted) is dual-source; the data path is what `GraphEditor` produces.
- [`ten-gate-checklist.md`](ten-gate-checklist.md) → gate 6 — the editor panel that hosts `GraphEditor`.
