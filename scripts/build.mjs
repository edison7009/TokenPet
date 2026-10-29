import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const result = await build({ entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', target: 'es2020', write: false, legalComments: 'inline' });
const iconNames = ['CLAUDE', 'CHATGPT', 'CURSOR', 'ANTIGRAVITY', 'GROK_BUILD'];
const [template, style, license, favicon, ...toolIcons] = await Promise.all([
  readFile('src/page.html', 'utf8'), readFile('src/style.css', 'utf8'), readFile('node_modules/three/LICENSE', 'utf8'), readFile('assets/TokenPet.png'),
  ...['claude.svg', 'chatgpt.svg', 'cursor.svg', 'antigravity-mono.svg', 'grok-build.svg'].map((file) => readFile(`assets/tools/${file}`)),
]);
let html = template.replace('{{FAVICON}}', `data:image/png;base64,${favicon.toString('base64')}`).replace('{{STYLE}}', style).replace('{{THREE_LICENSE}}', license.replaceAll('--', '—')).replace('{{SCRIPT}}', () => result.outputFiles[0].text.replaceAll('</script', '<\\/script'));
iconNames.forEach((name, index) => {
  html = html.replaceAll(`{{ICON_${name}}}`, `data:image/svg+xml;base64,${toolIcons[index].toString('base64')}`);
});
await mkdir('dist', { recursive: true });
await mkdir('licenses', { recursive: true });
await writeFile('index.html', html);
await writeFile('dist/index.html', html);
await writeFile('licenses/three-LICENSE.txt', license);
console.log(`Built index.html and dist/index.html (${(Buffer.byteLength(html) / 1024).toFixed(0)} KiB each). Fully offline, no external assets.`);
