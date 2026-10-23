import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../mountain/viewport.js', import.meta.url), 'utf8');

function viewportFit({ width, height, top, scroll = 0, screenWidth = 375, paddingBottom = 0 }) {
  let result;
  const stage = { clientWidth: width, getBoundingClientRect: () => ({ top: top - scroll }) };
  const main = { style: { setProperty: (_, value) => { result = Number.parseFloat(value); } } };
  runInNewContext(source, {
    getComputedStyle: () => ({paddingBottom: `${paddingBottom}px`}),
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
    assert.match(html, /type="module" src="[^\"]*viewport\.js\?v=4/);
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
  assert.match(css, /width: min\(88%, calc\(var\(--map-height, 900px\) \* 1\.3 \+ 120px\)\)/);
  assert.match(css, /max-width: 2200px/);
  assert.match(css, /padding-block: clamp\(24px, 4vh, 64px\)/);
  for (const screen of [{screenWidth:1920,height:1080}, {screenWidth:2560,height:1440}, {screenWidth:3840,height:2160}]) {
    const fitted=viewportFit({...screen,width:600,top:70});
    assert.equal(fitted,screen.height-90);
    const layoutWidth=Math.min(2200,screen.screenWidth*.88,fitted*1.3+120);
    assert.ok(layoutWidth>1240);
    assert.ok(layoutWidth<screen.screenWidth);
  }
  for (const file of ['index.html','mountain/playground/index.html']) {
    assert.match(readFileSync(new URL(`../${file}`,import.meta.url),'utf8'), /detail-panel\.css\?v=10/);
  }
});

test('both worlds request identical shared sizing and spacing assets', () => {
  const pages=['index.html','mountain/playground/index.html'].map(file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8'));
  const assets=html=>[...html.matchAll(/(?:href|src)="([^"]*(?:viewport\.(?:css|js)|detail-panel\.css)\?v=\d+)"/g)].map(match=>match[1]);
  assert.deepEqual(assets(pages[0]),assets(pages[1]));
});

test('desktop map reserves outer padding, border and shadow without page overflow', () => {
  for (const paddingBottom of [28, 43.2, 64]) {
    const height=viewportFit({width:800,height:1440,top:100,screenWidth:2560,paddingBottom});
    assert.ok(100+height+paddingBottom+13<=1440);
  }
  const css=readFileSync(new URL('../mountain/detail-panel.css',import.meta.url),'utf8');
  assert.match(css,/\.intro h1 \{ font-size: clamp\(30px, 1.5vw, 38px\)/);
  assert.match(css,/\.details > p:not\(\.eyebrow\) \{ font-size: 16px/);
});

test('desktop worlds prevent document scrolling while keeping panel overflow accessible', () => {
  const css=readFileSync(new URL('../mountain/detail-panel.css',import.meta.url),'utf8');
  assert.match(css, /@media \(min-width: 1024px\) and \(min-height: 700px\)/);
  assert.match(css, /html, body \{ height: 100%; overflow: hidden; overscroll-behavior: none/);
  assert.match(css, /height: 100dvh; grid-template-rows: minmax\(0, 1fr\) minmax\(0, 1fr\)/);
  assert.match(css, /\.intro, \.details \{[^}]*overflow-y: auto/);
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
    getComputedStyle: () => ({paddingBottom:'28px'}),
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
