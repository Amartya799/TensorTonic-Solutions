import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { URL, fileURLToPath } from 'node:url';
import { readProjects, writeProjects } from './data/store.js';
import crypto from 'node:crypto';

const PORT = Number(process.env.PORT || 4000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.resolve(__dirname, '../frontend');

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath) {
  try {
    const extension = path.extname(filePath);
    const contentType = extension === '.css'
      ? 'text/css'
      : extension === '.js'
        ? 'application/javascript'
        : 'text/html';

    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function validateProject(payload) {
  const statuses = ['planned', 'in-progress', 'completed'];
  const valid =
    typeof payload.title === 'string' && payload.title.trim().length >= 3 &&
    typeof payload.summary === 'string' && payload.summary.trim().length >= 10 &&
    Array.isArray(payload.stack) && payload.stack.length > 0 && payload.stack.every((s) => typeof s === 'string' && s.trim().length >= 2) &&
    typeof payload.impact === 'string' && payload.impact.trim().length >= 5 &&
    statuses.includes(payload.status);

  return valid;
}

export async function handler(req, res) {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host}`);
  const { pathname } = requestUrl;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, { status: 'ok' });
  }

  if (req.method === 'GET' && pathname === '/api/projects') {
    const projects = readProjects().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sendJson(res, 200, projects);
  }

  if (req.method === 'POST' && pathname === '/api/projects') {
    try {
      const body = await parseBody(req);
      if (!validateProject(body)) {
        return sendJson(res, 400, { message: 'Invalid project payload.' });
      }

      const projects = readProjects();
      const newProject = {
        id: crypto.randomUUID(),
        title: body.title.trim(),
        summary: body.summary.trim(),
        stack: body.stack.map((item) => item.trim()).filter(Boolean),
        impact: body.impact.trim(),
        status: body.status,
        createdAt: new Date().toISOString()
      };
      projects.push(newProject);
      writeProjects(projects);

      return sendJson(res, 201, newProject);
    } catch (error) {
      return sendJson(res, 400, { message: error.message });
    }
  }

  if (req.method === 'PATCH' && pathname.startsWith('/api/projects/')) {
    const match = pathname.match(/^\/api\/projects\/([^/]+)\/status$/);
    if (!match) {
      return sendJson(res, 404, { message: 'Not found.' });
    }

    try {
      const body = await parseBody(req);
      const allowed = ['planned', 'in-progress', 'completed'];
      if (!allowed.includes(body.status)) {
        return sendJson(res, 400, { message: 'Status must be planned, in-progress, or completed.' });
      }

      const projects = readProjects();
      const project = projects.find((item) => item.id === match[1]);
      if (!project) {
        return sendJson(res, 404, { message: 'Project not found.' });
      }

      project.status = body.status;
      writeProjects(projects);
      return sendJson(res, 200, project);
    } catch (error) {
      return sendJson(res, 400, { message: error.message });
    }
  }

  if (pathname === '/' || pathname === '/index.html') {
    return sendFile(res, path.join(frontendPath, 'index.html'));
  }

  if (pathname === '/styles.css') {
    return sendFile(res, path.join(frontendPath, 'styles.css'));
  }

  if (pathname === '/app.js') {
    return sendFile(res, path.join(frontendPath, 'app.js'));
  }

  return sendFile(res, path.join(frontendPath, 'index.html'));
}

export const server = http.createServer((req, res) => {
  handler(req, res);
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`CareerForge app listening on http://localhost:${PORT}`);
  });
}
