import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('completed mountain stops hide progress while the vlog retains its days', () => {
  const source = read('../mountain/mountain.js');
  const render = source.slice(source.indexOf('function renderStop(stop)'), source.indexOf('function visit(stop)'));
  const result = runInNewContext(`
    const elements = {};
    const $ = id => elements[id] ??= {replaceChildren(){}, append(){}};
    const document = {querySelectorAll: () => []};
    const titleCase = text => text;
    ${render}
    renderStop({id:'vlog',title:'Vlog',state:'IN PROGRESS'});
    const vlog = {hidden:$('progress').hidden,max:$('bar').max,value:$('bar').value};
    renderStop({id:'masters',title:'Degree',state:'COMPLETED'});
    ({vlog,completedHidden:$('progress').hidden});
  `);
  assert.equal(result.vlog.hidden, false);
  assert.equal(result.vlog.max, 365);
  assert.equal(result.vlog.value, 212);
  assert.equal(result.completedHidden, true);
});

test('playground shares panel styling and animation without completed progress markup', () => {
  const html = read('../mountain/playground/index.html');
  assert.doesNotMatch(html, /<progress|id="progress"|THE WORLD BEFORE THE CLIMB/);
  assert.match(html, /detail-panel.css/);
  assert.match(html, /Past adventures preparing me for the climb/);
  assert.match(html, /<span>Andrew Chwalik<\/span>/);
  assert.match(read('../mountain/playground/playground.js'), /updatePanel\(stop.id/);
});
