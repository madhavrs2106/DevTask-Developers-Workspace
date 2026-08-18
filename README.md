# DevTask — Developers' Workspace

Full-stack developer productivity suite: kanban task board, study roadmaps, analytics dashboard, and streak tracking. React (Vite + Tailwind) frontend, Node/Express + Prisma (SQLite) backend.

![Version](https://img.shields.io/badge/version-1.0.0-7AA2F7) ![React](https://img.shields.io/badge/React-18-61DAFB) ![Vite](https://img.shields.io/badge/Vite-5-646CFF) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38BDF8) ![Express](https://img.shields.io/badge/Express-4-7DCFFF) ![Prisma](https://img.shields.io/badge/Prisma-5-5B8DEF)

## Features

- **Auth** — register, login, JWT sessions, profile editing, password change, account deletion. Accounts are restricted to `@devtask.io` email addresses.
- **Streak tracking** — consecutive daily activity counter shown in the header and on your profile
- **Learning Space** — task kanban columns (To Do / In Progress / In Review / Done), create/edit/delete tasks, drag-and-drop between columns, tech-stack tags, GitHub links, code snippets
- **Project Space** — project kanban board with the same workflow (create/edit/delete, drag-and-drop, tech-stack tags, repo links, snippets)
- **Roadmaps & Courses** — track study courses with status and progress
- **Analytics Dashboard** — 7-day coding intensity, task distribution, sprint velocity, skill mastery
- **Developer Profile** — read-only profile card with photo, social links, and streak
- **Settings** — profile photo upload/removal, social links (GitHub, LinkedIn, etc.), theme toggle, password change, account deletion
- **AI endpoint** — optional OpenAI-backed `/api/ai/chat` backend route (no UI)
- **Dark / light theme** with persistence (Tokyo Night palette)

## Tech stack

| Layer    | Tech                                                        |
|----------|-------------------------------------------------------------|
| Frontend | React 18, Vite 5, Tailwind CSS 3, Recharts, lucide-react   |
| Backend  | Node.js, Express 4, Prisma 5, Supabase (Postgres), JWT     |
| Assets   | multer (profile photo upload), bcryptjs (password hashing) |

## Project structure

```
DevTask/
├── client/            # React + Vite + Tailwind frontend
│   ├── public/           # static assets (logo)
│   └── src/
│       ├── components/   # Sidebar, Header
│       ├── context/      # AuthContext
│       └── pages/        # Dashboard, TaskBoard, Courses, Profile, Settings, Login, Signup
└── server/            # Express + Prisma backend
    ├── prisma/           # schema.prisma (tables live in Supabase Postgres)
    ├── uploads/          # uploaded profile photos (runtime, gitignored)
    └── src/
        ├── controllers/  # auth, tasks, courses, analytics, socials, ai
        ├── middleware/   # JWT auth (+ activity/streak logging)
        └── routes/       # /api routes
```

## Requirements

- Node.js 18+
- A Supabase project (free tier). Get your connection string from Supabase → Project Settings → Database → Connection string (URI, "Session pooler").

## Setup

```bash
# 1. Install dependencies (root, server, client)
npm run install-all

# 2. Configure the database connection
# Copy server/.env.example to server/.env and paste your Supabase
# connection string into DATABASE_URL (see comments in the file).

# 3. Create the tables & generate Prisma client
cd server
npx prisma db push
npx prisma generate
cd ..
```

### Email restriction

Registration and login only accept `@devtask.io` email addresses (enforced on both the client and the server). Use e.g. `yourname@devtask.io` when testing.

## Run

```bash
npm run dev        # starts client (:3000) and server (:5000) together
```

- Frontend: http://localhost:3000 (Vite proxies `/api` to :5000)
- Backend: http://localhost:5000
- Prisma Studio: `cd server && npm run db:studio`

## Environment variables (`server/.env`)

| Variable        | Required | Description                                              |
|-----------------|----------|----------------------------------------------------------|
| `PORT`          | no       | Server port (default `5000`)                             |
| `DATABASE_URL`  | yes      | Supabase Postgres connection string (e.g. `postgresql://postgres.<ref>:<password>@...pooler.supabase.com:5432/postgres?pgbouncer=true`) |
| `JWT_SECRET`    | no       | JWT signing secret (has a dev default)                   |
| `OPENAI_API_KEY`| no       | Enables real AI replies on `/api/ai/chat`                |
| `AI_MODEL`      | no       | OpenAI model (default `gpt-4o-mini`)                     |

## API overview

| Method | Endpoint              | Auth | Description                     |
|--------|-----------------------|------|---------------------------------|
| POST   | /api/auth/register    | no   | Create account (@devtask.io only)|
| POST   | /api/auth/login       | no   | Login                           |
| GET    | /api/auth/me          | yes  | Current user (incl. streak)     |
| PUT    | /api/auth/profile     | yes  | Update name/title               |
| PUT    | /api/auth/password    | yes  | Change password                 |
| POST   | /api/auth/avatar      | yes  | Upload profile photo (multipart)|
| DELETE | /api/auth/avatar      | yes  | Remove profile photo            |
| DELETE | /api/auth/account     | yes  | Delete account + all data       |
| GET    | /api/tasks            | yes  | List tasks                      |
| POST   | /api/tasks            | yes  | Create task                     |
| PUT    | /api/tasks/:id        | yes  | Update task                     |
| DELETE | /api/tasks/:id        | yes  | Delete task                     |
| GET    | /api/projects         | yes  | List projects                   |
| POST   | /api/projects         | yes  | Create project                  |
| PUT    | /api/projects/:id     | yes  | Update project                  |
| DELETE | /api/projects/:id     | yes  | Delete project                  |
| GET    | /api/courses          | yes  | List courses                    |
| POST   | /api/courses          | yes  | Create course                   |
| PUT    | /api/courses/:id      | yes  | Update course                   |
| DELETE | /api/courses/:id      | yes  | Delete course                   |
| GET    | /api/analytics        | yes  | Dashboard telemetry             |
| GET    | /api/socials          | yes  | List social links               |
| POST   | /api/socials          | yes  | Add social link                 |
| DELETE | /api/socials/:id      | yes  | Remove social link              |
| POST   | /api/ai/chat          | yes  | AI assistant chat (optional key)|

## Packaging

```bash
npm run zip   # creates DevTask.zip (excludes node_modules, dist, db, .env, uploads)
```

## License

This project is for personal/portfolio use. No license is granted without permission.
