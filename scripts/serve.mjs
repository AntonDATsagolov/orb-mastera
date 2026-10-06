import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releasePreview = process.argv.includes('--release');
const root = path.join(projectRoot, releasePreview ? 'dist' : '.');
if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error(releasePreview ? 'Release bundle not found. Run `npm run build` first.' : 'PWA source not found.');
  process.exit(1);
}
const port = Number(process.env.ORB_MASTERS_PORT || 4173);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json', '.webp': 'image/webp',
};

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }
  const relative = pathname.replace(/^\/+/, '') || 'index.html';
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  const file = fs.existsSync(target) && fs.statSync(target).isDirectory() ? path.join(target, 'index.html') : target;
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  if (request.method === 'HEAD') response.end();
  else fs.createReadStream(file).pipe(response);
});

server.listen(port, '127.0.0.1', () => console.log(`ORB MASTERS served from ${path.relative(projectRoot, root)} at http://127.0.0.1:${port}`));
