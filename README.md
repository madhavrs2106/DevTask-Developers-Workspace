# DevTask

**DevTask** is a full-stack productivity & task-management platform built specifically for
software developers and tech learners. Track programming projects, language roadmaps,
courses and daily coding tasks — with a developer-focused analytics dashboard.

![stack](https://img.shields.io/badge/React%2018-Vite%205-06B6D4)
![stack](https://img.shields.io/badge/Express%204-Prisma%205-14B8A6)
![stack](https://img.shields.io/badge/TailwindCSS-Midnight%20Neon-0F172A)

## Features

- **JWT auth** — register / login / profile settings for **Developers** and **Learners**
- **Interactive dashboard** — total coding hours, active tasks, weekly velocity,
  completed courses, upcoming deadlines + recharts visualisations
  (weekly coding hours, task completion rate, skill mastery progress, sparklines,
  glowing profile ring)
- **Kanban board + list view** — drag & drop tasks across `Backlog → In Progress → Review → Done`
- **Tech-stack tags** — React, Go, Python, Data Structures… with difficulty levels
  (`Beginner / Intermediate / Advanced`)
- **Projects & Courses/Roadmaps** categorisation, GitHub repo links per task/project,
  code-snippet attachments
- **Midnight Neon design system** — deep slate background `#0F172A`, charcoal surfaces
  `#121212`, electric cyan `#06B6D4` glow accents, JetBrains Mono metrics font,
  fully responsive (mobile drawer → tablet → desktop)

## Tech stack

| Layer     | Technology                                                        |
| --------- | ----------------------------------------------------------------- |
| Frontend  | React 18 · TypeScript · Vite · Tailwind CSS · Recharts · Lucide · TanStack Query |
| Backend   | Node.js · Express · JWT (jsonwebtoken) · bcryptjs · Zod validation |
| Database  | PostgreSQL · Prisma ORM                                            |

## Project structure

```
DevTask/
├── client/               # React (Vite + TS) frontend
│   └── src/
│       ├── components/   # layout, ui primitives, dashboard charts, tasks
│       ├── context/      # AuthContext
│       ├── hooks/        # TanStack Query hooks
│       ├── lib/          # axios api client, constants, utils
│       ├── pages/        # Login, Signup, Dashboard, TaskBoard, TaskList, …
│       └── types/
├── server/               # Express API
│   └── src/
│       ├── config/       # env loader
│       ├── controllers/  # auth, tasks, projects, courses, users, analytics
│       ├── middleware/   # requireAuth, error handler
│       ├── routes/
│       └── utils/
├── prisma/               # schema.prisma + seed script
├── scripts/package.mjs   # zips the repo -> DevTask.zip
└── package.json          # root scripts (dev, db, package)
```

## Getting started

### 1. Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 13 running locally (or any reachable Postgres instance)

### 2. Install dependencies

```bash
npm install            # installs everything (npm workspaces: root + client + server)
```

### 3. Configure environment

```bash
cp server/.env.example server/.env    # then edit DATABASE_URL + JWT_SECRET
cp client/.env.example client/.env    # optional (proxy is used by default)
```

### 4. Create database, migrate & seed demo data

```bash
npm run db:migrate     # prisma migrate dev --name init
npm run db:seed        # seeds a rich demo account
```

Demo credentials after seeding:

| email             | password      |
| ----------------- | ------------- |
| `demo@dev.io` | `password123` |

### 5. Run the app (API + web in parallel)

```bash
npm run dev
```

- Web app → http://localhost:5173
- REST API → http://localhost:5000/api/health

## API overview

| Method | Endpoint                    | Description                        |
| ------ | --------------------------- | ---------------------------------- |
| POST   | `/api/auth/register`        | Create account (returns JWT)       |
| POST   | `/api/auth/login`           | Login (returns JWT)                |
| GET    | `/api/auth/me`              | Current user (auth required)       |
| PUT    | `/api/users/me`             | Update profile                     |
| PUT    | `/api/users/me/skills`      | Replace skill-mastery list         |
| CRUD   | `/api/projects[/:id]`       | Projects                           |
| CRUD   | `/api/courses[/:id]`        | Courses / roadmaps                 |
| CRUD   | `/api/tasks[/:id]`          | Tasks (+ filters via querystring)  |
| PATCH  | `/api/tasks/reorder`        | Kanban bulk status/position update |
| GET    | `/api/analytics`            | Dashboard metrics + chart series   |

## Package the repo

```bash
npm run package        # -> DevTask.zip (excludes node_modules, dist, .env, .git)
```

## Deploying (full stack)

The API doubles as the frontend host in production: Express serves `client/dist`
statically and falls back to `index.html` for SPA routes, so **one service + one
database** is all you need.

### Option A — one click on Render (blueprint included)

1. Push this repository to GitHub.
2. In [Render](https://render.com): **New → Blueprint**, pick the repo.
   The bundled `render.yaml` provisions:
   - **Web service** (Node, free plan) — build: install + prisma generate + client build,
     start: `prisma migrate deploy` + boot, health check on `/api/health`
   - **PostgreSQL** database with `DATABASE_URL` wired automatically
   - Auto-generated `JWT_SECRET`, `NODE_ENV=production`, `AUTO_SEED=true`
3. On first boot the server migrates the schema and (since the DB is empty)
   seeds the demo account (`demo@dev.io` / `password123`).

> Render's free Postgres expires after 30 days. For a durable free database,
> create one at [Neon](https://neon.tech) or [Supabase](https://supabase.com),
> then point the web service's `DATABASE_URL` at its connection string
> (append `?sslmode=require`) and set AUTO_SEED=true once.

### Option B — any Node host / VPS

```bash
npm install
npx prisma generate --schema=prisma/schema.prisma
npm run build -w client            # outputs client/dist
DATABASE_URL="postgres://…" \
JWT_SECRET="long-random-secret"    \
NODE_ENV=production                \
npm run start                      # migrate deploy + serve app+API on $PORT
```

Environment variables for production:

| Variable      | Required | Notes                                        |
| ------------- | -------- | -------------------------------------------- |
| `DATABASE_URL`| yes      | Postgres connection string                   |
| `JWT_SECRET`  | yes      | Long random string (`openssl rand -hex 48`)  |
| `NODE_ENV`    | –        | `production`                                 |
| `PORT`        | –        | Defaults to 5000 (hosts usually inject it)   |
| `AUTO_SEED`   | –        | `true` seeds demo data only if DB is empty   |

## License

MIT
