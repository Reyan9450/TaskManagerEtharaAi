# Team Task Manager

A full-stack collaborative task management app with role-based access control, Kanban board, smart priority scoring, and a statistics dashboard.

**Stack**: Node.js + Express + MongoDB (backend) · React + Vite + Tailwind CSS (frontend)

---

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET
npm install
npm run dev            # starts on http://localhost:5000
```

Seed an Admin and Member user for testing:
```bash
npm run seed
# Admin: admin@example.com / Admin1234!
# Member: member@example.com / Member1234!
```

### Frontend

```bash
cd frontend
cp .env.example .env   # set VITE_API_URL=http://localhost:5000
npm install
npm run dev            # starts on http://localhost:5173
```

---

## Deployment

### Backend → Railway

1. Push code to GitHub
2. Create a new Railway project → Deploy from GitHub repo → set root to `backend/`
3. Add environment variables in Railway dashboard:
   - `MONGO_URI` — MongoDB Atlas connection string
   - `JWT_SECRET` — long random secret
   - `CORS_ORIGIN` — your Vercel frontend URL
4. Railway auto-runs `npm install && npm run build` then `node dist/server.js`
5. Health check: `GET /health` → `{ "status": "ok" }`

### Frontend → Vercel

1. Import the repo in Vercel → set root directory to `frontend/`
2. Build command: `npm run build` · Output directory: `dist`
3. Add environment variable:
   - `VITE_API_URL` — your Railway backend URL
4. Deploy — `vercel.json` handles SPA client-side routing

---

## API Overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register user |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/projects` | JWT | List my projects |
| POST | `/api/projects` | Admin | Create project |
| DELETE | `/api/projects/:id` | Admin | Delete + cascade tasks |
| POST | `/api/projects/:id/members` | Admin | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Admin | Remove member |
| GET | `/api/tasks/project/:projectId` | JWT | List tasks (role-filtered) |
| POST | `/api/tasks` | Admin | Create task |
| PUT | `/api/tasks/:id` | Admin | Update task |
| PATCH | `/api/tasks/:id/status` | JWT | Update status only |
| DELETE | `/api/tasks/:id` | Admin | Delete task |
| GET | `/health` | — | Health check |
