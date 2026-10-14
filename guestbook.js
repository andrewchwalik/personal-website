import { contentError } from './guestbook-filter.mjs';
const HOME_API = 'https://andrew-home-base.chwalik.workers.dev';
async function api(path, options = {}) {
  const response = await fetch(HOME_API + path, { ...options, signal: AbortSignal.timeout(12_000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unable to connect. Please try again.');
  return data;
}


export function initGuestbook() {
  if (!document.getElementById('guestbook-dialog')) {
    const template = document.createElement('template');
    template.innerHTML = "<dialog id=\"guestbook-dialog\" class=\"house-panel guestbook-panel\" aria-labelledby=\"guestbook-title\">\n    <button type=\"button\" class=\"panel-close\" data-close aria-label=\"Close guestbook\">×</button>\n    <div class=\"book-spread\">\n    <div class=\"book-frontispiece\"><h2 id=\"guestbook-title\">The Guestbook</h2><div id=\"book-instructions\"><p>Leave a note, travel tips, parenting advice, or just a positive message.</p><button type=\"button\" id=\"write-entry\" class=\"book-write\">Sign the Guestbook</button></div></div>\n    <div class=\"book-paper\">\n    <section id=\"book-reader\" aria-label=\"Guestbook entries\">\n      <div class=\"book-running-head\"><span>MESSAGES</span><button type=\"button\" id=\"refresh-entries\" aria-label=\"Refresh guestbook\">↻</button></div>\n      <div id=\"entries-scroll\" tabindex=\"0\" role=\"region\" aria-label=\"Guestbook messages, scroll to read more\">\n      <p id=\"entries-status\" role=\"status\">Opening the guestbook…</p>\n      <ol id=\"entries-list\"></ol>\n      <button type=\"button\" id=\"more-entries\" hidden>Load more messages</button>\n      </div>\n    </section>\n    <section id=\"book-writing\" hidden aria-label=\"Sign the guestbook\">\n    <button type=\"button\" id=\"read-entries\" class=\"book-back\">← Back</button>\n    <form id=\"guestbook-form\">\n      <label for=\"guest-name\">Your display name</label><input id=\"guest-name\" name=\"name\" maxlength=\"40\" autocomplete=\"nickname\" placeholder=\"What should we call you?\" required>\n      <label for=\"guest-message\">Your message <span id=\"message-count\">0 / 400</span></label><textarea id=\"guest-message\" name=\"message\" minlength=\"3\" maxlength=\"400\" rows=\"3\" placeholder=\"Leave something kind…\" required></textarea>\n      <div class=\"guestbook-trap\" aria-hidden=\"true\"><label>Website<input name=\"website\" tabindex=\"-1\" autocomplete=\"off\"></label></div>\n      <label class=\"public-consent\"><input name=\"consent\" type=\"checkbox\" required><span>I understand my display name and message will be public.</span></label>\n      <button type=\"submit\" class=\"book-submit\" disabled>Sign the guestbook <span aria-hidden=\"true\">↗</span></button>\n      <p id=\"guestbook-feedback\" class=\"book-feedback\" role=\"status\" aria-live=\"polite\"></p>\n    </form>\n    </section>\n    </div>\n    </div>\n  </dialog>";
    document.body.append(template.content.cloneNode(true));
  }
  const book = document.getElementById('guestbook-dialog');
  book.querySelector('[data-close]').addEventListener('click', () => book.close());
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
  if (book.open) return;
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

  return openGuestbook;
}
