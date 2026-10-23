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
  const style = getComputedStyle(panel);
  const start = { opacity: style.opacity, transform: style.transform };
  animation?.cancel();
  if (!current || current === id || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    current = id;
    render();
    return;
  }
  current = id;
  const mobile = matchMedia('(max-width: 760px)').matches;
  const hidden = { opacity: 0, transform: mobile ? 'translateY(-14px)' : 'translateX(-28px)' };
  const visible = { opacity: 1, transform: 'translate(0, 0)' };
  animation = panel.animate([start, hidden], { duration: 220, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'both' });
  animation.finished.then(() => {
    if (ticket !== revision) return;
    render();
    animation.cancel();
    animation = panel.animate([hidden, visible], { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
    const entering = animation;
    entering.finished.then(() => {
      if (ticket === revision) { entering.cancel(); animation = undefined; }
    }).catch(() => {});
  }).catch(() => {}); // A new selection cancels an unfinished transition.
}
