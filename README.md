# DevTask — Midnight Neon Workspace

Full-stack developer productivity app: kanban task board, study roadmaps, analytics dashboard, and an AI copilot. React (Vite + Tailwind) frontend, Node/Express + Prisma (SQLite) backend.

## Features

- **Auth** — register, login, JWT sessions, profile editing, password change, account deletion
- **Task Board** — kanban columns (To Do / In Progress / In Review / Done), create/edit/delete tasks, drag-and-drop between columns, tech-stack tags, GitHub links, code snippets
- **Roadmaps & Courses** — track study courses with status and progress
- **Analytics Dashboard** — 7-day coding intensity, task distribution, velocity, skill mastery
- **Developer Profile** — profile photo upload, social links (GitHub, LinkedIn, etc.), theme toggle
- **Dark / light theme** with persistence (Tokyo Night palette)

## Project structure

```
DevTask/
├── client/            # React + Vite + Tailwind frontend
│   └── src/
│       ├── components/   # Sidebar, Header
│       ├── context/      # AuthContext
│       └── pages/        # Dashboard, TaskBoard, Courses, Profile, Login, Signup
└── server/            # Express + Prisma backend
    ├── prisma/           # schema.prisma + dev.db
    ├── uploads/          # uploaded profile photos (created at runtime)
    └── src/
        ├── controllers/  # auth, tasks, courses, analytics, socials
        ├── middleware/    # JWT auth
        └── routes/       # /api routes
```

## Setup

Requirements: Node.js 18+.

```bash
# 1. Install dependencies (root, server, client)
npm install
npm install --prefix server
npm install --prefix client

# 2. Generate Prisma client & create the database
cd server
npx prisma migrate dev --name init   # or: npx prisma db push
npx prisma generate
cd ..

# 3. Configure the server
# Copy server/.env.example to server/.env if it doesn't exist
# Set OPENAI_API_KEY in server/.env to enable real AI in Smart Hub (optional)
```

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
| `DATABASE_URL`  | yes      | Prisma connection string, e.g. `file:./dev.db`           |
| `JWT_SECRET`    | no       | JWT signing secret (has a dev default)                   |
| `OPENAI_API_KEY`| no       | Enables real AI replies in Smart Hub                     |
| `AI_MODEL`      | no       | OpenAI model (default `gpt-4o-mini`)                     |

## API overview

| Method | Endpoint              | Auth | Description                     |
|--------|-----------------------|------|---------------------------------|
| POST   | /api/auth/register    | no   | Create account                  |
| POST   | /api/auth/login       | no   | Login                           |
| GET    | /api/auth/me          | yes  | Current user                    |
| PUT    | /api/auth/profile     | yes  | Update name/title               |
| PUT    | /api/auth/password    | yes  | Change password                 |
| POST   | /api/auth/avatar      | yes  | Upload profile photo (multipart)|
| DELETE | /api/auth/avatar      | yes  | Remove profile photo            |
| DELETE | /api/auth/account     | yes  | Delete account + all data       |
| GET    | /api/tasks            | yes  | List tasks                      |
| POST   | /api/tasks            | yes  | Create task                     |
| PUT    | /api/tasks/:id        | yes  | Update task                     |
| DELETE | /api/tasks/:id        | yes  | Delete task                     |
| GET    | /api/courses          | yes  | List courses                    |
| POST   | /api/courses          | yes  | Create course                   |
| PUT    | /api/courses/:id      | yes  | Update course                   |
| DELETE | /api/courses/:id      | yes  | Delete course                   |
| GET    | /api/analytics        | yes  | Dashboard telemetry             |
| GET    | /api/socials          | yes  | List social links               |
| POST   | /api/socials          | yes  | Add social link                 |
| DELETE | /api/socials/:id      | yes  | Remove social link              |

## Packaging

```bash
npm run zip   # creates DevTask.zip (excludes node_modules, dist, db, .env)
```
