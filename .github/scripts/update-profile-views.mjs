import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const username = process.env.PROFILE_USERNAME || 'StarNezz';
if (!/^[a-zA-Z0-9-]+$/.test(username)) throw new Error('Invalid GitHub username');
const url = new URL('https://komarev.com/ghpvc/');
url.searchParams.set('username', username);
url.searchParams.set('label', 'Profile views');
url.searchParams.set('style', 'for-the-badge');
let count;
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`Counter returned HTTP ${response.status}`);
    const counterSvg = await response.text();
    const match = counterSvg.match(/aria-label="[^"<>]*:\s*([\d,]+)"/i);
    if (!match) throw new Error('Counter response has no numeric value');
    count = Number(match[1].replaceAll(',', ''));
    if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid counter value');
    break;
  } catch (error) {
    if (attempt === 2) throw error;
    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
  }
}
const updated = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
const template = await readFile('.github/assets/mecha-views-template.svg', 'utf8');
const photo = await readFile('.github/assets/unicorn-gundam.jpg');
if (!template.includes('__COUNT__') || !template.includes('__UPDATED__') || !template.includes('__GUNDAM_PHOTO__')) throw new Error('Invalid panel template');
const panel = template
  .replaceAll('__COUNT__', count.toLocaleString('en-US'))
  .replaceAll('__UPDATED__', updated)
  .replaceAll('__GUNDAM_PHOTO__', photo.toString('base64'));
const output = resolve(process.env.OUTPUT_DIR || 'dist');
await mkdir(output, { recursive: true });
await writeFile(resolve(output, 'mecha-views.svg'), panel);
console.log(`Generated panel with ${count} views; synchronized ${updated}`);
