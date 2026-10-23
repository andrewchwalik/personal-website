const stage = document.querySelector('.stage');
const main = document.querySelector('main');
const intro = document.querySelector('.intro');

window.addEventListener('pointerdown', () => {
  document.documentElement.dataset.input = 'pointer';
}, true);
window.addEventListener('keydown', event => {
  if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    document.documentElement.dataset.input = 'keyboard';
  }
}, true);

function fitMap() {
  // Document coordinates stay stable while a visitor scrolls to the details.
  const top = stage.getBoundingClientRect().top + window.scrollY;
  const viewport = document.documentElement.clientHeight;
  // Reserve the actual page padding plus the map's border and shadow.
  // A fixed 20px allowance overflowed on desktops with larger outer padding.
  const bottomSpace = Math.max(20, parseFloat(getComputedStyle(main).paddingBottom) + 14);
  const available = viewport - top - bottomSpace;
  // Keep touch targets usable on very short/landscape displays; allow scrolling.
  const height = Math.max(360, window.innerWidth > 760
    ? available
    : Math.min(available, stage.clientWidth * 1.55));
  main.style.setProperty('--map-height', `${Math.round(height)}px`);
}

fitMap();
window.addEventListener('resize', fitMap);
new ResizeObserver(fitMap).observe(intro);
document.fonts.ready.then(fitMap);
