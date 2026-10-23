import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

function setup(reduced = false) {
  const animations = [];
  const element = {
    style: { setProperty() {} },
    getBoundingClientRect: () => ({ left: 500, right: 480 }),
    animate(frames, options) {
      let resolve, reject;
      const finished = new Promise((yes, no) => { resolve = yes; reject = no; });
      const animation = { frames, options, finished, resolve, cancel: () => reject(new Error('cancelled')) };
      animations.push(animation);
      return animation;
    },
  };
  const context = {
    document: { querySelector: () => element },
    window: { addEventListener() {} },
    ResizeObserver: class { observe() {} },
    getComputedStyle: () => ({ opacity: '.55', transform: 'matrix(1, 0, 0, 1, -12, 0)' }),
    matchMedia: query => ({ matches: reduced && query.includes('reduced-motion') }),
  };
  const source = readFileSync(new URL('../mountain/detail-panel.mjs', import.meta.url), 'utf8');
  runInNewContext(source.replace('export function', 'function'), context);
  return { update: context.updatePanel, animations };
}

test('panel keeps current visual position and discards superseded selections', async () => {
  const { update, animations } = setup();
  const rendered = [];
  update('first', () => rendered.push('first'));
  update('second', () => rendered.push('second'));
  assert.equal(animations[0].frames[0].opacity, '.55');
  update('third', () => rendered.push('third'));
  animations[1].resolve();
  await Promise.resolve();
  assert.deepEqual(rendered, ['first', 'third']);
  assert.equal(animations[2].options.duration, 480);
});

test('reduced-motion users receive new details without animation', () => {
  const { update, animations } = setup(true);
  let title;
  update('first', () => { title = 'first'; });
  update('second', () => { title = 'second'; });
  assert.equal(title, 'second');
  assert.equal(animations.length, 0);
});
