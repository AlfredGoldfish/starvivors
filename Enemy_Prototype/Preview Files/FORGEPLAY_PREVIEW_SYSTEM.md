# FORGEPLAY — Visual Preview System

## How It Works

Every selectable option in the configurator can have a visual preview — a small animated HTML demo that shows what that option looks like in practice.

---

## User Experience

1. User scrolls through the configurator
2. Next to an option (e.g., "Top-Down Fixed" in Viewport), there's a small eye icon (👁) or "?" button
3. User clicks it
4. A modal overlay appears:
   - Background dims to ~30% opacity
   - Centered card shows:
     - Header: option name + category tag
     - Animated preview (live HTML/canvas running in an iframe, ~400x300px)
     - Description text explaining what it is, when to use it, strengths/weaknesses
     - Genre tags and example games
     - Close button (X in corner, or click backdrop)
5. User closes modal, returns to configurator with better understanding

---

## Technical Architecture

### Preview Files
Each preview is a standalone HTML file:
- Self-contained (no external dependencies)
- Runs a looping canvas animation or CSS animation
- Sized to fill its container (responsive)
- Dark background matching the game aesthetic
- Includes a legend showing what each visual element represents

File naming: `preview-{category}-{option-id}.html`
Example: `preview-viewport-td_fixed.html`

### File Structure (in deployed project)
```
public/
  previews/
    viewport/
      td_fixed.html
      td_scroll.html
      side_grav.html
      side_free.html
      vert_scroll.html
      single.html
      room.html
      iso.html
    movement/
      free2.html
      horiz.html
      grid.html
      ...
    patterns/
      pick3.html
      card_draft.html
      shop_round.html
      wave_rest.html
      ...
    enemies/
      charger.html
      shooter.html
      patrol.html
      swarm.html
      ...
    actions/
      melee.html
      proj.html
      spell.html
      ...
    world/
      linear.html
      proc_rooms.html
      ...
    ui-elements/  (future)
      health_bar.html
      health_hearts.html
      minimap.html
      skill_tree.html
      ...
```

### Modal Component (React)
```jsx
function PreviewModal({ isOpen, onClose, previewUrl, title, category, description, tags, examples }) {
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <span className="modal-tag">{category}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-preview">
          <iframe src={previewUrl} title={title} />
        </div>
        <div className="modal-body">
          <p className="modal-desc">{description}</p>
        </div>
        <div className="modal-footer">
          {tags.map(t => <span className="modal-genre-tag">{t}</span>)}
          <span className="modal-examples">e.g. {examples}</span>
        </div>
      </div>
    </div>
  );
}
```

### Connecting to Taxonomy Data
Each item in CATS gets a `preview` field:
```js
{
  id: "td_fixed",
  l: "Top-Down Fixed",
  d: "Full area visible overhead",
  ex: "Vampire Survivors, Hotline Miami",
  tags: [T.ar, T.st],
  preview: "/previews/viewport/td_fixed.html"  // <-- new field
}
```

The eye icon button on each option reads `item.preview` and opens the modal with that URL.

---

## Preview Design Template

Every preview HTML follows this structure:

1. **Canvas area** (top) — 480x360px animated demo
   - Dark background (#12131a)
   - Geometric shapes only (circles, rectangles, triangles)
   - Color-coded entities (blue=player, red=enemy, yellow=item, green=projectile)
   - Legend in top-right corner
   - Smooth 60fps animation
   - Self-running AI (player moves automatically to demonstrate the mechanic)
   - Looping (resets or continuous)

2. **Description area** (below canvas)
   - Plain English explanation
   - Best for / Strengths / Weaknesses
   - Genre tags
   - Example games

3. **Visual style**
   - Matches ForgePlay sepia theme for the card frame
   - Dark game area inside
   - IBM Plex Mono for labels, Outfit for descriptions, Chakra Petch for titles
   - Subtle, clean, informational — not flashy

---

## Categories That Need Previews

### Priority 1 (most confusing for non-devs)
- All 8 Viewport options — camera behavior is abstract without seeing it
- All 7 Movement types — "grid" vs "free" vs "rail" needs visual
- All 12 Gameplay Patterns — "Pick 1 of 3" vs "Card Draft" vs "Node Map" are meaningfully different UX

### Priority 2 (helpful)
- Enemy behaviors — charger vs patrol vs flanker movement paths
- Spawn patterns — edge waves vs trickle vs burst visual
- Core actions — melee vs projectile vs spell visual
- Gravity types — standard vs low vs variable

### Priority 3 (nice to have)
- World structures — linear vs branching vs hub diagram
- HUD layouts — minimal vs standard vs detailed mockup
- Hazard types — spikes vs lasers vs rising floor
- Progression styles — skill tree vs stat allocation vs roster

### Priority 4 (future — UI elements)
- Health display variants (bar, hearts, ring, number)
- Minimap variants
- Inventory grid styles
- Shop screen layouts
- Damage number styles
- Skill tree visual layouts
- Each becomes its own preview file

---

## Future: Learning Mode / Gallery

The modal can expand into a full-screen gallery:
- Left/right arrows to browse related previews
- Filter by category
- "Next" / "Previous" navigation
- Fullscreen toggle
- Bookmark favorites

This is post-MVP. For now, the single-preview modal is sufficient.

---

## Future: Preview Reels

For the configurator sections, instead of per-item previews, show a "reel" — a horizontal scrollable strip of preview thumbnails. Click any thumbnail to expand to full modal. This lets users browse visually before reading descriptions.

---

## Integration Timeline

1. **Now**: Build standalone preview HTML files as design references
2. **Claude Code session**: Add PreviewModal component to React app
3. **Claude Code session**: Add `preview` field to taxonomy data
4. **Claude Code session**: Add eye icon buttons to each option
5. **Post-launch**: Add gallery mode, reels, and remaining previews
