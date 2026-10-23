import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../mountain/viewport.js', import.meta.url), 'utf8');

function viewportFit({ width, height, top, scroll = 0, screenWidth = 375 }) {
  let result;
  const stage = { clientWidth: width, getBoundingClientRect: () => ({ top: top - scroll }) };
  const main = { style: { setProperty: (_, value) => { result = Number.parseFloat(value); } } };
  runInNewContext(source, {
    document: {
      querySelector: selector => selector === '.stage' ? stage : main,
      documentElement: { clientHeight: height },
      fonts: { ready: Promise.resolve() },
    },
    window: { innerWidth: screenWidth, scrollY: scroll, addEventListener() {} },
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
    assert.match(html, /viewport\.css\?v=3/);
    assert.match(html, /type="module" src="[^\"]*viewport\.js\?v=3/);
  }
});

test('desktop sizing uses available height without shrinking on repeated resizes', () => {
  const options = { width: 460, height: 768, top: 55, screenWidth: 1366 };
  assert.equal(viewportFit(options), 693);
  assert.equal(viewportFit({ ...options, width: 330 }), 693);
  const css = readFileSync(new URL('../mountain/viewport.css', import.meta.url), 'utf8');
  assert.match(css, /\.stage \{ height: auto; aspect-ratio: 2 \/ 3; \}/);
});

test('large monitors expand both worlds without stretching the map', () => {
  const css = readFileSync(new URL('../mountain/detail-panel.css', import.meta.url), 'utf8');
  assert.match(css, /@media \(min-width: 1400px\)/);
  assert.match(css, /width: min\(96%, calc\(var\(--map-height, 900px\) \* 1\.55 \+ 120px\)\)/);
  for (const screen of [{screenWidth:1920,height:1080}, {screenWidth:2560,height:1440}, {screenWidth:3840,height:2160}]) {
    const fitted=viewportFit({...screen,width:600,top:70});
    assert.equal(fitted,screen.height-90);
    const layoutWidth=Math.min(screen.screenWidth*.96,fitted*1.55+120);
    assert.ok(layoutWidth>1240);
    assert.ok(layoutWidth<screen.screenWidth);
  }
  for (const file of ['index.html','mountain/playground/index.html']) {
    assert.match(readFileSync(new URL(`../${file}`,import.meta.url),'utf8'), /detail-panel\.css\?v=6/);
  }
});

test('plane interaction cannot pause the flight or reveal its hit rectangle', () => {
  const css = readFileSync(new URL('../mountain/atmosphere.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /support-flight:has/);
  assert.match(css, /\.flight-hit-area\s*\{ fill: transparent; stroke: none;/);
});

test('pointer activation clears keyboard mode without removing keyboard access', () => {
  const listeners = {};
  const root = { clientHeight: 768, dataset: {} };
  runInNewContext(source, {
    document: {
      documentElement: root,
      querySelector: () => ({ clientWidth: 600, getBoundingClientRect: () => ({ top: 200 }), style: { setProperty() {} } }),
      fonts: { ready: Promise.resolve() },
    },
    window: { scrollY: 0, addEventListener: (name, handler) => { listeners[name] = handler; } },
    ResizeObserver: class { observe() {} },
  });
  listeners.keydown({ key: 'Tab' });
  assert.equal(root.dataset.input, 'keyboard');
  listeners.pointerdown();
  assert.equal(root.dataset.input, 'pointer');
});
