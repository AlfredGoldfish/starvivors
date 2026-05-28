# Graph Editor

`GraphEditor` is a generic, reusable node-graph authoring surface that lives in `src/editor/components/`. It handles pan, zoom, node drag, edge drawing, selection, copy/paste, keyboard navigation, minimap, and JSON round-trip. Consumers supply only a `NodeTypeSpec[]` — the palette describing what node kinds exist. The infrastructure is shared.

Files:
- `src/editor/components/GraphEditor.ts` — the class
- `src/editor/components/GraphEditor.types.ts` — `NodeTypeSpec`, `GraphNode`, `GraphEdge`, `GraphData`, `GraphSelection`
- `src/editor/components/GraphEditorCommands.ts` — every mutation as an `EditorCommand` (undo/redo)
- `src/editor/components/GraphEditorRender.ts` — Canvas2D rendering helpers (bezier edges, minimap)
- `src/editor/components/GraphEditor.test.ts` — unit tests (no jsdom required — DOM is stubbed)

Adjacent file: `editor-panels.md` for where `GraphEditor` is used in the dev environment; `engine-facade.md` → `engine.editor.commands` for the shared undo/redo stack.

---

## The core rule: don't fork it — supply a palette

If you need a graph-shaped editor for a new subsystem (sequencer flows, quest DAGs, state machines for screens), mount a `GraphEditor` instance and pass your `NodeTypeSpec[]`. Do not write a parallel node-graph from scratch. The `GraphEditor` already handles all the interaction; you only define what node kinds exist.

This was the design decision made for both `DialogTreeRegistry` and `BehaviorGraphRegistry`. The same backbone serves both; the consumers provide their own palette.

---

## Data model

The graph data model is intentionally flat (defined in `GraphEditor.types.ts`):

```ts
interface GraphNode {
  id: string
  type: string        // must match a NodeTypeSpec.type in the palette
  x: number
  y: number
  fields: Record<string, unknown>
}

interface GraphEdge {
  id: string
  from: { nodeId: string; portId: string }
  to:   { nodeId: string; portId: string }
}

interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
```

A graph authored in the UI and a graph written by hand in JSON are fully interchangeable. `toJSON()` and `fromJSON()` are the serialization round-trip — the same format that `engine.behaviors.register` / `engine.dialog.register` consume.

---

## `NodeTypeSpec` — the palette contract

Each entry declares one node kind:

```ts
interface NodeTypeSpec {
  type: string            // stable key — referenced by GraphNode.type
  label: string           // titlebar text
  color?: string          // CSS color for the titlebar; defaults to --accent
  description?: string    // shown in empty-state and tooltip
  ports: readonly PortSpec[]
  fields: readonly FieldSpec[]
}

interface PortSpec {
  id: string
  label?: string
  kind: 'input' | 'output'
}

interface FieldSpec {
  key: string
  label?: string
  widget: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'color'
  options?: readonly string[]   // for widget='select'
  placeholder?: string
  default?: unknown              // applied when a node of this type is created
}
```

Example palette for a Dialog system:

```ts
const DIALOG_PALETTE: NodeTypeSpec[] = [
  {
    type: 'line',
    label: 'Line',
    color: '#4a90d9',
    description: 'A speaker line of dialogue.',
    ports: [{ id: 'in', kind: 'input' }, { id: 'out', kind: 'output' }],
    fields: [
      { key: 'speaker', label: 'Speaker', widget: 'text', default: '' },
      { key: 'text',    label: 'Text',    widget: 'textarea', default: '' },
    ],
  },
  {
    type: 'choice',
    label: 'Choice',
    color: '#d9a94a',
    description: 'A player choice that branches to another node.',
    ports: [{ id: 'in', kind: 'input' }, { id: 'out', kind: 'output' }],
    fields: [
      { key: 'label',     label: 'Choice text',       widget: 'text', default: '' },
      { key: 'condition', label: 'Condition (optional)', widget: 'text', default: '' },
    ],
  },
]
```

---

## Mounting a `GraphEditor`

