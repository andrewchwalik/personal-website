import test from 'node:test';
import assert from 'node:assert/strict';
import { branchTransfer } from '../mountain/branch-travel.mjs';
const make = length => ({ path: { getTotalLength: () => length }, sharedStem: 'lower-trail', sharedLength: 100 });
const vlog = make(220), book = make(115);

test('Daily Vlog and guestbook travel through their nearby junction in both directions', () => {
  for (const [source, destination] of [[vlog, book], [book, vlog]]) {
    const segments = branchTransfer(source, destination, source.path.getTotalLength());
    assert.equal(segments.length, 2);
    assert.equal(segments[0].to, 100);
    assert.equal(segments[1].from, 100);
    assert.equal(segments[1].to, destination.path.getTotalLength());
    assert.equal(segments[1].branch, destination);
  }
});

test('changing destinations on the common stem continues from the current position', () => {
  const segments = branchTransfer(vlog, book, 60);
  assert.equal(segments.length, 1);
  assert.equal(segments[0].from, 60);
  assert.equal(segments[0].to, 115);
});

test('same-branch clicks do not return to the main trail', () => {
  assert.deepEqual(branchTransfer(vlog, vlog, 180), [{ branch: vlog, from: 180, to: 220 }]);
});

test('unrelated branches and main-trail travel keep their existing routing', () => {
  assert.equal(branchTransfer(vlog, make(300), null), null);
  assert.equal(branchTransfer(vlog, { path: book.path }, 220), null);
  assert.equal(branchTransfer(vlog, undefined, 220), null);
  assert.equal(branchTransfer(null, book, 0), null);
});
