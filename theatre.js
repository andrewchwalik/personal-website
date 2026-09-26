import { theatreVideos } from './theatre-videos.mjs?v=2';

const dialog = document.getElementById('theatre-dialog');
const screen = document.getElementById('theatre-screen');
const films = document.getElementById('theatre-films');
const status = document.getElementById('theatre-status');
const youtube = document.getElementById('theatre-youtube');
const welcome = screen.firstElementChild.cloneNode(true);
let savedScroll = 0;

function playFilm(video) {
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`;
  iframe.title = video.title;
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  screen.replaceChildren(iframe);
  youtube.href = `https://www.youtube.com/watch?v=${video.id}`;
  youtube.hidden = false;
  status.textContent = `Selected: ${video.title}. If playback is unavailable, watch on YouTube below.`;
  films.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.video === video.id)));
  screen.scrollIntoView({ block: 'nearest', behavior: 'instant' });
}

theatreVideos.forEach((video, index) => {
  if (!/^[\w-]{11}$/.test(video.id)) return;
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'film-ticket'; button.dataset.video = video.id;
  button.setAttribute('aria-pressed', 'false');
  const number = document.createElement('span'); number.textContent = String(index + 1).padStart(2, '0');
  button.append(number, document.createTextNode(video.title));
  button.addEventListener('click', () => playFilm(video));
  films.append(button);
});

document.addEventListener('enter-theatre', () => {
  if (dialog.open) return;
  savedScroll = scrollY;
  dialog.showModal();
  dialog.scrollTop = 0;
});
document.getElementById('close-theatre').addEventListener('click', () => dialog.close());
document.getElementById('theatre-door').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  // Removing the iframe stops playback, including when the visitor presses Escape.
  screen.replaceChildren(welcome.cloneNode(true));
  youtube.hidden = true;
  status.textContent = 'Choose a video to watch on the big screen.';
  films.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', 'false'));
  scrollTo({ top: savedScroll, behavior: 'instant' });
  document.getElementById('theatre-stop').focus({ preventScroll: true });
});
