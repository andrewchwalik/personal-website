const chapters = {
  7: { state: 'COMPLETED', title: 'Business Owners', description: 'My wife and I run Bluebird, a sandwich shop on Lake Erie, and The Wash Company, our local laundromat. Follow our business adventures through the vlogs.', url: 'https://www.youtube.com/playlist?list=PLzLEqDD8AalbUWMfEDAjrz5yWz0Mb07Wj', action: 'Watch the business vlogs', point: [165, 550] },
  8: { state: 'COMPLETED', title: 'Start a soccer club.', description: "Soccer has always been my first true love, since starting to play in the cornfields of northwestern Ohio. I wanted to help share that love with others by starting a local soccer club. The Firelands story continues to unfold, check it out for yourself!", url: 'https://firelandsunited.com/', action: 'Explore Firelands United', point: [365, 460] },
  9: { state: 'CURRENT QUEST', title: 'Vlog every day in 2026.', description: "I'm trying to vlog every single day in 2026, documenting my son growing from age 1 to 2. Which also includes running our businesses up on Lake Erie, travels in our camper, and joys of daily life.", url: 'https://www.youtube.com/@AndrewChwalik', action: 'Follow the daily vlogs', point: [290, 365] },
  10: { state: 'LOCKED PREVIEW', title: 'Pay off all our debt.', description: "The next level for our family, with more room for the life we want to build.", point: [415, 275] },
};
const levelProgress = {
  7: { value: 1, max: 1, message: 'Business owners!' },
  8: { value: 1, max: 1, message: "Men & women's teams compete in the summer!" },
  9: { value: 212, max: 365, message: '212 / 365 vlogs edited' },
  10: { value: 0, max: 1, message: 'Locked' },
};
function showProgress(number) {
  const { value, max, message } = levelProgress[number];
  const bar = document.getElementById('level-progress');
  bar.max = max;
  bar.value = value;
  bar.setAttribute('aria-valuetext', message);
  document.getElementById('level-progress-message').textContent = message;
  document.querySelector('.level-progress').dataset.state = number === 10 ? 'locked' : value === max ? 'complete' : 'active';
}
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
let position = stops[9];
let frame;
let journey = 0;
let branchPosition = null;
let headingHome = false;
let lastChapter = 9;
let lockedReturn = null;
let lockAnimations = [];
function clearLockFeedback() {
  lockAnimations.forEach(animation => animation.cancel());
  lockAnimations = [];
  document.querySelector('[data-chapter="10"]').classList.remove('lock-denied');
}
const houseRoute = document.getElementById('house-route');
const southRoute = document.getElementById('south-route');
const countryRoute = document.getElementById('country-route');
const theatreRoute = document.getElementById('theatre-route');
let theatrePosition = null;
let countryPosition = 0, crossing = false, inCountry = false;
const countryStories = {
  president: { number: 1, point: [400, 520], title: 'Elected President', description: 'Watch the story of this milestone.', url: 'https://youtu.be/5uaEyriSL3A', action: 'Watch the video', message: 'Completed!' },
  startup: { number: 2, point: [400, 430], title: 'Startup Bus', description: 'Explore Startup Bus.', url: 'https://startupbus.com', action: 'Explore Startup Bus', message: 'Completed!' },
  masters: { number: 3, point: [400, 345], title: 'Masters Degree', description: "I moved to Ireland to get my master's degree and documented life along the way. Living abroad was the adventure of a lifetime. Watch some of the vlogs I created while I lived on the Emerald Isle.", url: 'https://www.youtube.com/playlist?list=PLzLEqDD8Aalbud4qkLVkzkFjuXDJrZ1Ee', action: 'Watch the Ireland vlogs', message: 'Degree Secured!' },
  icecream: { number: 4, point: [300, 290], title: 'Ice Cream Shop', description: 'Revisit the ice cream shop through the vlogs.', url: 'https://www.youtube.com/playlist?list=PLzLEqDD8AalYMul900PclGbOMbi8oqD33', action: 'Watch the shop vlogs', message: 'Completed!' },
  delaware: { number: 5, point: [225, 215], title: 'Delaware Rising', description: 'Explore Delaware Rising.', url: 'https://delawarerising.club', action: 'Visit Delaware Rising', message: 'Completed!' },
  house: { number: 6, point: [165, 170], title: 'First House', description: 'Watch the first-house video.', url: 'https://youtube.com/shorts/cGKcB-_NNdM', action: 'Watch the video', message: 'Completed!' },
};
const countryStops = Object.fromEntries(Object.entries(countryStories).map(([id, story]) => {
  let nearest = 0, distance = Infinity;
  for (let length = 0; length <= countryRoute.getTotalLength(); length += .5) {
    const point = countryRoute.getPointAtLength(length);
    const candidate = Math.hypot(point.x - story.point[0], point.y - story.point[1]);
    if (candidate < distance) { distance = candidate; nearest = length; }
  }
  return [id, nearest];
}));
// Find the side-path junction on the trail between levels four and three.
const theatreEntrance = theatreRoute.getPointAtLength(0);
let theatreJunction = 0, theatreJunctionDistance = Infinity;
for (let length = 0; length <= countryRoute.getTotalLength(); length += .5) {
  const point = countryRoute.getPointAtLength(length);
  const distance = Math.hypot(point.x - theatreEntrance.x, point.y - theatreEntrance.y);
  if (distance < theatreJunctionDistance) { theatreJunctionDistance = distance; theatreJunction = length; }
}
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
  showProgress(number);
  document.querySelector('.chapter-number').textContent = String(number).padStart(2, '0');
  document.getElementById('chapter-status').textContent = chapter.state + ' / LEVEL ' + String(number).padStart(2, '0');
  document.getElementById('chapter-title').textContent = chapter.title;
  document.getElementById('chapter-description').textContent = chapter.description;
  document.getElementById('chapter-actions').hidden = !chapter.url;
  const link = document.querySelector('#chapter-actions .button');
  if (chapter.url) { link.href = chapter.url; link.textContent = chapter.action + ' ↗'; }
  document.querySelector('.chapter-stamp').hidden = number !== 9;
  const note = document.getElementById('locked-note');
  note.hidden = number !== 10;
  note.textContent = 'Preview only. Complete Level 09 to unlock this quest.';
  document.querySelectorAll('[data-chapter]').forEach(button => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.chapter) === number));
  });
  if (matchMedia('(min-width: 1000px)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const copy = document.querySelector('.chapter-copy');
    copy.getAnimations().forEach(animation => animation.cancel());
    copy.animate([{ opacity: .35, transform: 'translateX(-10px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'ease-out' });
  }
}
function setCountryView(active) {
  inCountry = active;
  player.style.left = '27.5%';
  player.style.top = active ? '0%' : '100%';
  document.querySelector('.world').classList.toggle('country-view', active);
  document.querySelector('.country-landscape').hidden = !active;
  document.querySelectorAll('.country-control').forEach(button => { button.hidden = !active; });
  document.getElementById('world-name').textContent = active ? 'WORLD 00 / COUNTRY ROOTS' : 'WORLD 01 / THE LONG GAME';
  document.querySelector('.map-status').textContent = active ? 'EARLIER ADVENTURES' : 'LEVEL 09 ACTIVE';
}
function setCrossing(active) {
  crossing = active;
  document.querySelector('.world').classList.toggle('crossing', active);
  document.querySelector('.world').setAttribute('aria-busy', String(active));
}
function showCountryStory(id) {
  const story = countryStories[id];
  document.querySelector('.chapter-number').textContent = String(story.number).padStart(2, '0');
  document.getElementById('chapter-status').textContent = 'COMPLETED / COUNTRY ROOTS / LEVEL ' + String(story.number).padStart(2, '0');
  document.getElementById('chapter-title').textContent = story.title;
  document.getElementById('chapter-description').textContent = story.description;
  document.getElementById('chapter-actions').hidden = false;
  const link = document.querySelector('#chapter-actions .button');
  link.href = story.url;
  link.textContent = story.action + ' ↗';
  document.getElementById('locked-note').hidden = true;
  document.querySelector('.chapter-stamp').hidden = true;
  const progress = document.getElementById('level-progress');
  progress.max = 1; progress.value = 1;
  progress.setAttribute('aria-valuetext', story.message);
  document.getElementById('level-progress-message').textContent = story.message;
  document.querySelector('.level-progress').dataset.state = 'complete';
  document.querySelectorAll('[data-country]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.country === id)));
}
function visitCountry() {
  if (crossing || inCountry) return;
  cancelAnimationFrame(frame);
  const ticket = ++journey;
  clearLockFeedback(); lockedReturn = null; headingHome = false;
  setCrossing(true);
  document.querySelector('.travel-status').textContent = 'Crossing the bridge to Country roots.';
  const crossBridge = () => walk(route, position, 0, ticket, () => {
    walk(southRoute, 0, southRoute.getTotalLength(), ticket, () => {
      setCountryView(true);
      countryPosition = 0;
      showCountryStory('house');
      walk(countryRoute, 0, countryStops.house, ticket, () => {
        setCrossing(false);
        document.querySelector('.travel-status').textContent = 'Arrived at Country roots. Choose a memory to explore.';
      });
    });
  });
  if (branchPosition !== null) walk(houseRoute, branchPosition, 0, ticket, () => {
    position = houseJunction; branchPosition = null; crossBridge();
  });
  else crossBridge();
}
function fromTheatreToTrail(ticket, arrived) {
  if (theatrePosition === null) { arrived(); return; }
  walk(theatreRoute, theatrePosition, 0, ticket, () => {
    theatrePosition = null;
    countryPosition = theatreJunction;
    arrived();
  });
}
document.getElementById('theatre-stop').addEventListener('click', () => {
  if (crossing || !inCountry) return;
  cancelAnimationFrame(frame);
  const ticket = ++journey;
  setCrossing(true);
  document.querySelector('.travel-status').textContent = 'Heading to the theatre.';
  const enterFromPath = () => walk(theatreRoute, theatrePosition ?? 0, theatreRoute.getTotalLength(), ticket, () => {
    setCrossing(false);
    document.dispatchEvent(new Event('enter-theatre'));
  });
  if (theatrePosition !== null) enterFromPath();
  else walk(countryRoute, countryPosition, theatreJunction, ticket, enterFromPath);
});
function returnToIsland() {
  if (crossing || !inCountry) return;
  cancelAnimationFrame(frame);
  const ticket = ++journey;
  setCrossing(true);
  document.querySelector('.travel-status').textContent = 'Crossing back to the current island.';
  fromTheatreToTrail(ticket, () => walk(countryRoute, countryPosition, 0, ticket, () => {
    setCountryView(false);
    showChapter(lastChapter);
    walk(southRoute, southRoute.getTotalLength(), 0, ticket, () => {
      position = 0; branchPosition = null;
      place(position); setCrossing(false);
      document.querySelector('.travel-status').textContent = 'Back on the current island at the bridge landing.';
    });
  }));
}
document.getElementById('visit-country').addEventListener('click', visitCountry);
document.getElementById('return-island').addEventListener('click', returnToIsland);
document.querySelectorAll('[data-country]').forEach(button => button.addEventListener('click', () => {
  if (crossing || !inCountry) return;
  cancelAnimationFrame(frame);
  const ticket = ++journey, id = button.dataset.country;
  showCountryStory(id);
  fromTheatreToTrail(ticket, () => walk(countryRoute, countryPosition, countryStops[id], ticket, () => {
    document.querySelector('.travel-status').textContent = countryStories[id].title;
  }));
}));
function selectChapter(number) {
  if (crossing || inCountry) return;
  if (number === 10 && lockedReturn) return;
  cancelAnimationFrame(frame);
  clearLockFeedback();
  lockedReturn = number === 10 ? { position, branch: branchPosition, chapter: lastChapter } : null;
  const ticket = ++journey;
  headingHome = false;
  showChapter(number);
  const status = document.querySelector('.travel-status');
  status.textContent = 'Traveling to Level ' + number + '...';
  const continueToChapter = () => walk(route, position, stops[number], ticket, () => {
    if (number === 10) { bounceFromLock(ticket, status); return; }
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
async function bounceFromLock(ticket, status) {
  const origin = lockedReturn;
  if (!origin || ticket !== journey) return;
  status.textContent = 'Locked! Complete daily vlogging first. Heading back...';
  document.getElementById('locked-note').textContent = 'Still locked. Finish the daily vlogging quest first.';
  document.querySelector('[data-chapter="10"]').classList.add('lock-denied');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const jitter = [0, -7, 6, -5, 4, -3, 0].map((x, index) => ({
      transform: `translateX(${x}px) skewX(${x / 2}deg)`,
      filter: index > 0 && index < 6
        ? 'drop-shadow(-3px 0 0 #ef6b61) drop-shadow(3px 0 0 #75e6dd)'
        : 'none',
    }));
    lockAnimations = [document.querySelector('[data-chapter="10"] .level-disc'), player.querySelector('svg')]
      .map(element => element.animate(jitter, { duration: 560, easing: 'steps(1, end)' }));
    // Finish the rejection at the checkpoint before starting the return walk.
    await Promise.all(lockAnimations.map(animation => animation.finished.catch(() => {})));
    if (ticket !== journey) return;
  }
  const returned = () => {
    clearLockFeedback();
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
      if (path === houseRoute) branchPosition = distance;
      if (path === countryRoute) countryPosition = distance;
      if (path === theatreRoute) theatrePosition = distance;
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
  if (crossing || inCountry) return;
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
  document.querySelector('.travel-status').textContent = 'Outside Home Base. Choose a level or head back inside.';
});
place(position);
showChapter(9);
