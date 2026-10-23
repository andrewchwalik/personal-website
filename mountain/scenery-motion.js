const ns = 'http://www.w3.org/2000/svg';
const stage = document.querySelector('.stage');
const svg = document.createElementNS(ns, 'svg');
svg.setAttribute('class', 'scenery-motion');
svg.setAttribute('viewBox', '0 0 1024 1536');
svg.setAttribute('preserveAspectRatio', 'none');
svg.setAttribute('aria-hidden', 'true');

if (document.body.classList.contains('playground')) {
  // Trace each current independently in the artwork's 1024 x 1536 coordinates.
  // Gaps avoid exposed rocks; the middle bend turns right before returning left.
  const channels = [
    ['M1024 929 C1013 940 987 949 978 967',
     'M1024 938 C1009 947 990 957 985 974'],
    ['M969 979 C958 994 963 1015 980 1029 C993 1040 1004 1052 1005 1067',
     'M977 982 C968 998 974 1016 988 1028 C1003 1042 1011 1055 1011 1068'],
    ['M1004 1080 C1004 1100 984 1119 976 1135',
     'M1011 1083 C1009 1104 991 1124 984 1139'],
    ['M968 1148 C956 1169 958 1191 972 1211',
     'M976 1152 C965 1175 968 1194 980 1210'],
    ['M979 1225 C988 1241 1011 1248 1024 1263',
     'M987 1223 C999 1238 1016 1242 1024 1252'],
  ];
  channels.forEach((currents, index) => {
    currents.forEach((d, layer) => {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      path.setAttribute('class', layer ? 'stream-current fine' : 'stream-current');
      path.style.animationDelay = `${-index * .57 - layer * 1.3}s`;
      svg.append(path);
    });
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
