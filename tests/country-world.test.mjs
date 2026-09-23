import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { buildCountryWorld, COUNTRY_ROUTE } from '../scripts/build-world.mjs';

const source = readFileSync(new URL('../adventure.js', import.meta.url), 'utf8');
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
  const context = {
    crossing: false, inCountry: false, frame: 0, journey: 0, headingHome: false,
    lockedReturn: null, position: 400, branchPosition: branch, houseJunction: 20,
    stops: { 1: 0 }, countryStops: { roots: 230 }, countryPosition: 0,
    route: { name: 'main' }, houseRoute: { name: 'house' },
    southRoute: { name: 'south', getTotalLength: () => 150 }, countryRoute: { name: 'country' },
    cancelAnimationFrame() {}, clearLockFeedback() {}, showCountryStory() {}, showChapter() {}, place() {},
    document: { querySelector: () => ({}) },
    setCrossing(value) { context.crossing = value; },
    setCountryView(value) { context.inCountry = value; views.push(value); },
    walk(path, start, end, ticket, arrived) {
      walks.push([path.name, start, end]);
      if (path.name === 'country') context.countryPosition = end;
      arrived();
    },
  };
  runInNewContext(source.slice(source.indexOf('function visitCountry()'), source.indexOf("document.getElementById('visit-country').addEventListener")), context);
  return { context, walks, views };
}

test('country crossing walks to level one, over both bridge halves and to the checkpoint', () => {
  const { context, walks, views } = crossingContext();
  context.visitCountry();
  assert.deepEqual(walks, [['main',400,0],['south',0,150],['country',0,230]]);
  assert.deepEqual(views, [true]);
  assert.equal(context.crossing, false);
  context.returnToIsland();
  assert.deepEqual(walks.slice(3), [['country',230,0],['south',150,0]]);
  assert.deepEqual(views, [true,false]);
  assert.equal(context.position, 0);
  assert.equal(context.lastChapter, 1);
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
