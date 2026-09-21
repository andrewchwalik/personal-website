const encoder = new TextEncoder();
const PUBLIC_FIELDS = 'id, name, message, created_at AS createdAt';
const json = (data, status = 200) => Response.json(data, { status });
const error = (message, status = 400) => json({ error: message }, status);

export async function readLimited(response, maxBytes) {
  if (Number(response.headers.get('content-length')) > maxBytes) throw new Error('Too large');
  const reader = response.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder();
  let length = 0, result = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) { await reader.cancel(); throw new Error('Too large'); }
      result += decoder.decode(value, { stream: true });
    }
    return result + decoder.decode();
  } finally { reader.releaseLock(); }
}

async function key(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
const hex = buffer => Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2, '0')).join('');
async function sign(value, secret) { return hex(await crypto.subtle.sign('HMAC', await key(secret), encoder.encode(value))); }

export async function makeChallenge(secret, now = Date.now()) {
  const payload = `${crypto.randomUUID()}:${now}`;
  return `${payload}:${await sign(payload, secret)}`;
}
export async function verifyChallenge(token, secret, now = Date.now()) {
  if (typeof token !== 'string' || !/^[a-f0-9-]{36}:\d{13}:[a-f0-9]{64}$/.test(token)) return null;
  const [id, time, signature] = token.split(':');
  const age = now - Number(time);
  if (age < 2000 || age > 30 * 60 * 1000) return null;
  const bytes = Uint8Array.from(signature.match(/../g), v => parseInt(v, 16));
  const valid = await crypto.subtle.verify('HMAC', await key(secret), bytes, encoder.encode(`${id}:${time}`));
  return valid ? id : null;
}
export function validateEntry(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Please enter a name and message.';
  if (body.website) return 'We could not accept this entry.';
  if (body.consent !== true) return 'Please confirm that your message will be public.';
  if (typeof body.name !== 'string' || typeof body.message !== 'string') return 'Please enter a name and message.';
  if (!body.name.trim() || body.name.trim().length > 40) return 'Use a display name between 1 and 40 characters.';
  if (body.message.trim().length < 3 || body.message.trim().length > 400) return 'Write a message between 3 and 400 characters.';
  if (/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(body.name + body.message)) return 'Please use plain text, without HTML.';
  if (/(https?:|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|xyz)\b)/i.test(body.name + body.message)) return 'Please leave links out of the guestbook.';
  return null;
}

const INSERT_ENTRY = `INSERT INTO guestbook (id,name,message,created_at,visitor_hash)
  SELECT ?,?,?,?,? WHERE
  NOT EXISTS (SELECT 1 FROM guestbook WHERE visitor_hash=? AND created_at>?)
  AND (SELECT COUNT(*) FROM guestbook WHERE visitor_hash=? AND created_at>?)<3
  AND (SELECT COUNT(*) FROM guestbook WHERE created_at>?)<100
  ON CONFLICT(id) DO NOTHING RETURNING ${PUBLIC_FIELDS}`;

async function postEntry(request, env) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) return error('Use JSON.', 415);
  if (!env.SIGNING_SECRET) return error('The guestbook is not ready yet.', 503);
  let body;
  try { body = JSON.parse(await readLimited(request, 4096)); } catch { return error('This entry is too large or could not be read.', 400); }
  const invalid = validateEntry(body);
  if (invalid) return error(invalid);
  const now = Date.now();
  const id = await verifyChallenge(body.token, env.SIGNING_SECRET, now);
  if (!id) return error('Please refresh the guestbook and try again.', 403);
  // Daily pseudonyms enforce limits without retaining raw visitor IP addresses.
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return error('Unable to verify this connection.', 403);
  const visitor = await sign(`${new Date(now).toISOString().slice(0, 10)}:${ip}`, env.SIGNING_SECRET);
  const existing = await env.DB.prepare(`SELECT ${PUBLIC_FIELDS} FROM guestbook WHERE id=? AND visitor_hash=? AND hidden=0`).bind(id, visitor).first();
  if (existing) return json({ entry: existing });
  const result = await env.DB.prepare(INSERT_ENTRY).bind(id, body.name.trim(), body.message.trim(), now, visitor,
    visitor, now - 60_000, visitor, now - 86_400_000, now - 3_600_000).first();
  if (!result) return error('Please wait before signing again. Each visitor can leave up to 3 messages a day.', 429);
  return json({ entry: result }, 201);
}

