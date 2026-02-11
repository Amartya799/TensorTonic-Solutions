import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV = 'test';
process.env.PORT = '4100';
const { server } = await import('../backend/server.js');
const { resetProjectsFile } = await import('../backend/data/store.js');

const baseUrl = 'http://127.0.0.1:4100';

test.before(async () => {
  await new Promise((resolve) => server.listen(4100, resolve));
});

test.after(async () => {
  await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
});

test.beforeEach(() => {
  resetProjectsFile();
});

test('GET /api/health returns ok', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'ok');
});

test('POST /api/projects creates a project and appears in list', async () => {
  const payload = {
    title: 'Realtime Analytics Portal',
    summary: 'An analytics dashboard with near-realtime event streaming.',
    stack: ['Vue', 'Node.js', 'Redis'],
    impact: 'Improved monitoring response time by 30%.',
    status: 'in-progress'
  };

  const createResponse = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.equal(createResponse.status, 201);
  const created = await createResponse.json();
  assert.equal(created.title, payload.title);
  assert.ok(created.id);

  const listResponse = await fetch(`${baseUrl}/api/projects`);
  assert.equal(listResponse.status, 200);
  const projects = await listResponse.json();
  assert.ok(projects.some((project) => project.id === created.id));
});

test('PATCH /api/projects/:id/status updates project status', async () => {
  const createResponse = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Graph Visualizer',
      summary: 'A graph modeling tool for network topology experiments.',
      stack: ['Svelte', 'Node.js', 'D3'],
      impact: 'Enabled faster debugging of network dependencies.',
      status: 'planned'
    })
  });
  const created = await createResponse.json();

  const patchResponse = await fetch(`${baseUrl}/api/projects/${created.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'completed' })
  });

  assert.equal(patchResponse.status, 200);
  const updated = await patchResponse.json();
  assert.equal(updated.status, 'completed');
});
