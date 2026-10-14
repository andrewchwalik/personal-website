import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('links page features the main website instead of Patreon',()=>{
  const html=readFileSync(new URL('../links/index.html',import.meta.url),'utf8');
  assert.match(html,/href="https:\/\/andrewchwalik.com\/"/);
  assert.match(html,/Buying a Professional Soccer Club/);
  assert.match(html,/My map to buying a soccer club in Europe\./);
  assert.match(html,/fa-futbol/);
  assert.match(html,/class="links-handdrawn-arrow"/);
  assert.doesNotMatch(html,/patreon/i);
  assert.match(html,/Watch on YouTube/);
  assert.match(html,/Connect on Instagram/);
  assert.match(html,/Firelands United/);
  assert.match(html,/href="https:\/\/www.instagram.com\/andrewchwalik\/"/);
  assert.doesNotMatch(html,/Nutmegged/i);
  assert.match(html,/href="https:\/\/ko-fi.com\/andrewchwalik"/);
  assert.match(html,/Support the Adventure/);
  assert.ok(html.includes('href="https://cash.app/$AndrewChwalik"'));
  assert.match(html,/Cash App/);
  assert.equal((html.match(/class="links-item(?: links-item-world)?"/g)||[]).length,6);
  assert.match(html,/href="links.css\?v=5"/);
  assert.match(html,/src="\.\.\/mountain\/world-cave.webp"/);
  const intro = html.match(/<p class="links-description">([\s\S]*?)<\/p>/)[1];
  assert.equal(intro.replace(/<[^>]*>/g, '').trim(), 'On a life quest to buy a European soccer club. Join the climb. Check out the latest progress.');
  assert.match(intro, /class="links-progress-cue">progress\.<svg class="links-handdrawn-arrow"/);
  const descriptions = [...html.matchAll(/class="links-meta">([^<]+)</g)].map(match => match[1]);
  assert.equal(descriptions.length, 6);
  assert.ok(descriptions.every(description => description.endsWith('.')));
  const destinations = [...html.matchAll(/class="links-item(?: links-item-world)?" href="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(destinations, [
    'https://andrewchwalik.com/',
    'https://www.youtube.com/watch?v=xrza5E3FDzI&amp;list=PLzLEqDD8AalbilRUTFy1a4Z22oysBob35',
    'https://www.instagram.com/andrewchwalik/',
    'https://ko-fi.com/andrewchwalik',
    'https://cash.app/$AndrewChwalik',
    'https://firelandsunited.com/'
  ]);
});
