# TeamSync
### Smart Team Collaboration and Project Management Platform

TeamSync is a full-stack **MERN** application that helps student and developer teams organize projects, assign tasks, track progress on a drag-and-drop Kanban board, collaborate through comments and activity feeds, and measure productivity with analytics.

**Tech stack:** MongoDB · Express.js · React (Vite) · Node.js · JWT · bcrypt · Tailwind CSS · Recharts · Lucide icons

---

## 🔑 Demo login

| Email | Password |
|---|---|
| **demo@teamsync.com** | **demo123** |

Other seeded teammates (same password `demo123`): `priya@`, `rahul@`, `sneha@`, `karthik@`, `ananya@` — all `@teamsync.com`.

The login page also has a **"Continue with demo account"** button.

---

## 🚀 Quick start

**Prerequisites:** Node.js 18+ and npm. MongoDB is optional (see Option B).

```bash
# 1. Open the TeamSync folder in VS Code, then in the terminal:
npm run install-all
```

### Option A — with MongoDB (local or Atlas)

1. Make sure MongoDB is running locally (`mongodb://127.0.0.1:27017`) **or** put your Atlas connection string in `server/.env` as `MONGO_URI`.
2. Start both servers:
   ```bash
   npm run dev
   ```
3. Open **http://localhost:5173**

On the first start the database is empty, so demo data is **seeded automatically**. To reset the demo data at any time:
```bash
npm run seed
```

### Option B — no MongoDB installed (in-memory database)

```bash
npm run demo
```
This starts a temporary in-memory MongoDB (the binary is downloaded once on first run, ~100 MB, needs internet), seeds it, and launches the app. Data resets each time you restart — perfect for a presentation.

| Service | URL |
|---|---|
| Frontend (React) | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| Health check | http://localhost:5000/api/health |

---

## ✨ Features

**Authentication** — register, login, logout, bcrypt password hashing, JWT tokens, protected routes, profile editing, password change.

**Dashboard** — personalized greeting, total projects / tasks / completed / pending / overdue cards, 7-day productivity chart, task-status donut, upcoming deadlines, recent activity, project progress.

**Projects** — create, edit, delete (cascades tasks/comments/activity), description, deadline, status, color, owner, members, automatic progress %.

**Tasks** — create, edit, delete, assign to project members, Low/Medium/High priority, Todo/In Progress/Done status, due dates, descriptions, search, filters (project, status, priority, assignee, overdue), sorting, quick-complete checkbox.

**Kanban board** — three columns, native drag-and-drop; every move is saved to MongoDB via `PATCH /api/tasks/:id/status` with an optimistic UI update.

**Team collaboration** — invite existing users by email or invite new people (account created with temporary password `Welcome@123`), member detail view with workload, team activity feed, task comments.

**Analytics** — project completion %, tasks completed over time (7/14/30 days), status distribution, priority distribution, team workload, average completion time.

**Extras** — notification panel (assignments, comments, status changes), global search with `Ctrl + K`, dark/light mode, responsive sidebar, toast notifications, skeleton loading states, empty states, client + server form validation, confirmation dialogs.

---

## 🗂️ Project structure

```
TeamSync/
├── package.json              # root scripts: install-all, dev, demo, seed
├── server/                   # Express + MongoDB REST API
│   ├── server.js             # bootstrap: DB connect, auto-seed, listen
│   ├── app.js                # Express app: middleware + routes
│   ├── config/db.js          # Mongo connection (normal or in-memory)
│   ├── models/               # User, Project, Task, Comment, Notification, Activity
│   ├── controllers/          # auth, project, task, user, dashboard, misc
│   ├── routes/               # auth, project, task, user, insight routes
│   ├── middleware/           # auth (JWT), validate, error handler
│   ├── utils/helpers.js      # access control, stats, activity/notification helpers
│   ├── seed/                 # seedData.js + seed.js script
│   └── .env                  # environment variables
└── client/                   # React + Vite + Tailwind frontend
    └── src/
        ├── api/axios.js      # axios instance with JWT interceptor
        ├── context/          # Auth, Theme, Toast, Confirm providers
        ├── hooks/            # useApi, useTaskActions
        ├── components/       # Layout, KanbanBoard, TaskDrawer, modals, charts, UI kit
        ├── pages/            # Login, Register, Dashboard, Projects, ProjectDetail,
        │                     # Tasks, Board, Team, Analytics, Profile, NotFound
        └── lib/utils.js      # formatting + constants
```

