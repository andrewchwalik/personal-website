const chapters = {
  1: { state: 'COMPLETED', title: "A master's degree. An Irish adventure.", description: "I moved to Ireland to get my master's degree and documented life along the way. This chapter is complete, but you can revisit the adventure through the vlogs.", objective: "Earn my master's degree.", url: 'https://www.youtube.com/playlist?list=PLzLEqDD8Aalbud4qkLVkzkFjuXDJrZ1Ee', action: 'Watch the Ireland vlogs', point: [165, 550] },
  2: { state: 'COMPLETED', title: 'Start a soccer club.', description: "An idea became Firelands United, a minor league soccer club in northern Ohio. Starting the club is a completed chapter; the club's story keeps going.", objective: 'Launch Firelands United.', url: 'https://firelandsunited.com/', action: 'Explore Firelands United', point: [365, 460] },
  3: { state: 'CURRENT QUEST', title: 'Show up. Hit record. Every day.', description: "Vlog every day in 2026. The everyday moments, the family adventures, and everything I'm building along the way. A whole year of making the story as I go.", objective: '365 days. 365 vlogs.', url: 'https://www.youtube.com/@AndrewChwalik', action: 'Follow the daily vlogs', point: [290, 365] },
  4: { state: 'LOCKED PREVIEW', title: 'The next adventure: debt free.', description: "Pay off all our debt. A new chapter for our family, with more room for the life we want to build.", objective: 'Pay off all our debt.', point: [415, 275] },
};
const route = document.getElementById('travel-route');
const player = document.querySelector('.player');
const routeLength = route.getTotalLength();
// Match stops to the same SVG path used to draw the landscape's trail.
const stops = Object.fromEntries(Object.entries(chapters).map(([id, chapter]) => {
  let nearest = 0;
  let distance = Infinity;
  for (let length = 0; length <= routeLength; length += 0.5) {
    const point = route.getPointAtLength(length);
    const candidate = Math.hypot(point.x - chapter.point[0], point.y - chapter.point[1]);
    if (candidate < distance) { distance = candidate; nearest = length; }
  }
  return [id, nearest];
}));
let position = stops[3];
let frame;
let journey = 0;
let branchPosition = null;
let headingHome = false;
let lastChapter = 3;
let lockedReturn = null;
let lockAnimations = [];
function clearLockFeedback() {
  lockAnimations.forEach(animation => animation.cancel());
  lockAnimations = [];
}
const houseRoute = document.getElementById('house-route');
let houseJunction = 0;
let junctionDistance = Infinity;
for (let length = 0; length <= routeLength; length += .5) {
  const point = route.getPointAtLength(length);
  const distance = Math.hypot(point.x - 181, point.y - 518);
  if (distance < junctionDistance) { junctionDistance = distance; houseJunction = length; }
}
function place(length) {
  const point = route.getPointAtLength(length);
  player.style.left = (point.x / 600 * 100) + '%';
  player.style.top = (point.y / 700 * 100) + '%';
}
function showChapter(number) {
  const chapter = chapters[number];
  document.querySelector('.chapter-number').textContent = String(number).padStart(2, '0');
  document.getElementById('chapter-status').textContent = chapter.state + ' / CHAPTER ' + String(number).padStart(2, '0');
  document.getElementById('chapter-title').textContent = chapter.title;
  document.getElementById('chapter-description').textContent = chapter.description;
  const label = document.createElement('span');
  label.textContent = 'THE GOAL';
  document.getElementById('chapter-objective').replaceChildren(label, document.createTextNode(chapter.objective));
  document.getElementById('chapter-actions').hidden = !chapter.url;
  const link = document.querySelector('#chapter-actions .button');
  if (chapter.url) { link.href = chapter.url; link.textContent = chapter.action + ' ↗'; }
  document.querySelector('.chapter-stamp').hidden = number !== 3;
  const note = document.getElementById('locked-note');
  note.hidden = number !== 4;
  note.textContent = 'Preview only. Complete Chapter 03 to unlock this quest.';
  document.querySelectorAll('[data-chapter]').forEach(button => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.chapter) === number));
  });
  if (matchMedia('(min-width: 1000px)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const copy = document.querySelector('.chapter-copy');
    copy.getAnimations().forEach(animation => animation.cancel());
    copy.animate([{ opacity: .35, transform: 'translateX(-10px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'ease-out' });
  }
}
function selectChapter(number) {
  if (number === 4 && lockedReturn) return;
  cancelAnimationFrame(frame);
  clearLockFeedback();
  lockedReturn = number === 4 ? { position, branch: branchPosition, chapter: lastChapter } : null;
  const ticket = ++journey;
  headingHome = false;
  showChapter(number);
  const status = document.querySelector('.travel-status');
  status.textContent = 'Traveling to Level ' + number + '...';
  const continueToChapter = () => walk(route, position, stops[number], ticket, () => {
    if (number === 4) { bounceFromLock(ticket, status); return; }
    lastChapter = number;
    status.textContent = 'Level ' + number + ': ' + chapters[number].title + (matchMedia('(min-width: 1000px)').matches ? ' Details beside the map.' : ' Details below the map.');
  });
  if (branchPosition !== null) {
    walk(houseRoute, branchPosition, 0, ticket, () => {
      position = houseJunction;
      branchPosition = null;
      continueToChapter();
    });
  } else continueToChapter();
}
function bounceFromLock(ticket, status) {
  const origin = lockedReturn;
  if (!origin || ticket !== journey) return;
  status.textContent = 'Locked! Complete daily vlogging first. Heading back...';
  document.getElementById('locked-note').textContent = 'Still locked. Finish the daily vlogging quest first.';
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const jitter = [0, -4, 3, -2, 2, 0].map(x => ({ transform: `translateX(${x}px)` }));
    lockAnimations = [document.querySelector('[data-chapter="4"] .level-disc'), player.querySelector('svg')]
      .map(element => element.animate(jitter, { duration: 420, easing: 'steps(1, end)' }));
  }
  const returned = () => {
    lockedReturn = null;
    showChapter(origin.chapter);
    status.textContent = 'Debt free is locked. Back where you started.';
  };
  walk(route, position, origin.branch === null ? origin.position : houseJunction, ticket, () => {
    if (origin.branch !== null) walk(houseRoute, 0, origin.branch, ticket, returned);
    else returned();
  });
}
function walk(path, start, end, ticket, arrived) {
  // Keep a consistent walking pace even when crossing several chapters.
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Math.abs(end - start) * 7;
  player.classList.toggle('walking', duration > 0);
  const began = performance.now();
  function step(now) {
    if (ticket !== journey) return;
    const progress = duration ? Math.min(1, (now - began) / duration) : 1;
    // Short, gentle acceleration and deceleration with a steady middle pace.
    const ramp = 0.12;
    const eased = progress < ramp ? progress * progress / (2 * ramp * (1 - ramp))
      : progress > 1 - ramp ? 1 - (1 - progress) ** 2 / (2 * ramp * (1 - ramp))
      : (progress - ramp / 2) / (1 - ramp);
    const distance = start + (end - start) * eased;
    if (path === route) { branchPosition = null; position = distance; place(position); }
    else {
      branchPosition = distance;
      const point = path.getPointAtLength(distance);
      player.style.left = (point.x / 600 * 100) + '%';
      player.style.top = (point.y / 700 * 100) + '%';
    }
    if (progress < 1) frame = requestAnimationFrame(step);
    else {
      player.classList.remove('walking');
      arrived();
    }
  }
  frame = requestAnimationFrame(step);
}
document.querySelectorAll('[data-chapter]').forEach(button => {
  button.addEventListener('click', () => selectChapter(Number(button.dataset.chapter)));
});
document.getElementById('house-stop').addEventListener('click', () => {
  if (headingHome) return;
  cancelAnimationFrame(frame);
  const ticket = ++journey;
  lockedReturn = null;
  clearLockFeedback();
  headingHome = true;
  document.querySelector('.travel-status').textContent = 'Heading home. Come on in...';
  const enterFromBranch = () => {
    walk(houseRoute, branchPosition ?? 0, houseRoute.getTotalLength(), ticket, () => {
      headingHome = false;
      document.dispatchEvent(new Event('enter-house'));
    });
  };
  if (branchPosition !== null) enterFromBranch();
  else walk(route, position, houseJunction, ticket, enterFromBranch);
});
document.addEventListener('leave-house', () => {
  cancelAnimationFrame(frame);
  journey++;
  lockedReturn = null;
  clearLockFeedback();
  player.classList.remove('walking');
  headingHome = false;
  position = houseJunction;
  branchPosition = houseRoute.getTotalLength();
  const doorstep = houseRoute.getPointAtLength(branchPosition);
  player.style.left = `${doorstep.x / 6}%`;
  player.style.top = `${doorstep.y / 7}%`;
  document.querySelector('.travel-status').textContent = 'Outside Home Base. Choose a chapter or head back inside.';
});
place(position);
showChapter(3);
