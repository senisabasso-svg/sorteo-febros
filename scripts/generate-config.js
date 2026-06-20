const fs = require('fs');
const path = require('path');

const backend = (
  process.env.BACKEND_URL ||
  'https://sorteo-beautymaxuy-production.up.railway.app'
).replace(/\/$/, '');

const content = `window.API_BASE = '${backend}';\n`;

const targets = [
  path.join(__dirname, '..', 'config.js'),
  path.join(__dirname, '..', 'public', 'config.js'),
];

for (const target of targets) {
  fs.writeFileSync(target, content);
}

console.log(`API_BASE: ${backend}`);
