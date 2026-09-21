CREATE TABLE IF NOT EXISTS guestbook (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 40),
  message TEXT NOT NULL CHECK(length(message) BETWEEN 3 AND 400),
  created_at INTEGER NOT NULL,
  visitor_hash TEXT NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0 CHECK(hidden IN (0, 1))
);
CREATE INDEX IF NOT EXISTS guestbook_public ON guestbook(hidden, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS guestbook_rate ON guestbook(visitor_hash, created_at DESC);
