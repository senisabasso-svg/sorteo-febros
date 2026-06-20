const fs = require('fs');
const path = require('path');

const supabaseUrl = (
  process.env.SUPABASE_URL ||
  'https://zxonaviukjfyaftorifs.supabase.co'
).replace(/\/$/, '');

const anonKey = process.env.SUPABASE_ANON_KEY || '';
const apiBase = `${supabaseUrl}/functions/v1/sorteo-api`;

const content = [
  `window.SUPABASE_URL = '${supabaseUrl}';`,
  `window.SUPABASE_ANON_KEY = '${anonKey}';`,
  `window.API_BASE = '${apiBase}';`,
  '',
].join('\n');

const target = path.join(__dirname, '..', 'public', 'config.js');
fs.writeFileSync(target, content);

console.log(`SUPABASE_URL: ${supabaseUrl}`);
console.log(`API_BASE: ${apiBase}`);
