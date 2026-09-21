# Home Base

Home Base is an optional map stop. It opens a full-screen room without resetting
the selected chapter. Escape, the exit button, or browser Back returns to the map.
The map character walks from the left-wall doorway to a resting spot on entry.
The doorway's plus marker, exit button, and Escape trigger the return walk before
closing the room. Reduced-motion preferences skip the walking transition.
On exit the character stands at the house doorstep, not the previously selected
chapter. Subsequent trips follow the house branch back to the main trail.
The TV loads the latest public upload from Andrew's YouTube Atom feed; the soccer
ball links to Firelands United's videos. The TV only embeds YouTube after a tap.
Small plus markers on each object keep the room exploratory, with accessible
names for screen readers. The guestbook opens in reading mode: one note per page,
previous/next controls, and keyboard arrow navigation. Older notes load on demand
using the API cursor, so readers can browse the whole book without loading it all
at once. "Leave a note" opens the writing page without losing the current place.

## Shared Guestbook

The room uses the `andrew-home-base` Cloudflare Worker and the
`andrew-adventure-guestbook` D1 database. It is real shared storage, not localStorage.
Production API: `https://andrew-home-base.chwalik.workers.dev`.

Messages appear immediately and can be read by anyone. The form explicitly asks
for consent to publish the display name and message. No email or account is needed.
Entries are limited to 400 characters. HTML and links are rejected. The API uses
signed, expiring, one-use submissions, a honeypot, and atomic database limits:
one message per minute and three per visitor per UTC day, plus 100 total per hour.
Visitor IPs are not stored; a daily rotating HMAC pseudonym is used for limits.
These are basic spam controls, not a guarantee against human abuse. Add Turnstile
or approval-before-publication if the guestbook becomes a spam target.

### Moderation

Use the Cloudflare dashboard's D1 table view, or these commands while signed in:

```
node scripts/guestbook.mjs list
node scripts/guestbook.mjs hide ENTRY_ID
node scripts/guestbook.mjs restore ENTRY_ID
```

Hiding is reversible. Public responses exclude hidden entries and visitor hashes.
The form links to Andrew's Instagram for removal requests. No admin credential is
in the browser. `SIGNING_SECRET` is stored as a Cloudflare secret, not in Git.

## Development

```
node scripts/build-house.mjs
node scripts/build-world.mjs
node --test tests/*.test.mjs
wrangler deploy --dry-run --config backend/wrangler.jsonc
```

For isolated guestbook testing, use `wrangler dev --config backend/wrangler.jsonc`
with a local `.dev.vars` containing a test `SIGNING_SECRET`. Apply migrations with
`wrangler d1 migrations apply andrew-adventure-guestbook --local --config backend/wrangler.jsonc`.
Never seed fake visitor messages in the production database.

The static frontend is still hosted on GitHub Pages. Updating the Worker does not
publish the room UI: commit and push the frontend only when ready to release.
