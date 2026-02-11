import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'projects.json');

const defaultData = {
  projects: [
    {
      id: crypto.randomUUID(),
      title: 'Smart Expense Tracker',
      summary: 'Tracks income/expenses and renders spending insights dashboards.',
      stack: ['React', 'Node.js', 'PostgreSQL'],
      impact: 'Reduced monthly budgeting time by 40% in pilot usage.',
      status: 'completed',
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      title: 'AI FAQ Assistant',
      summary: 'Semantic search chatbot for product documentation.',
      stack: ['Next.js', 'FastAPI', 'OpenAI API'],
      impact: 'Cut support tickets by 22% after launch.',
      status: 'in-progress',
      createdAt: new Date().toISOString()
    }
  ]
};

function ensureDb() {
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
  }
}

export function readProjects() {
  ensureDb();
  const raw = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(raw).projects;
}

export function writeProjects(projects) {
  ensureDb();
  fs.writeFileSync(dbPath, JSON.stringify({ projects }, null, 2));
}

export function resetProjectsFile() {
  fs.rmSync(dbPath, { force: true });
}
