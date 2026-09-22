import { contentError } from './guestbook-filter.mjs';
const HOME_API = 'https://andrew-home-base.chwalik.workers.dev';
const home = document.getElementById('home-screen');
const tv = document.getElementById('tv-dialog');
const book = document.getElementById('guestbook-dialog');
let ownHouseHistory = false;
let homeScroll = 0;
const roomCharacter = document.getElementById('room-character');
const roomSprite = document.querySelector('.map-stage .player svg').cloneNode(true);
roomSprite.querySelector('#jacket').id = 'room-jacket';
roomSprite.querySelector('[fill="url(#jacket)"]').setAttribute('fill', 'url(#room-jacket)');
roomCharacter.append(roomSprite);
const doorway = [110, 415], restingSpot = [160, 452];
let roomPoint = [...doorway], roomFrame, roomJourney = 0, exiting = false;
function placeRoomCharacter(point, opacity = 1) {
  roomPoint = point;
  roomCharacter.style.left = `${point[0] / 6}%`;
  roomCharacter.style.top = `${point[1] / 6}%`;
  roomCharacter.style.opacity = opacity;
}
function walkRoom(destination, leaving, arrived = () => {}) {
  cancelAnimationFrame(roomFrame);
  const ticket = ++roomJourney, start = [...roomPoint];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reduced ? 0 : Math.max(300, Math.hypot(destination[0] - start[0], destination[1] - start[1]) * 29);
  roomCharacter.classList.toggle('walking', !reduced);
  roomSprite.style.transform = leaving ? 'scaleX(-1)' : '';
  const began = performance.now();
  function step(now) {
    if (ticket !== roomJourney) return;
    const progress = duration ? Math.min(1, (now - began) / duration) : 1;
    const eased = progress * progress * (3 - 2 * progress);
    const point = start.map((value, index) => value + (destination[index] - value) * eased);
    const distanceFromDoor = Math.hypot(point[0] - doorway[0], point[1] - doorway[1]);
    placeRoomCharacter(point, Math.min(1, distanceFromDoor / 12));
    if (progress < 1) roomFrame = requestAnimationFrame(step);
    else { roomCharacter.classList.remove('walking'); arrived(); }
  }
  roomFrame = requestAnimationFrame(step);
}

function enterHouse(fromHistory = false) {
  if (home.open) {
    if (exiting) { exiting = false; walkRoom(restingSpot, false); }
    return;
  }
  exiting = false;
  homeScroll = scrollY;
  if (!fromHistory) {
    history.pushState({ ...history.state, homeBase: true }, '', '#house');
    ownHouseHistory = true;
  }
  home.showModal();
  placeRoomCharacter([...doorway], 0);
  document.getElementById('room-travel-status').textContent = 'Andrew is walking in.';
  walkRoom(restingSpot, false, () => {
    document.getElementById('room-travel-status').textContent = 'Make yourself at home. Use the door to head outside.';
  });
  document.getElementById('home-title').focus({ preventScroll: true });
}
function leaveHouse() {
  if (exiting || !home.open) return;
  exiting = true;
  if (tv.open) tv.close();
  if (book.open) book.close();
  document.getElementById('room-travel-status').textContent = 'Heading back outside...';
  walkRoom(doorway, true, finishLeavingHouse);
}
function finishLeavingHouse() {
  if (home.open) home.close();
  document.dispatchEvent(new Event('leave-house'));
  scrollTo({ top: homeScroll, behavior: 'instant' });
  document.getElementById('house-stop').focus({ preventScroll: true });
  if (location.hash === '#house') {
    if (ownHouseHistory) history.back();
    else history.replaceState(history.state, '', location.pathname + location.search);
  }
  ownHouseHistory = false;
  exiting = false;
}
document.addEventListener('enter-house', () => enterHouse());
document.getElementById('leave-house').addEventListener('click', leaveHouse);
document.getElementById('exit-door').addEventListener('click', leaveHouse);
home.addEventListener('cancel', event => { event.preventDefault(); leaveHouse(); });
window.addEventListener('popstate', () => {
  if (location.hash === '#house') enterHouse(true);
  else if (home.open) leaveHouse();
});
if (location.hash === '#house') enterHouse(true);
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));