const decodeXML = value => value.replace(/&(?:amp|lt|gt|quot|apos);|&#(?:\d+|x[\da-f]+);/gi, entity => {
  const named = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };
  if (named[entity]) return named[entity];
  const value = entity.slice(2, -1), code = parseInt(value[0] === 'x' ? value.slice(1) : value, value[0] === 'x' ? 16 : 10);
  return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
});
export function parseVideoFeed(xml) {
  const first = xml.match(/<entry>[\s\S]*?<\/entry>/)?.[0];
  const id = first?.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
  const title = first?.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  const publishedAt = first?.match(/<published>([^<]+)<\/published>/)?.[1];
  if (!id || !title) throw new Error('No public video in feed');
  return { id, title: decodeXML(title), publishedAt, url: `https://www.youtube.com/watch?v=${id}` };
}
async function latestVlog(request, env, ctx) {
  const cache = globalThis.caches?.default;
  const cacheKey = new Request(`${new URL(request.url).origin}/vlog`);
  const cached = await cache?.match(cacheKey);
  if (cached) return cached;
  const upstream = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${env.YOUTUBE_CHANNEL_ID}`, { signal: AbortSignal.timeout(8000) });
  if (!upstream.ok) return error('YouTube is unavailable. Please open the channel instead.', 502);
  const response = json({ video: parseVideoFeed(await readLimited(upstream, 300_000)) });
  response.headers.set('Cache-Control', 'public, max-age=300');
  if (cache) ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin');
    const allowed = env.ALLOWED_ORIGINS.split(',');
    if (origin && !allowed.includes(origin)) return error('Origin not allowed.', 403);
    const headers = {
      'Access-Control-Allow-Origin': origin || 'https://andrewchwalik.com',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store'
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    let response;
    try {
      const url = new URL(request.url);
      if (request.method === 'GET' && url.pathname === '/vlog') response = await latestVlog(request, env, ctx);
      else if (request.method === 'GET' && url.pathname === '/guestbook/challenge') {
        response = env.SIGNING_SECRET ? json({ token: await makeChallenge(env.SIGNING_SECRET) }) : error('The guestbook is not ready yet.', 503);
      } else if (request.method === 'GET' && url.pathname === '/guestbook') {
        const cursor = url.searchParams.get('before') || '';
        if (cursor && !/^\d{13}_[a-f0-9-]{36}$/.test(cursor)) response = error('Invalid page.');
        else {
          const [time, id] = cursor.split('_');
          const rows = cursor
            ? await env.DB.prepare(`SELECT ${PUBLIC_FIELDS} FROM guestbook WHERE hidden=0 AND (created_at<? OR (created_at=? AND id<?)) ORDER BY created_at DESC,id DESC LIMIT 21`).bind(Number(time), Number(time), id).all()
            : await env.DB.prepare(`SELECT ${PUBLIC_FIELDS} FROM guestbook WHERE hidden=0 ORDER BY created_at DESC,id DESC LIMIT 21`).all();
          const entries = rows.results.slice(0, 20), last = entries.at(-1);
          response = json({ entries, next: rows.results.length > 20 ? `${last.createdAt}_${last.id}` : null });
        }
      } else if (request.method === 'POST' && url.pathname === '/guestbook') response = origin ? await postEntry(request, env) : error('Origin required.', 403);
      else response = error('Not found.', 404);
    } catch (failure) {
      console.error(JSON.stringify({ event: 'home-base-error', type: failure?.name || 'Error' }));
      response = error('Unable to connect right now. Please try again shortly.', 503);
    }
    const result = new Response(response.body, response);
    for (const [name, value] of Object.entries(headers)) result.headers.set(name, value);
    return result;
  }
};
