# Adventure World

The map is a generated SVG, not a collage of independently positioned images.
Edit `scripts/build-world.mjs`, then run `node scripts/build-world.mjs` and
`node --test tests/world.test.mjs`. Commit the generated SVG with its source.

## Projection and Lighting

- The scene is 600 by 700 units. Ground coordinates are already foreshortened.
- Positive z is height above the receiving ground plane. Screen y is ground y minus z.
- Sunlight comes from the upper left. A point at height z casts its ground shadow
  at x + 0.62z, y + 0.3z. Do not substitute an arbitrary oval for a cast shadow.
- Terrain tops and cliff faces come from the same rounded boundary. The island
  is 36 units high; the upper plateau rises another 58 units.
- Paint each receiving surface, then its shadows, then its objects in ground-y
  order. Apply shadow opacity to the group so intersecting shadows do not double.
- Shadow clipping uses the receiving surface: upper plateau, lower grass, or sea.
- Trees, hills, buildings, and equipment use the same palette and upper-left light.

## Route and Scale

`ROUTE` must match `#travel-route` in `index.html`; a test checks this. Checkpoint
coordinates also live in `index.html` and `adventure.js`. The decorative summit
route is not yet playable. Preserve the completed/current/locked states.

Place landmarks beside the route, not over it. The bridge must span the river on
the walking path. Keep the goal and net on one ground plane. Waterfall foam and
ripples must land beyond the bottom of the cliff, inside the SVG bounds.

Review at 320px, 390px, and desktop widths after geometry edits. The character
and scenery scale with the map; interactive checkpoints retain touch-sized hit
areas. Water and walking animations must honor reduced-motion preferences.
