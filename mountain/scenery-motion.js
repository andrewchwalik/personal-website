const ns = 'http://www.w3.org/2000/svg';
const stage = document.querySelector('.stage');
const svg = document.createElementNS(ns, 'svg');
svg.setAttribute('class', 'scenery-motion');
svg.setAttribute('viewBox', '0 0 1024 1536');
svg.setAttribute('preserveAspectRatio', 'none');
svg.setAttribute('aria-hidden', 'true');

if (document.body.classList.contains('playground')) {
  // Separate channels keep highlights off the painted stepping stones and banks.
  const channels = [
    'M1009 910 Q986 936 981 966',
    'M967 982 Q948 1004 946 1030',
    'M940 1065 Q929 1090 930 1118',
    'M929 1148 Q935 1170 951 1190',
    'M965 1221 Q980 1244 996 1261 L1020 1276',
  ];
  channels.forEach((d, index) => {
    for (let layer = 0; layer < 2; layer++) {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      path.setAttribute('class', layer ? 'stream-current fine' : 'stream-current');
      path.style.animationDelay = `${-index * .57 - layer * 1.3}s`;
      if (layer) path.setAttribute('transform', 'translate(5 0)');
      svg.append(path);
    }
  });
} else {
  // Sample adjacent empty sky over the painted cloth only, preserving the pole.
  svg.innerHTML = `<defs>
    <clipPath id="flag-sky-patch"><rect x="534" y="38" width="28" height="18"/></clipPath>
    <linearGradient id="waving-flag-light" x2="1" y2=".4"><stop stop-color="#ec9367"/><stop offset=".35" stop-color="#c8583d"/><stop offset=".65" stop-color="#e07854"/><stop offset="1" stop-color="#963f35"/></linearGradient>
  </defs>
  <image href="/mountain/world-connected.webp" x="-32" y="0" width="1024" height="1536" clip-path="url(#flag-sky-patch)"/>
  <path fill="url(#waving-flag-light)" stroke="#9b533f" stroke-width=".5" d="M534 40 C541 37 548 44 558 41 L552 47 L558 53 C549 55 542 50 534 54 Z">
    <animate attributeName="d" dur="2.8s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.33;.66;1" keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1" values="M534 40 C541 37 548 44 558 41 L552 47 L558 53 C549 55 542 50 534 54 Z;M534 40 C541 43 548 37 555 39 L550 46 L556 51 C548 49 542 57 534 54 Z;M534 40 C540 38 546 42 560 44 L553 49 L559 56 C548 57 541 51 534 54 Z;M534 40 C541 37 548 44 558 41 L552 47 L558 53 C549 55 542 50 534 54 Z"/>
  </path>`;
}
stage.append(svg);

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let visible = true;
function pause() {
  const paused = reduced.matches || !visible || document.hidden || Boolean(document.querySelector('dialog[open]'));
  svg.classList.toggle('paused', paused);
  if (paused) svg.pauseAnimations(); else svg.unpauseAnimations();
}
new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; pause(); }).observe(stage);
document.addEventListener('visibilitychange', pause);
reduced.addEventListener('change', pause);
new MutationObserver(pause).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
pause();
