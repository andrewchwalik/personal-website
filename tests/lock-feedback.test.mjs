import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../adventure.js', import.meta.url), 'utf8');
const bounce = source.slice(source.indexOf('async function bounceFromLock'), source.indexOf('function walk('));

function setup(reducedMotion = false) {
  const completions = [];
  const walks = [];
  const element = {
    classList: { add() {} },
    animate(frames, options) {
      assert.equal(options.duration, 560);
      assert.match(frames[1].filter, /drop-shadow/);
      return { finished: new Promise(resolve => completions.push(resolve)) };
    },
  };
  const context = {
    lockedReturn: { position: 12, branch: null, chapter: 3 },
    journey: 1, position: 90, route: {}, houseJunction: 40,
    document: { querySelector: () => element, getElementById: () => ({}) },
    player: { querySelector: () => element },
    matchMedia: () => ({ matches: reducedMotion }),
    walk: (...args) => walks.push(args),
    clearLockFeedback() {}, showChapter() {},
  };
  runInNewContext(bounce, context);
  return { context, completions, walks };
}

test('locked stop finishes its visible glitch before walking back', async () => {
  const { context, completions, walks } = setup();
  const result = context.bounceFromLock(1, {});
  assert.equal(completions.length, 2);
  assert.equal(walks.length, 0);
  completions.forEach(resolve => resolve());
  await result;
  assert.equal(walks.length, 1);
  assert.equal(walks[0][2], 12);
});

test('a new destination cancels the pending locked-stop return', async () => {
  const { context, completions, walks } = setup();
  const result = context.bounceFromLock(1, {});
  context.journey = 2;
  completions.forEach(resolve => resolve());
  await result;
  assert.equal(walks.length, 0);
});

test('reduced motion skips the shake and returns without waiting', async () => {
  const { context, completions, walks } = setup(true);
  await context.bounceFromLock(1, {});
  assert.equal(completions.length, 0);
  assert.equal(walks.length, 1);
});
