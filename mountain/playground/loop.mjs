export function wrapDistance(distance, length) {
  return ((distance % length) + length) % length;
}

// Pick the shorter direction, including across the closed path's start/end seam.
export function shortestLoopTarget(from, to, length) {
  const forward = wrapDistance(to - from, length);
  return from + (forward > length / 2 ? forward - length : forward);
}
