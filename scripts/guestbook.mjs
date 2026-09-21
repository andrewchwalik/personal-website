import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [action, id] = process.argv.slice(2);
let sql;
if (action === 'list') sql = 'SELECT id,name,message,datetime(created_at/1000,\'unixepoch\') AS posted,hidden FROM guestbook ORDER BY created_at DESC LIMIT 50';
else if (['hide', 'restore'].includes(action) && /^[a-f0-9-]{36}$/.test(id || '')) {
  sql = `UPDATE guestbook SET hidden=${action === 'hide' ? 1 : 0} WHERE id='${id}' RETURNING id,name,hidden`;
} else {
  console.error('Use: node scripts/guestbook.mjs list | hide ENTRY_ID | restore ENTRY_ID');
  process.exit(1);
}
const result = spawnSync('wrangler', ['d1', 'execute', 'andrew-adventure-guestbook', '--remote', '--config',
  fileURLToPath(new URL('../backend/wrangler.jsonc', import.meta.url)), '--command', sql], { stdio: 'inherit' });
process.exit(result.status ?? 1);
