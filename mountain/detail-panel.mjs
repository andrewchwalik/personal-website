const panel = document.querySelector('.details');
const map = document.querySelector('.map');
const intro = document.querySelector('.intro');
let current, animation, revision = 0;

function connectPanel() {
  const gap = Math.max(0, intro.getBoundingClientRect().left - map.getBoundingClientRect().right);
  panel.style.setProperty('--panel-bridge', `${gap}px`);
}
new ResizeObserver(connectPanel).observe(map);
window.addEventListener('resize', connectPanel);
connectPanel();

export function updatePanel(id, render) {
  const ticket = ++revision;
  animation?.cancel();
  if (!current || current === id || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    current = id;
    render();
    return;
  }
  current = id;
  const mobile = matchMedia('(max-width: 760px)').matches;
  const hidden = { opacity: 0, transform: mobile ? 'translateY(-24px)' : 'translateX(-48px)' };
  const visible = { opacity: 1, transform: 'translate(0, 0)' };
  animation = panel.animate([visible, hidden], { duration: 150, easing: 'ease-in', fill: 'forwards' });
  animation.finished.then(() => {
    if (ticket !== revision) return;
    render();
    animation.cancel();
    animation = panel.animate([hidden, visible], { duration: 300, easing: 'cubic-bezier(.2,.7,.2,1)' });
  }).catch(() => {}); // A new selection cancels an unfinished transition.
}
