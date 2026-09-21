const chapters = {
  1: {
    status: 'CURRENT QUEST / CHAPTER 01',
    title: 'Show up. Hit record. Every day.',
    description: "Vlog every day in 2026. The everyday moments, the family adventures, and everything I'm building along the way. A whole year of making the story as I go.",
    objective: '365 days. 365 vlogs.',
  },
  2: {
    status: 'LOCKED / CHAPTER 02',
    title: 'The next adventure: debt free.',
    description: "Pay off all our debt. A new chapter for our family, with more room for the life we want to build.",
    objective: 'Pay off all our debt.',
  },
  3: { status: 'LOCKED / CHAPTER 03', title: 'Some adventures are still unwritten.', description: "I'm still figuring out what this chapter will be. For now, the next step is showing up for the chapter I'm in.", objective: 'To be decided.' },
  4: { status: 'LOCKED / CHAPTER 04', title: 'The road goes on.', description: "There are more adventures ahead. This space is waiting for a goal worth chasing.", objective: 'To be decided.' },
};

document.querySelectorAll('[data-chapter]').forEach((button) => {
  button.addEventListener('click', () => {
    const number = Number(button.dataset.chapter);
    const chapter = chapters[number];
    document.querySelector('.chapter-number').textContent = String(number).padStart(2, '0');
    document.getElementById('chapter-status').textContent = chapter.status;
    document.getElementById('chapter-title').textContent = chapter.title;
    document.getElementById('chapter-description').textContent = chapter.description;
    const objective = document.getElementById('chapter-objective');
    objective.replaceChildren();
    const label = document.createElement('span');
    label.textContent = 'THE GOAL';
    objective.append(label, document.createTextNode(chapter.objective));
    document.getElementById('chapter-actions').hidden = number !== 1;
    document.querySelector('.chapter-stamp').hidden = number !== 1;
    const note = document.getElementById('locked-note');
    note.hidden = number === 1;
    note.textContent = number === 2 ? 'Complete Chapter 01 to unlock this quest.' : 'Future chapter. Complete the preceding chapters to reach this stop.';
    if (number === 1) {
      const player = document.querySelector('.player');
      player.classList.remove('hop');
      void player.offsetWidth;
      player.classList.add('hop');
    }
    const panel = document.getElementById('chapter-panel');
    panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    const heading = document.getElementById('chapter-title');
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  });
});
