const paths = new WeakMap();

// Sample each SVG path once, then refine only around the closest sample.
export function nearestPoint(path, point) {
  let cached = paths.get(path);
  if (!cached) {
    const length = path.getTotalLength();
    const samples = [];
    for (let d = 0; d < length; d += 4) samples.push({ d, p: path.getPointAtLength(d) });
    samples.push({ d: length, p: path.getPointAtLength(length) });
    cached = { length, samples };
    paths.set(path, cached);
  }
  const distance = p => (p.x - point[0]) ** 2 + (p.y - point[1]) ** 2;
  let best = 0, gap = Infinity;
  for (const { d, p } of cached.samples) {
    const next = distance(p);
    if (next < gap) { gap = next; best = d; }
  }
  const end = Math.min(cached.length, best + 4);
  for (let d = Math.max(0, best - 4); d <= end; d += .25) {
    const next = distance(path.getPointAtLength(d));
    if (next < gap) { gap = next; best = d; }
  }
  return best;
}
