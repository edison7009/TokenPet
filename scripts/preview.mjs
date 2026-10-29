import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

const port = process.argv[2] === undefined ? 4177 : Number(process.argv[2]);
const server = http.createServer(async (request, response) => {
  if (!['/', '/index.html'].includes(request.url)) {
    response.writeHead(404).end();
    return;
  }
  try {
    const html = await readFile(new URL('../dist/index.html', import.meta.url));
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    response.end(html);
  } catch {
    response.writeHead(503).end('Run npm run build first.');
  }
});
server.listen(port, '127.0.0.1', async () => {
  const url = `http://127.0.0.1:${server.address().port}/`;
  await mkdir(new URL('../.preview/', import.meta.url), { recursive: true });
  await writeFile(new URL('../.preview/server.json', import.meta.url), JSON.stringify({ pid: process.pid, url, started: new Date().toISOString(), script: import.meta.url }, null, 2));
  console.log(`Local: ${url}`);
});
const stop = () => server.close(() => process.exit(0));
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.stdin.on('data', (data) => { if (data.includes(3)) stop(); });
