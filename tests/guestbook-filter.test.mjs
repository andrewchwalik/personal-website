import test from 'node:test';
import assert from 'node:assert/strict';
import { contentError } from '../guestbook-filter.mjs';
import { validateEntry } from '../backend/worker.mjs';

test('links are blocked, including bare domains, emails and common disguises', () => {
  for (const text of ['https://example.com', 'example.travel', 'www.example.org', 'me@example.net', 'example dot com', 'example[dot]com', 'example . com', '127.0.0.1', 'hxxps://example.net']) {
    assert.match(contentError(text), /links/, text);
  }
});
test('profanity and common evasions are blocked in names and notes', () => {
  for (const text of ['shit!', 'FUCK', 'f.u.c.k', 'sh!t', 'b1tch', 'f*ck', 'fuuuck', 'sh\u200bit', 'shít']) {
    assert.match(contentError(text), /profanity/, text);
    assert.match(validateEntry({ name: text, message: 'Hello there!', consent: true }), /profanity/);
    assert.match(validateEntry({ name: 'Guest', message: text, consent: true }), /profanity/);
  }
});
test('ordinary messages and words containing innocent substrings are allowed', () => {
  for (const text of ['Have a lovely trip! Pack snacks for the kids.', 'Scunthorpe', 'classic classroom', 'Dickinson', 'A compass is useful.', 'Hello. Wonderful adventures!']) assert.equal(contentError(text), null, text);
});
