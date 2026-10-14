export const titleCase = text => text.replace(/(^|[\s-])([a-z])/g, (_, space, letter) => space + letter.toUpperCase());

// Keep the world covered until its decoded artwork and positioned actors can paint together.
export async function revealWorld() {
  const stage = document.querySelector('.stage');
  const picture = stage.querySelector('img');
  try {
    await picture.decode();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    document.documentElement.classList.remove('world-loading');
    stage.removeAttribute('aria-busy');
    return true;
  } catch {
    document.documentElement.classList.add('world-error');
    const retry = document.createElement('button');
    retry.className = 'world-retry';
    retry.textContent = 'Map could not load. Tap to retry.';
    retry.onclick = () => location.reload();
    stage.append(retry);
    return false;
  }
}
