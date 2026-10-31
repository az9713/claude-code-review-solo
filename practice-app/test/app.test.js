import test from 'node:test';
import assert from 'node:assert/strict';
import { makeServer } from '../server.js';

test('GET /api/tasks returns the seed task', async () => {
  const server = makeServer().listen(0);
  const { port } = server.address();
  const tasks = await (await fetch(`http://localhost:${port}/api/tasks`)).json();
  server.close();
  assert.equal(tasks[0].title, 'Try the practice app');
});
