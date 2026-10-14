import test from 'node:test';
import assert from 'node:assert/strict';
import { welcomeEntry, readerEntries } from '../guestbook-welcome.mjs';
import { stops } from '../mountain/data.mjs';
import { bridgeRoute, bridgeJunction } from '../mountain/playground/data.mjs';

test('welcome pin uses the confirmed entry ID, not the public display name', () => {
  const other = { id:'other', name:welcomeEntry.name, message:'Another visitor' };
  assert.deepEqual(readerEntries([welcomeEntry,other]),[other]);
  assert.deepEqual(readerEntries([]),[]);
  assert.ok(welcomeEntry.message.startsWith('Thanks for visiting my site'));
});

test('completed head coaching stop sits between Delaware and Firelands', () => {
  const index=stops.findIndex(stop=>stop.id==='headcoach');
  assert.equal(stops[index-1].id,'delaware');
  assert.equal(stops[index+1].id,'firelands');
  assert.equal(stops[index].state,'COMPLETED');
  assert.equal(stops.find(stop=>stop.id==='coaching').state,'IN PROGRESS');
});

test('playground bridge climbs to the right edge from its existing landing', () => {
  assert.ok(bridgeRoute.startsWith('M'+bridgeJunction.join(' ')));
  assert.ok(bridgeRoute.endsWith('600 460'));
  assert.ok(460<bridgeJunction[1]);
});
