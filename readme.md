# Task Manager

Prototype PERN stack task manager that exposes a REST API for task CRUD operations and a lightweight React dashboard for creating and visualising work.

## Tech Stack
- **Backend:** Node.js, Express, `pg`, `cors`, `dotenv`
- **Frontend:** React, Vite, Fetch API
- **Database:** PostgreSQL (provide your own instance)

## Getting Started

### Backend (Express API)
1. `cd server`
2. `npm install`
3. Copy `.env.example` to `.env` and set:
   - `DATABASE_URL` (or the standard `PGHOST`, `PGUSER`, etc.)
   - `CLIENT_ORIGIN` (comma-separated list of allowed React origins)
   - `PORT` (defaults to `4000`)
4. Ensure the `tasks` table exists:
   ```sql
   CREATE TABLE IF NOT EXISTS tasks (
     id SERIAL PRIMARY KEY,
     title TEXT NOT NULL,
     description TEXT NOT NULL DEFAULT '',
     status TEXT NOT NULL DEFAULT 'open',
     priority TEXT NOT NULL DEFAULT 'normal',
     due_date DATE NULL,
     assigned_to TEXT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   ```
   > Trigger(s) for `updated_at` are optional; the API updates this column automatically.
5. Run `npm run dev` for a hot-reload server or `npm start` for production mode.

API endpoints live under `/api`:

| Method | Endpoint         | Description                  |
|--------|------------------|------------------------------|
| GET    | `/api/health`    | Basic heartbeat check        |
| GET    | `/api/tasks`     | List tasks ordered by due date|
| GET    | `/api/tasks/:id` | Retrieve a specific task     |
| POST   | `/api/tasks`     | Create a task                |
| PUT    | `/api/tasks/:id` | Update a task                |
| DELETE | `/api/tasks/:id` | Delete a task                |

### Frontend (React)
1. `cd client`
2. `npm install`
3. Create a `.env` file (optional) and set `VITE_API_URL=http://localhost:4000/api` if your API lives elsewhere.
4. `npm run dev` starts Vite on port `5173` (default) and the UI automatically talks to the backend via the configured API URL.
   - `npm run build` will emit a production build under `client/dist/`. Vite currently warns when running on Node `<20.19`, but builds still succeed on Node `20.18`.

The UI currently supports:
- Creating tasks with title, description, due date, priority, status, and assignee.
- Displaying tasks with live counts.
- Marking tasks as complete and deleting tasks (uses the update/delete API routes).

## Folder Structure
```
taskManager/
  server/   # Express API
  client/   # React dashboard
```