---

## 🧩 Database design

Six separate collections with references (not one big collection):

```
User ─┬─< Project (owner)          Project >─< User (members[])
      ├─< Task (assignee, createdBy) Task >── Project
      ├─< Comment (author)          Comment >── Task
      ├─< Notification (user, actor)
      └─< Activity (user)           Activity >── Project
```

| Model | Key fields |
|---|---|
| **User** | name, email (unique), password (bcrypt, hidden), role, bio, avatarColor |
| **Project** | name, description, status, deadline, color, owner → User, members → [User] |
| **Task** | title, description, project → Project, assignee → User, createdBy → User, priority, status, dueDate, order, completedAt |
| **Comment** | task → Task, author → User, text |
| **Notification** | user → User, actor → User, type, message, link, read |
| **Activity** | user → User, project → Project, action, entityType, entityId, message |

Access control: a user can only see projects they own or are a member of, and only tasks inside those projects.

---

## 📡 REST API

All routes except register/login/health require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in, returns JWT |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/password` | Change password |
| GET | `/api/projects` | My projects with progress |
| POST | `/api/projects` | Create project |
| GET/PUT/DELETE | `/api/projects/:id` | Read / update / delete project |
| POST | `/api/projects/:id/members` | Add or invite a member |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |
| GET | `/api/tasks?project=&status=&priority=&assignee=&search=&overdue=&sort=` | Search & filter tasks |
| POST | `/api/tasks` | Create task |
| GET/PUT/DELETE | `/api/tasks/:id` | Read / update / delete task |
| PATCH | `/api/tasks/:id/status` | Move task (Kanban) |
| GET/POST | `/api/tasks/:id/comments` | List / add comments |
| DELETE | `/api/tasks/:id/comments/:commentId` | Delete own comment |
| GET | `/api/users` · `/api/users/team` · `/api/users/:id` | Directory, team with stats, member detail |
| GET | `/api/dashboard` | Dashboard stats |
| GET | `/api/analytics?days=30` | Analytics data |
| GET | `/api/notifications` | Notifications + unread count |
| PATCH | `/api/notifications/:id/read` · `/api/notifications/read-all` | Mark read |
| GET | `/api/activity?project=&limit=` | Activity feed |
| GET | `/api/search?q=` | Global search |

---

## 🎤 Suggested demo flow (5 minutes)

1. **Login page** → click *Continue with demo account*.
2. **Dashboard** → walk through stat cards, productivity chart, upcoming deadlines (point out the overdue task), activity feed.
3. **Kanban Board** → drag *"Build shopping cart with React Context"* to **Done** → toast appears, refresh the page to show it was saved in MongoDB.
4. Click a card → **task drawer**: change status, add a comment.
5. **Projects** → create a new project with a couple of members → add a task to it.
6. **Project detail → Members** → invite `newuser@example.com` with a name.
7. **Tasks** → search "API", filter by *High* priority, toggle *Overdue only*.
8. **Analytics** → switch 7 / 14 / 30 days.
9. **Notification bell** → open a notification, it jumps to the task.
10. Toggle **dark mode**, press **Ctrl + K** for global search.

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---|---|
| `Failed to start server … ECONNREFUSED 127.0.0.1:27017` | MongoDB isn't running. Start it, use an Atlas URI in `server/.env`, or run `npm run demo`. |
| "Cannot reach the server" toast in the browser | The backend isn't running on port 5000 — check the `API` terminal output. |
| Port 5000 in use (common on macOS AirPlay) | Change `PORT` in `server/.env` **and** the proxy target in `client/vite.config.js`. |
| Want fresh demo data | `npm run seed` (Option A) or just restart `npm run demo` (Option B). |
| Login fails after reseeding | Log out / clear the browser's localStorage, then log in again. |

---

## 🔒 Security notes

- Passwords hashed with bcrypt (10 salt rounds) via `bcryptjs`, never returned by the API.
- Stateless JWT authentication with expiry (`JWT_EXPIRES_IN`).
- Server-side validation with `express-validator` on every write endpoint, plus Mongoose schema validation.
- Authorization checks on every project/task route (members only; owner-only delete & member removal).
- Centralized error handler that converts Mongoose/JWT errors into clean JSON responses.

For production: set a strong `JWT_SECRET`, set `NODE_ENV=production`, and don't commit `server/.env`.
