import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../adventure.js', import.meta.url), 'utf8');
const progressSource = source.slice(source.indexOf('const levelProgress'), source.indexOf('const route ='));

test('current island continues the country milestones with levels seven through ten', () => {
  const chapters = runInNewContext(source.slice(0, source.indexOf('const levelProgress')) + '\nchapters;');
  assert.deepEqual(Object.keys(chapters), ['7', '8', '9', '10']);
  assert.equal(chapters[7].url, 'https://www.youtube.com/playlist?list=PLzLEqDD8AalbUWMfEDAjrz5yWz0Mb07Wj');
  assert.equal(chapters[7].state, 'COMPLETED');
  assert.equal(chapters[8].url, 'https://firelandsunited.com/');
  assert.equal(chapters[9].state, 'CURRENT QUEST');
  assert.equal(chapters[10].state, 'LOCKED PREVIEW');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const id of Object.keys(chapters)) assert.ok(html.includes(`data-chapter="${id}"`));
  assert.ok(source.includes('let position = stops[9]'));
});

test('level progress updates values, messages and completed or locked states', () => {
  const bar = { setAttribute(name, value) { this[name] = value; } };
  const label = {};
  const wrapper = { dataset: {} };
  const context = { document: {
    getElementById: id => id === 'level-progress' ? bar : label,
    querySelector: () => wrapper,
  } };
  runInNewContext(progressSource, context);
  for (const [level, value, max, message, state] of [
    [7, 1, 1, 'Business owners!', 'complete'],
    [8, 1, 1, "Men & women's teams compete in the summer!", 'complete'],
    [9, 212, 365, '212 / 365 vlogs edited', 'active'],
    [10, 0, 1, 'Locked', 'locked'],
  ]) {
    context.showProgress(level);
    assert.equal(bar.value, value);
    assert.equal(bar.max, max);
    assert.equal(bar['aria-valuetext'], message);
    assert.equal(label.textContent, message);
    assert.equal(wrapper.dataset.state, state);
  }
});