```ts
import { GraphEditor } from '../../editor/components/GraphEditor'
import type { NodeTypeSpec } from '../../editor/components/GraphEditor.types'

const editor = new GraphEditor({
  host: containerElement,            // HTMLElement to build into
  nodeTypes: MY_PALETTE,             // NodeTypeSpec[]
  initial: existingGraphData,        // GraphData | undefined — load existing graph
  commands: engine.editor.commands,  // share engine-wide undo/redo stack (optional)
  onChange: (data) => {
    // Called after every mutation with the full serialized graph
    engine.dialog.register('my-tree', convertToDialogDef(data))
  },
})

// Later, to get the current graph:
const data = editor.toJSON()

// To tear down (removes event listeners, clears DOM):
editor.destroy()
```

`commands` is optional — if omitted, mutations execute directly without history. Pass `engine.editor.commands` to wire the GraphEditor into the same Ctrl+Z stack as the rest of the dev environment.

---

## Selection and programmatic API

```ts
// Read selection
const sel = editor.getSelection()    // → GraphSelection { nodeIds, edgeIds }

// Set selection
editor.setSelection({ nodeIds: ['node-1', 'node-2'], edgeIds: [] })
editor.clearSelection()

// Programmatic mutations (go through CommandHistory if commands was passed):
editor.addNode({ id: 'n1', type: 'line', x: 100, y: 200, fields: { speaker: 'NPC', text: 'Hello!' } })
editor.removeNodes(['n1'])
editor.addEdge({ id: 'e1', from: { nodeId: 'n1', portId: 'out' }, to: { nodeId: 'n2', portId: 'in' } })
editor.removeEdges(['e1'])
editor.moveNodes([{ id: 'n1', x: 200, y: 300 }])
editor.setField('n1', 'speaker', 'Guard')

// JSON round-trip:
const snapshot = editor.toJSON()      // → GraphData
editor.fromJSON(snapshot)             // replaces current graph
```

---

## Commands (undo/redo)

Every mutation is an `EditorCommand` from `GraphEditorCommands.ts`:

- `AddNodeCommand`
- `RemoveNodesCommand` — batch; undoes as a unit
- `MoveNodesCommand` — batch; captures from/to for each node
- `AddEdgeCommand`
- `RemoveEdgesCommand` — batch
- `SetFieldCommand`

When `commands` (`CommandHistory`) is provided, all mutations go through `commands.execute(new AddNodeCommand(...))`. Ctrl+Z calls `commands.undo()`, Ctrl+Shift+Z calls `commands.redo()`. Since `engine.editor.commands` is the same `CommandHistory` as the LevelEditor uses, a single undo/redo stack spans the entire authoring session.

---

## Rendering split: DOM nodes + Canvas2D edges

`GraphEditor` uses a hybrid approach:

- **Node elements** are DOM divs. CSS handles hover states, selection styling, and field inputs. Exact DOM height is measured at render time.
- **Edges** are drawn on a `<canvas>` behind the node layer. Bezier curves with direction arrows. The minimap is also canvas.

`GraphEditorRender.ts` exports the canvas drawing helpers: `drawEdges`, `drawGhostEdge` (during port-drag), `drawMarquee` (selection box), `drawMinimap`, and geometry utilities (`nodeRect`, `portEndpoint`, `estimateNodeHeight`).

---

## Coordinate system

The editor uses a world-space canvas. Pan is stored as `(panX, panY)` offsets; zoom is a scalar. The canvas transform is:

```
ctx.setTransform(zoom, 0, 0, zoom, panX, panY)
```

`screenToWorld(sx, sy)` and `worldToScreen(wx, wy)` convert between the two. Edge drawing always works in world coords; the caller sets up the transform before calling the render helpers.

Pan with Space held (or middle-mouse drag). Zoom with scroll wheel.

---

## Known consumers

`main.ts` in `src/dev-environment/` mounts a demo instance of `GraphEditor` under the `'graph-editor-demo'` dock panel id. This is a placeholder until `DialogEditorPanel` and `BehaviorEditorPanel` ship as proper dock panels, each wrapping `GraphEditor` with their own node palette.

When those panels land, they should follow the same pattern: a wrapper panel class that constructs a `GraphEditor` with the appropriate palette, wires `onChange` to call the matching registry API (`engine.dialog.register` / `engine.behaviors.register`), and registers with `DockManager`.
