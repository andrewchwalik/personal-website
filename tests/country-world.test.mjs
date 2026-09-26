import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { buildCountryWorld, buildTheatreRoom, COUNTRY_ROUTE, THEATRE_ROUTE } from '../scripts/build-world.mjs';

const source = readFileSync(new URL('../adventure.js', import.meta.url), 'utf8');
test('six completed country milestones use the requested order and links', () => {
  const stories = runInNewContext(source.slice(source.indexOf('const countryStories ='), source.indexOf('const countryStops =')) + '\ncountryStories;');
  const expected = [
    ['president', 'Elected President', 'https://youtu.be/5uaEyriSL3A'],
    ['startup', 'Startup Bus', 'https://startupbus.com'],
    ['masters', 'Masters Degree', 'https://www.youtube.com/playlist?list=PLzLEqDD8Aalbud4qkLVkzkFjuXDJrZ1Ee'],
    ['icecream', 'Ice Cream Shop', 'https://www.youtube.com/playlist?list=PLzLEqDD8AalYMul900PclGbOMbi8oqD33'],
    ['delaware', 'Delaware Rising', 'https://delawarerising.club'],
    ['house', 'First House', 'https://youtube.com/shorts/cGKcB-_NNdM'],
  ];
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal(Object.keys(stories).length, 6);
  let previousY = Infinity;
  expected.forEach(([id,title,url], index) => {
    assert.equal(stories[id].number, index + 1);
    assert.equal(stories[id].title, title);
    assert.equal(stories[id].url, url);
    assert.ok(stories[id].point[1] < previousY, 'higher numbers must be closer to the northern bridge');
    previousY = stories[id].point[1];
    assert.ok(html.includes(`class="level completed country-control" data-country="${id}"`));
  });
  assert.ok(!html.includes('data-chapter="1"'), 'the masters checkpoint has moved off the current island');
});

test('worlds use numbers and accessible arrow-only travel controls', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('id="world-name">WORLD 02</span>'));
  assert.match(html, /aria-label="Visit World 01"[^>]*>↓<\/button>/);
  assert.match(html, /aria-label="Visit World 02"[^>]*>↑<\/button>/);
  assert.doesNotMatch(html + source, /COUNTRY ROOTS|THE LONG GAME|WORLD 00/);
  assert.match(source, /active \? 'WORLD 01' : 'WORLD 02'/);
});

test('world one has a pasture, three cows and reduced-motion-safe grazing', () => {
  const svg = buildCountryWorld();
  assert.match(svg, /id="pasture"/);
  assert.equal((svg.match(/class="pasture-cow"/g) || []).length, 3);
  assert.doesNotMatch(svg, /pond|bluff/);
  assert.match(svg, /prefers-reduced-motion:reduce/);
  assert.match(svg, /\.cow-head\{animation:none\}/);
});

test('country artwork and walking guide share a bridge-aligned route', () => {
  const svg = buildCountryWorld();
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal(readFileSync(new URL('../img/country-world.svg', import.meta.url), 'utf8'), svg);
  assert.ok(html.includes(`id="country-route" d="${COUNTRY_ROUTE}"`));
  assert.ok(svg.includes(`d="${COUNTRY_ROUTE}"`));
  assert.ok(COUNTRY_ROUTE.startsWith('M165 0'));
  assert.match(svg, /id="country-bridge"/);
  assert.doesNotMatch(svg, /NaN|undefined/);
});

function crossingContext(branch = null) {
  const walks = [], views = [];
  const handlers = {};
  const context = {
    crossing: false, inCountry: false, frame: 0, journey: 0, headingHome: false,
    lockedReturn: null, position: 400, branchPosition: branch, houseJunction: 20,
    countryStops: { house: 170, president: 600 }, theatreJunction: 380, countryPosition: 0, lastChapter: 9, theatrePosition: null,
    theatreRoute: { name: 'theatre', getTotalLength: () => 210 },
    route: { name: 'main' }, houseRoute: { name: 'house' },
    southRoute: { name: 'south', getTotalLength: () => 150 }, countryRoute: { name: 'country' },
    cancelAnimationFrame() {}, clearLockFeedback() {}, showCountryStory() {}, showChapter() {}, place() {},
    document: { querySelector: () => ({}), getElementById: id => ({ addEventListener: (type, handler) => { handlers[id] = handler; } }), dispatchEvent() {} },
    Event: class { constructor(type) { this.type = type; } },
    setCrossing(value) { context.crossing = value; },
    setCountryView(value) { context.inCountry = value; views.push(value); },
    walk(path, start, end, ticket, arrived) {
      walks.push([path.name, start, end]);
      if (path.name === 'country') context.countryPosition = end;
      if (path.name === 'theatre') context.theatrePosition = end;
      arrived();
    },
  };
  runInNewContext(source.slice(source.indexOf('function visitCountry()'), source.indexOf("document.getElementById('visit-country').addEventListener")), context);
  return { context, walks, views, handlers };
}

test('theatre artwork is current and its side path matches the walking guide', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes(`id="theatre-route" d="${THEATRE_ROUTE}"`));
  assert.ok(buildCountryWorld().includes(`d="${THEATRE_ROUTE}"`));
  assert.equal(readFileSync(new URL('../img/theatre-room.svg', import.meta.url), 'utf8'), buildTheatreRoom());
});

test('theatre visitors walk the side path and retrace it before leaving the island', () => {
  const {context, walks, handlers} = crossingContext();
  context.inCountry = true;
  context.countryPosition = 170;
  handlers['theatre-stop']();
  assert.deepEqual(walks, [['country',170,380],['theatre',0,210]]);
  assert.equal(context.theatrePosition,210);
  context.returnToIsland();
  assert.deepEqual(walks.slice(2), [['theatre',210,0],['country',380,0],['south',150,0]]);
  assert.equal(context.theatrePosition,null);
});

test('country crossing walks to the landing, over both bridge halves and to the first checkpoint', () => {
  const { context, walks, views } = crossingContext();
  context.visitCountry();
  assert.deepEqual(walks, [['main',400,0],['south',0,150],['country',0,170]]);
  assert.deepEqual(views, [true]);
  assert.equal(context.crossing, false);
  context.returnToIsland();
  assert.deepEqual(walks.slice(3), [['country',170,0],['south',150,0]]);
  assert.deepEqual(views, [true,false]);
  assert.equal(context.position, 0);
  assert.equal(context.lastChapter, 9);
  assert.equal(context.branchPosition, null);
});

test('visiting from the house follows its branch before the bridge', () => {
  const { context, walks } = crossingContext(35);
  context.visitCountry();
  assert.deepEqual(walks.slice(0,2), [['house',35,0],['main',20,0]]);
});

test('duplicate crossing requests cannot start competing walks', () => {
  const { context, walks } = crossingContext();
  context.crossing = true;
  context.visitCountry();
  context.inCountry = true;
  context.returnToIsland();
  assert.equal(walks.length, 0);
});
