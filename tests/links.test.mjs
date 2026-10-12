import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('links page features the main website instead of Patreon',()=>{
  const html=readFileSync(new URL('../links/index.html',import.meta.url),'utf8');
  assert.match(html,/href="https:\/\/andrewchwalik.com\/"/);
  assert.match(html,/Explore My World/);
  assert.doesNotMatch(html,/patreon/i);
  assert.match(html,/Latest Vlog/);
  assert.match(html,/Firelands United/);
  assert.match(html,/href="https:\/\/www.instagram.com\/andrewchwalik\/"/);
  assert.doesNotMatch(html,/Nutmegged/i);
});
