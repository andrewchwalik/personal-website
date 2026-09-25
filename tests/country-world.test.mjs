import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { buildCountryWorld, COUNTRY_ROUTE } from '../scripts/build-world.mjs';

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
  expected.forEach(([id,title,url], index) => {
    assert.equal(stories[id].number, index + 1);
    assert.equal(stories[id].title, title);
    assert.equal(stories[id].url, url);
    assert.ok(html.includes(`class="level completed country-control" data-country="${id}"`));
  });
  assert.ok(!html.includes('data-chapter="1"'), 'the masters checkpoint has moved off the current island');
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
  const context = {
    crossing: false, inCountry: false, frame: 0, journey: 0, headingHome: false,
    lockedReturn: null, position: 400, branchPosition: branch, houseJunction: 20,
    countryStops: { president: 170 }, countryPosition: 0, lastChapter: 3,
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
  assert.equal(context.lastChapter, 3);
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
