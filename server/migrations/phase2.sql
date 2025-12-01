-- Phase 2 migration for taskManager
-- Idempotent: creates/aligns tables and constraints without dropping existing data.

-- Ensure users table exists with required columns.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add id column/sequence/PK if missing (legacy tables).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'id'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'users_id_seq') THEN
      CREATE SEQUENCE users_id_seq;
    END IF;
    ALTER TABLE users ADD COLUMN id INTEGER;
    UPDATE users SET id = nextval('users_id_seq');
    ALTER TABLE users ALTER COLUMN id SET NOT NULL;
    ALTER TABLE users ADD PRIMARY KEY (id);
    ALTER SEQUENCE users_id_seq OWNED BY users.id;
    ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval('users_id_seq');
  END IF;
END$$;

-- Clean duplicates/blank emails so we can add a unique constraint.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
    DELETE FROM users u
    USING (
      SELECT ctid, ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn
      FROM users
    ) d
    WHERE u.ctid = d.ctid AND d.rn > 1;

    DELETE FROM users WHERE email IS NULL OR TRIM(email) = '';
  END IF;
END$$;

-- Add unique constraint on email if missing.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key') THEN
    ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
END$$;

-- Seed collaborators; ON CONFLICT works once the unique constraint exists.
INSERT INTO users (name, email)
VALUES
  ('Alex Johnson', 'alex@example.com'),
  ('Priya Patel', 'priya@example.com'),
  ('Sam Lee', 'sam@example.com')
ON CONFLICT (email) DO NOTHING;

-- Ensure tasks table exists (Phase 1 shape + assigned_user FK).
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  due_date DATE NULL,
  assigned_to TEXT NULL,
  assigned_user INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add assigned_user column if missing.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_user'
    ) THEN
      ALTER TABLE tasks ADD COLUMN assigned_user INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
  END IF;
END$$;

-- Normalise status values (guarded).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    UPDATE tasks SET status = 'open' WHERE status NOT IN ('open', 'in_progress', 'completed');
  END IF;
END$$;

-- Indexes to speed up filtering/sorting.
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user ON tasks(assigned_user);
