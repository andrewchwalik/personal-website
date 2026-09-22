import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../adventure.js', import.meta.url), 'utf8');
const progressSource = source.slice(source.indexOf('const levelProgress'), source.indexOf('const route ='));

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
    [1, 1, 1, 'Degree Secured!', 'complete'],
    [2, 1, 1, "Men & women's teams compete in the summer!", 'complete'],
    [3, 212, 365, '212 / 365 vlogs edited', 'active'],
    [4, 0, 1, 'Locked', 'locked'],
  ]) {
    context.showProgress(level);
    assert.equal(bar.value, value);
    assert.equal(bar.max, max);
    assert.equal(bar['aria-valuetext'], message);
    assert.equal(label.textContent, message);
    assert.equal(wrapper.dataset.state, state);
  }
});
