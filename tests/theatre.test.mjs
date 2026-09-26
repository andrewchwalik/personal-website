import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { theatreVideos } from '../theatre-videos.mjs';

test('theatre contains the seven selected films in requested order', () => {
  assert.deepEqual(theatreVideos.map(video => video.id), [
    'MpxoSS3UO6w', '2Q6Vg-vA92w', 'FVb1Xv_TsLU', '3wUPADWSrI8',
    '3WN5MRzv4AA', '5HkvZZ1wV0w', '1QhbDCUMUpE',
  ]);
});

test('theatre selection replaces the player and closing stops playback', () => {
  class Element {
    constructor(tag = 'div') { this.tag = tag; this.children = []; this.dataset = {}; this.events = {}; this.hidden = false; }
    append(...items) { this.children.push(...items); }
    replaceChildren(...items) { this.children = items; }
    cloneNode() { return new Element(this.tag); }
    setAttribute(key, value) { this[key] = value; }
    addEventListener(event, callback) { this.events[event] = callback; }
    querySelectorAll() { return this.children; }
    scrollIntoView() {}
    focus() {}
    showModal() { this.open = true; }
    close() { this.open = false; this.events.close(); }
  }
  const elements = Object.fromEntries(['theatre-dialog','theatre-screen','theatre-films','theatre-status','theatre-youtube','close-theatre','theatre-door','theatre-stop'].map(id => [id,new Element()]));
  elements['theatre-screen'].firstElementChild = new Element('p');
  const documentEvents = {};
  const context = {
    theatreVideos, scrollY: 100, scrollTo() {},
    document: {
      getElementById: id => elements[id], createElement: tag => new Element(tag), createTextNode: text => text,
      addEventListener: (name, callback) => { documentEvents[name] = callback; },
    },
  };
  const source = readFileSync(new URL('../theatre.js',import.meta.url),'utf8');
  runInNewContext(source.replace(/^import[^\n]+\n/,''), context);
  documentEvents['enter-theatre']();
  assert.equal(elements['theatre-dialog'].open,true);
  const buttons = elements['theatre-films'].children;
  assert.equal(buttons.length, theatreVideos.length);
  buttons[0].events.click();
  assert.match(elements['theatre-screen'].children[0].src, /youtube-nocookie.com\/embed\/MpxoSS3UO6w/);
  buttons[1].events.click();
  assert.equal(elements['theatre-screen'].children.length,1);
  assert.match(elements['theatre-screen'].children[0].src, /2Q6Vg-vA92w/);
  assert.equal(buttons[0]['aria-pressed'],'false');
  assert.equal(buttons[1]['aria-pressed'],'true');
  buttons.forEach((button, index) => {
    button.events.click();
    assert.equal(elements['theatre-screen'].children.length, 1);
    assert.equal(elements['theatre-screen'].children[0].src,
      `https://www.youtube-nocookie.com/embed/${theatreVideos[index].id}?autoplay=1&rel=0`);
    assert.equal(elements['theatre-youtube'].href, `https://www.youtube.com/watch?v=${theatreVideos[index].id}`);
  });
  elements['theatre-door'].events.click();
  assert.equal(elements['theatre-dialog'].open,false);
  assert.equal(elements['theatre-screen'].children[0].tag,'p');
  assert.equal(elements['theatre-youtube'].hidden,true);
});
