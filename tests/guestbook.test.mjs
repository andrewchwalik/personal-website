import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import worker, { makeChallenge, verifyChallenge, validateEntry, parseVideoFeed, readLimited } from '../backend/worker.mjs';

const schema = await readFile(new URL('../backend/migrations/0001_guestbook.sql', import.meta.url), 'utf8');
const secret = 'local-test-secret-not-a-production-credential';
const origin = 'https://andrewchwalik.com';
function setup() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(schema);
  const env = { SIGNING_SECRET: secret, ALLOWED_ORIGINS: origin, DB: { prepare(sql) {
    const query = values => ({
      async first() { return sqlite.prepare(sql).all(...values)[0] || null; },
      async all() { return { results: sqlite.prepare(sql).all(...values) }; },
      bind(...values) { return query(values); }
    });
    return query([]);
  } } };
  const get = path => worker.fetch(new Request(`https://api.test${path}`, { headers: { Origin: origin } }), env, {});
  const post = async (overrides = {}, ip = '203.0.113.1') => worker.fetch(new Request('https://api.test/guestbook', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
    body: JSON.stringify({ name: 'Visitor', message: 'Enjoying the adventure!', consent: true, website: '',
      token: await makeChallenge(secret, Date.now() - 5000), ...overrides })
  }), env, {});
  return { sqlite, env, get, post };
}

test('messages persist in the shared database and public reads exclude private fields', async () => {
  const { sqlite, post, get } = setup();
  try {
    const saved = await post();
    assert.equal(saved.status, 201);
    const publicRead = await (await get('/guestbook')).json();
    assert.equal(publicRead.entries.length, 1);
    assert.equal(publicRead.entries[0].message, 'Enjoying the adventure!');
    assert.deepEqual(Object.keys(publicRead.entries[0]).sort(), ['createdAt', 'id', 'message', 'name']);
    sqlite.exec('UPDATE guestbook SET hidden=1');
    assert.equal((await (await get('/guestbook')).json()).entries.length, 0);
  } finally { sqlite.close(); }
});

test('signed submissions cannot be forged, rushed, expired, or replayed into duplicate posts', async () => {
  const { sqlite, post } = setup();
  try {
    const token = await makeChallenge(secret, Date.now() - 5000);
    assert.ok(await verifyChallenge(token, secret));
    assert.equal(await verifyChallenge(token, 'wrong-secret'), null);
    assert.equal(await verifyChallenge(await makeChallenge(secret), secret), null);
    assert.equal(await verifyChallenge(await makeChallenge(secret, Date.now() - 31 * 60_000), secret), null);
    assert.equal((await post({ token })).status, 201);
    assert.equal((await post({ token })).status, 200);
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM guestbook').get().count, 1);
  } finally { sqlite.close(); }
});

test('rate limits are enforced atomically by the database', async () => {
  const { sqlite, post } = setup();
  try {
    assert.equal((await post()).status, 201);
    assert.equal((await post()).status, 429);
    for (let i = 0; i < 2; i++) {
      sqlite.prepare('UPDATE guestbook SET created_at=?').run(Date.now() - 120_000);
      assert.equal((await post()).status, 201);
    }
    sqlite.prepare('UPDATE guestbook SET created_at=?').run(Date.now() - 120_000);
    assert.equal((await post()).status, 429);
  } finally { sqlite.close(); }
});

test('public posting validates consent, size, links, HTML, and the honeypot', () => {
  const valid = { name: 'A visitor', message: 'Hello from Ohio!', consent: true, website: '' };
  assert.equal(validateEntry(valid), null);
  for (const patch of [{ message: '<script>alert(1)</script>' }, { message: 'Visit https://spam.test' },
    { message: 'a'.repeat(401) }, { name: '' }, { consent: false }, { website: 'bot' }]) {
    assert.equal(typeof validateEntry({ ...valid, ...patch }), 'string');
  }
});

test('foreign origins cannot submit and malformed cursors are rejected', async () => {
  const { sqlite, env, get } = setup();
  try {
    assert.equal((await worker.fetch(new Request('https://api.test/guestbook', { method: 'POST', headers: { Origin: 'https://unrelated.test' } }), env, {})).status, 403);
    assert.equal((await get('/guestbook?before=invalid')).status, 400);
  } finally { sqlite.close(); }
});

test('readers can page through every visible note without duplicates', async () => {
  const { sqlite, get } = setup();
  try {
    const insert = sqlite.prepare('INSERT INTO guestbook (id,name,message,created_at,visitor_hash,hidden) VALUES (?,?,?,?,?,?)');
    for (let i = 0; i < 46; i++) insert.run(crypto.randomUUID(), `Reader ${i}`, 'A local test note.', 1790000000000 + Math.floor(i / 2), 'test', i === 23 ? 1 : 0);
    const ids = [];
    let cursor = null;
    do {
      const page = await (await get('/guestbook' + (cursor ? `?before=${cursor}` : ''))).json();
      assert.ok(page.entries.length <= 20);
      ids.push(...page.entries.map(entry => entry.id));
      cursor = page.next;
    } while (cursor);
    assert.equal(ids.length, 45);
    assert.equal(new Set(ids).size, 45);
  } finally { sqlite.close(); }
});

test('the latest video is selected from the feed without copying an API key to the browser', () => {
  const video = parseVideoFeed('<feed><entry><yt:videoId>u2XbnrCHlwo</yt:videoId><title>A &amp; B</title><published>2026-09-21</published></entry><entry><yt:videoId>O0UNSAZaUZw</yt:videoId><title>Older</title></entry></feed>');
  assert.equal(video.id, 'u2XbnrCHlwo');
  assert.equal(video.title, 'A & B');
  assert.throws(() => parseVideoFeed('<feed/>'));
});

test('untrusted request and feed bodies have hard byte limits', async () => {
  await assert.rejects(readLimited(new Response('a'.repeat(4097)), 4096));
  assert.equal(await readLimited(new Response('hello'), 4096), 'hello');
});
