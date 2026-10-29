import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const result = await build({ entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', target: 'es2020', write: false, legalComments: 'inline' });
const [template, style, license] = await Promise.all([
  readFile('src/page.html', 'utf8'), readFile('src/style.css', 'utf8'), readFile('node_modules/three/LICENSE', 'utf8'),
]);
const html = template.replace('{{STYLE}}', style).replace('{{THREE_LICENSE}}', license.replaceAll('--', '—')).replace('{{SCRIPT}}', () => result.outputFiles[0].text.replaceAll('</script', '<\\/script'));
await mkdir('dist', { recursive: true });
await mkdir('licenses', { recursive: true });
await writeFile('dist/index.html', html);
await writeFile('licenses/three-LICENSE.txt', license);
console.log(`Built dist/index.html (${(Buffer.byteLength(html) / 1024).toFixed(0)} KiB). Fully offline, no external assets.`);
