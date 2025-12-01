# Task Manager

Prototype PERN stack task manager that exposes a REST API for task CRUD operations and a lightweight React dashboard for creating and visualising work.

## Tech Stack
- **Backend:** Node.js, Express, `pg`, `cors`, `dotenv`
- **Frontend:** React, Vite, Fetch API, Recharts
- **Database:** PostgreSQL (provide your own instance)

## Phase 2 Highlights
- Task filtering & sorting (status, priority, assignee, due date; sort by due date, priority, assignee)
- User assignment flow with dropdowns, avatars, and `/tasks/:id/assign`
- Auto-refreshing task list so status changes appear in near real-time
- Analytics dashboard (summary + per-user stats) with charts and upcoming deadlines

## Getting Started

### Backend (Express API)
1. `cd server`
2. `npm install`
3. Copy `.env.example` to `.env` and set:
   - `DATABASE_URL` (or the standard `PGHOST`, `PGUSER`, etc.)
   - `CLIENT_ORIGIN` (comma-separated list of allowed React origins)
   - `PORT` (defaults to `4000`)
4. Run the Phase 2 migration to add `users` and the `assigned_user` foreign key plus indexes:
   ```bash
   psql "$DATABASE_URL" -f server/migrations/phase2.sql
   ```
   > The migration seeds three sample users, keeps the legacy `assigned_to` text column, and normalises statuses.
5. Run `npm run dev` for a hot-reload server or `npm start` for production mode.

API endpoints live under `/api`:

| Method | Endpoint         | Description                  |
|--------|------------------|------------------------------|
| GET    | `/api/health`    | Basic heartbeat check        |
| GET    | `/api/tasks`     | List tasks ordered by due date (supports filters/sorting) |
| GET    | `/api/tasks/:id` | Retrieve a specific task     |
| POST   | `/api/tasks`     | Create a task                |
| PUT    | `/api/tasks/:id` | Update a task                |
| POST   | `/api/tasks/:id/assign` | Assign/unassign a task and optionally update status |
| DELETE | `/api/tasks/:id` | Delete a task                |
| GET    | `/api/users`     | List users for dropdowns     |
| POST   | `/api/users`     | Create/update a user (by email) |
| GET    | `/api/analytics/summary` | Totals, completed, overdue, upcoming list |
| GET    | `/api/analytics/user/:id` | Per-user counts (assigned, completed, overdue) |

`GET /api/tasks` query parameters:
- `status=open|in_progress|completed`
- `priority=low|normal|high`
- `assigned_to=<user_id>`
- `due_before=<YYYY-MM-DD>`
- `due_after=<YYYY-MM-DD>`
- `sort=due_date|priority|user`

### Frontend (React)
1. `cd client`
2. `npm install`
3. Create a `.env` file (optional) and set `VITE_API_URL=http://localhost:4000/api` if your API lives elsewhere.
4. `npm run dev` starts Vite on port `5173` (default) and the UI automatically talks to the backend via the configured API URL. Install the new dependency (`recharts`) if you haven’t already: `npm install`.
   - `npm run build` will emit a production build under `client/dist/`. Vite currently warns when running on Node `<20.19`, but builds still succeed on Node `20.18`.

The UI now supports:
- Creating tasks with title, description, due date, priority, status, and assigned user selection.
- Filtering by status/priority/assignee, sorting by due date/priority/user, and auto-refreshing every 15s.
- Inline assignment and status changes per task, with avatars and metadata.
- Analytics dashboard showing totals, completion breakdown, overdue counts, upcoming deadlines, and per-user workload cards.

## Folder Structure
```
taskManager/
  server/   # Express API
  client/   # React dashboard
```
