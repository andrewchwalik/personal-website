import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../mountain/viewport.js', import.meta.url), 'utf8');

function viewportFit({ width, height, top, scroll = 0 }) {
  let result;
  const stage = { clientWidth: width, getBoundingClientRect: () => ({ top: top - scroll }) };
  const main = { style: { setProperty: (_, value) => { result = Number.parseFloat(value); } } };
  runInNewContext(source, {
    document: {
      querySelector: selector => selector === '.stage' ? stage : main,
      documentElement: { clientHeight: height },
      fonts: { ready: Promise.resolve() },
    },
    window: { scrollY: scroll, addEventListener() {} },
    ResizeObserver: class { observe() {} },
  });
  return result;
}

test('map fits laptop and phone viewports with bottom breathing room', () => {
  for (const options of [
    { width: 670, height: 768, top: 230 },
    { width: 349, height: 667, top: 185 },
    { width: 364, height: 844, top: 185 },
    { width: 349, height: 667, top: 210 },
  ]) {
    const fitted = viewportFit(options);
    assert.ok(fitted + options.top <= options.height - 19);
    assert.ok(fitted >= 360);
  }
});

test('scrolling does not enlarge the map and short screens retain usable targets', () => {
  const options = { width: 670, height: 768, top: 230 };
  assert.equal(viewportFit(options), viewportFit({ ...options, scroll: 300 }));
  assert.equal(viewportFit({ width: 500, height: 390, top: 200 }), 360);
});

test('both worlds load the shared viewport layout after their own styles', () => {
  for (const file of ['index.html', 'mountain/playground/index.html']) {
    const html = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /viewport\.css\?v=1/);
    assert.match(html, /type="module" src="[^\"]*viewport\.js\?v=1/);
  }
});
