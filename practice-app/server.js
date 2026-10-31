// Tiny task list. No dependencies. Data lives in memory, so every start is a clean, throwaway store.
import http from 'node:http';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const tasks = [{ id: 1, title: 'Try the practice app', done: false }];

export function makeServer() {
  return http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/api/tasks') {
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify(tasks));
    }
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(new URL('./index.html', import.meta.url)));
    }
    res.writeHead(404).end('not found');
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  makeServer().listen(port, () => console.log(`practice-app on http://localhost:${port}`));
}