async function api(path, options = {}) {
  const response = await fetch(HOME_API + path, { ...options, signal: AbortSignal.timeout(12_000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unable to connect. Please try again.');
  return data;
}

let videoRequest = 0;
async function openTV() {
  if (exiting) return;
  tv.showModal();
  const request = ++videoRequest;
  const screen = document.getElementById('video-screen');
  const status = document.getElementById('video-status');
  const title = document.getElementById('tv-title');
  const link = document.getElementById('video-link');
  screen.textContent = 'Finding the latest vlog...';
  status.textContent = '';
  title.textContent = 'The latest adventure.';
  link.href = 'https://www.youtube.com/@AndrewChwalik';
  try {
    const { video } = await api('/vlog');
    if (!tv.open || request !== videoRequest) return;
    if (!/^[\w-]{11}$/.test(video.id)) throw new Error('Please open YouTube to watch the latest vlog.');
    title.textContent = video.title;
    link.href = `https://www.youtube.com/watch?v=${video.id}`;
    const play = document.createElement('button');
    play.type = 'button'; play.className = 'video-poster';
    play.setAttribute('aria-label', `Play ${video.title}`);
    const image = document.createElement('img');
    image.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`; image.alt = '';
    const caption = document.createElement('span'); caption.textContent = 'Play the latest vlog';
    play.append(image, caption); screen.replaceChildren(play);
    status.textContent = 'Fresh from YouTube. Tap play to watch here.';
    play.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`;
      iframe.title = video.title;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      screen.replaceChildren(iframe);
      status.textContent = 'If the video cannot play here, use the YouTube link below.';
    });
  } catch {
    if (!tv.open || request !== videoRequest) return;
    screen.textContent = 'The TV couldn’t connect to YouTube.';
    status.textContent = 'You can still watch the latest uploads on the channel below.';
  }
}
tv.addEventListener('close', () => { videoRequest++; document.getElementById('video-screen').replaceChildren(); });

const form = document.getElementById('guestbook-form');
const submit = form.querySelector('[type="submit"]');
const feedback = document.getElementById('guestbook-feedback');
const list = document.getElementById('entries-list');
const entriesStatus = document.getElementById('entries-status');
const more = document.getElementById('more-entries');
const scrollArea = document.getElementById('entries-scroll');
const instructions = document.getElementById('book-instructions');
const writing = document.getElementById('book-writing');
let entries = [], loading = false;
document.querySelector('.book-frontispiece').append(writing);
let token = null, nextPage = null, entriesRequest = 0, tokenRequest = 0, sending = false;
function say(text, isError = false) { feedback.textContent = text; feedback.dataset.error = String(isError); }
function entryElement(entry) {
  const item = document.createElement('li'); item.dataset.entryId = entry.id;
  const meta = document.createElement('div'); meta.className = 'entry-meta';
  const name = document.createElement('strong'); name.textContent = entry.name;
  const time = document.createElement('time');
  const date = new Date(entry.createdAt);
  time.dateTime = date.toISOString(); time.textContent = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const message = document.createElement('p'); message.className = 'entry-message'; message.textContent = entry.message;
  meta.append(name, time); item.append(meta, message);
  return item;
}
function renderEntries() {
  list.replaceChildren(...entries.map(entryElement));
  more.hidden = !nextPage;
  more.disabled = loading;
}
function showReader() {
  instructions.hidden = false; writing.hidden = true;
  book.scrollTop = 0;
}
async function loadEntries(append = false) {
  if (append && (loading || !nextPage)) return;
  const request = ++entriesRequest;
  entriesStatus.textContent = 'Opening the guestbook...';
  loading = true; more.disabled = true;
  try {
    const page = await api('/guestbook' + (append && nextPage ? `?before=${encodeURIComponent(nextPage)}` : ''));
    if (request !== entriesRequest) return;
    if (!append) { entries = []; scrollArea.scrollTop = 0; }
    const existing = new Set(entries.map(entry => entry.id));
    for (const entry of page.entries) if (!existing.has(entry.id)) { entries.push(entry); existing.add(entry.id); }
    nextPage = page.next;
    entriesStatus.textContent = entries.length ? '' : 'No messages yet. Leave the first note!';
  } catch {
    if (request === entriesRequest) entriesStatus.textContent = 'The pages couldn’t load. Tap the refresh arrow to try again.';
  } finally {
    if (request === entriesRequest) { loading = false; renderEntries(); }
  }
}
async function refreshToken() {
  const request = ++tokenRequest;
  token = null; submit.disabled = true;
  try {
    const challenge = await api('/guestbook/challenge');
    await new Promise(resolve => setTimeout(resolve, 2100));
    if (request !== tokenRequest) return;
    token = challenge.token; validateDraft();
  }
  catch { say('Unable to connect to the guestbook. Reopen it to try again; your draft will stay here.', true); }
}
function openGuestbook() {
  if (exiting) return;
  book.showModal();
  showReader();
  loadEntries();
}
function validateDraft() {
  const invalid = contentError(form.elements.name.value) || contentError(form.elements.message.value);
  submit.disabled = sending || !token || Boolean(invalid);
  if (!sending) say(invalid || '', Boolean(invalid));
  return invalid;
}
form.addEventListener('input', () => {
  document.getElementById('message-count').textContent = `${form.elements.message.value.length} / 400`;
  validateDraft();
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (sending || !token || validateDraft() || !form.reportValidity()) return;
  sending = true; submit.disabled = true; say('Adding your note...');
  const content = { name: form.elements.name.value, message: form.elements.message.value, website: form.elements.website.value, consent: form.elements.consent.checked, token };
  try {
    const { entry } = await api('/guestbook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(content) });
    entriesRequest++;
    loading = false;
    entries = [entry, ...entries.filter(item => item.id !== entry.id)];
    entriesStatus.textContent = '';
    form.reset(); document.getElementById('message-count').textContent = '0 / 400';
    say('You’re in the book! Your message is now visible to everyone.');
    showReader(); renderEntries(); scrollArea.scrollTop = 0;
    document.getElementById('write-entry').focus({ preventScroll: true });
    entriesStatus.textContent = 'Your note is now part of the story.';
    await refreshToken();
  } catch (failure) {
    say(failure.message || 'Your note couldn’t be sent. Your draft is still here.', true);
    // Keep the same signed submission after network errors so retries cannot duplicate it.
    if (/refresh the guestbook/i.test(failure.message)) await refreshToken();
  } finally { sending = false; submit.disabled = !token || Boolean(contentError(form.elements.name.value) || contentError(form.elements.message.value)); }
});
document.getElementById('refresh-entries').addEventListener('click', () => loadEntries());
more.addEventListener('click', () => loadEntries(true));
scrollArea.addEventListener('scroll', () => {
  if (scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight < 100) loadEntries(true);
});
document.getElementById('write-entry').addEventListener('click', () => {
  instructions.hidden = true; writing.hidden = false;
  if (!sending) { say(''); refreshToken(); }
  document.getElementById('read-entries').focus({ preventScroll: true });
});
document.getElementById('read-entries').addEventListener('click', () => {
  showReader(); document.getElementById('write-entry').focus({ preventScroll: true });
});
document.getElementById('open-tv').addEventListener('click', openTV);
document.getElementById('open-guestbook').addEventListener('click', openGuestbook);
