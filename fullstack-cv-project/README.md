# CareerForge (Full-Stack CV Project)

CareerForge is a full-stack web app that helps job seekers organize project case studies they can copy directly into resumes and interviews.

## Features
- Create and list portfolio projects with stack, summary, and measurable impact.
- Update project status (`planned`, `in-progress`, `completed`).
- Filter projects by status in a responsive dashboard.
- REST API with input validation.
- Simple JSON persistence for quick local demos.

## Tech Stack
- **Backend:** Node.js (native `http` module)
- **Frontend:** HTML, CSS, vanilla JavaScript
- **Testing:** Node test runner + native `fetch`

## Run locally
```bash
cd fullstack-cv-project
npm start
```
Then open `http://localhost:4000`.

## Run tests
```bash
cd fullstack-cv-project
npm test
```

## API Endpoints
- `GET /api/health`
- `GET /api/projects`
- `POST /api/projects`
- `PATCH /api/projects/:id/status`
