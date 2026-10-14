// Pin the owner's confirmed entry by ID, never by a visitor-supplied name.
export const welcomeEntry = {
  id: '05a73505-2078-4757-850f-366cabff8342',
  name: 'Andrew Chwalik',
  message: 'Thanks for visiting my site, which is pretty much my life map! I have some pretty lofty goals as you can see. Feel free to explore the map, check out some of my adventures, and help me continue to climb. And of course, leave a fun little message in the guestbook to show you were here.'
};
export const readerEntries = entries => entries.filter(entry => entry.id !== welcomeEntry.id);
