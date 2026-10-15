import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read = path => readFileSync(new URL(path, import.meta.url),'utf8');

test('homepage publishes the mountain with working root-relative assets',()=>{
  const html=read('../index.html');
  assert.match(html,/<title>Andrew Chwalik<\/title>/);
  assert.match(html,/Interactive mountain map/);
  assert.doesNotMatch(html,/EXPERIMENTAL WORLD|Back to the islands|Explore the original worlds|adventure.js/);
  for(const [,path] of html.matchAll(/(?:src|href)="(\/[^"?#]+)(?:\?[^"#]*)?"/g)) {
    if(path.endsWith('/')) continue;
    assert.ok(existsSync(new URL('..'+path,import.meta.url)),path+' exists');
  }
});

test('old mountain links preserve arrival information and playground returns home',()=>{
  assert.match(read('../mountain/index.html'),/location.replace\('\/' \+ location.search \+ location.hash\)/);
  assert.match(read('../mountain/playground/playground.js'),/location.assign\('\/\?from=playground'\)/);
  assert.match(read('../mountain/mountain.js'),/location.assign\('\/mountain\/playground\/\?from=mountain'\)/);
  assert.doesNotMatch(read('../mountain/playground/index.html'),/href="\.\.\/\?from=playground"/);
});
