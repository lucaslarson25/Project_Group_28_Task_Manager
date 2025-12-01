const express = require('express');
const db = require('../db');

const router = express.Router();

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const toNullableDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseId = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const allowedStatuses = ['open', 'in_progress', 'completed'];
const allowedPriorities = ['low', 'normal', 'high'];
const allowedSortOptions = ['due_date', 'priority', 'user'];

const baseTaskSelect = `
  SELECT
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.due_date,
    t.assigned_to,
    t.assigned_user,
    t.created_at,
    t.updated_at,
    u.name AS assigned_user_name,
    u.email AS assigned_user_email
  FROM tasks t
  LEFT JOIN users u ON t.assigned_user = u.id
`;

const mapDbTask = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  status: row.status,
  priority: row.priority,
  dueDate: row.due_date,
  assignedTo: row.assigned_to || null,
  assignedUserId: row.assigned_user,
  assignedUser: row.assigned_user
    ? { id: row.assigned_user, name: row.assigned_user_name, email: row.assigned_user_email }
    : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const fetchTaskById = async (id) => {
  const result = await db.query(
    `${baseTaskSelect}
     WHERE t.id = $1`,
    [id]
  );
  return result.rows[0] ? mapDbTask(result.rows[0]) : null;
};

router.get('/', async (req, res, next) => {
  try {
    const { status, priority, assigned_to, due_before, due_after, sort } = req.query;
    const filters = [];
    const values = [];

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status filter' });
      }
      filters.push(`t.status = $${values.length + 1}`);
      values.push(status);
    }

    if (priority) {
      if (!allowedPriorities.includes(priority)) {
        return res.status(400).json({ message: 'Invalid priority filter' });
      }
      filters.push(`t.priority = $${values.length + 1}`);
      values.push(priority);
    }

    if (assigned_to !== undefined && assigned_to !== '') {
      const userId = parseId(assigned_to);
      if (!userId) {
        return res.status(400).json({ message: 'assigned_to must be a valid user id' });
      }
      filters.push(`t.assigned_user = $${values.length + 1}`);
      values.push(userId);
    }

    if (due_before) {
      const parsed = toNullableDate(due_before);
      if (!parsed) return res.status(400).json({ message: 'Invalid due_before date supplied' });
      filters.push(`t.due_date <= $${values.length + 1}`);
      values.push(parsed);
    }

    if (due_after) {
      const parsed = toNullableDate(due_after);
      if (!parsed) return res.status(400).json({ message: 'Invalid due_after date supplied' });
      filters.push(`t.due_date >= $${values.length + 1}`);
      values.push(parsed);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    let orderBy = `
      ORDER BY
        CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
        t.due_date ASC,
        t.created_at DESC
    `;

    if (sort && allowedSortOptions.includes(sort)) {
      switch (sort) {
        case 'priority':
          orderBy = `
            ORDER BY
              CASE t.priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
              CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
              t.due_date ASC,
              t.created_at DESC
          `;
          break;
        case 'user':
          orderBy = `
            ORDER BY
              (u.name IS NULL) ASC,
              u.name ASC,
              CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
              t.due_date ASC,
              t.created_at DESC
          `;
          break;
        default:
          orderBy = `
            ORDER BY
              CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
              t.due_date ASC,
              t.created_at DESC
          `;
      }
    }

    const sql = `${baseTaskSelect} ${whereClause} ${orderBy}`;
    const result = await db.query(sql, values);
    res.json(result.rows.map(mapDbTask));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await fetchTaskById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo, assignedUserId } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ message: 'A task title is required' });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status supplied' });
    }

    if (priority && !allowedPriorities.includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority supplied' });
    }

    if (dueDate && !toNullableDate(dueDate)) {
      return res.status(400).json({ message: 'Invalid due date supplied' });
    }

    const parsedUserId =
      assignedUserId === null || assignedUserId === undefined ? null : parseId(assignedUserId);
    if (assignedUserId !== undefined && assignedUserId !== null && !parsedUserId) {
      return res.status(400).json({ message: 'assignedUserId must be a valid user id' });
    }

    const result = await db.query(
      `INSERT INTO tasks (title, description, status, priority, due_date, assigned_to, assigned_user)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        title.trim(),
        normalizeString(description),
        status || 'open',
        priority || 'normal',
        toNullableDate(dueDate),
        normalizeString(assignedTo) || null,
        parsedUserId,
      ]
    );

    const createdTask = await fetchTaskById(result.rows[0].id);
    res.status(201).json(createdTask);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, assignedTo, assignedUserId } = req.body;

    const updates = [];
    const values = [];
    const pushUpdate = (column, value) => {
      updates.push(`${column} = $${updates.length + 1}`);
      values.push(value);
    };

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: 'Updated title must be a non-empty string' });
      }
      pushUpdate('title', title.trim());
    }

    if (description !== undefined) {
      pushUpdate('description', normalizeString(description));
    }

    if (status !== undefined) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status supplied' });
      }
      pushUpdate('status', status);
    }

    if (priority !== undefined) {
      if (!allowedPriorities.includes(priority)) {
        return res.status(400).json({ message: 'Invalid priority supplied' });
      }
      pushUpdate('priority', priority);
    }

    if (dueDate !== undefined) {
      if (dueDate && !toNullableDate(dueDate)) {
        return res.status(400).json({ message: 'Invalid due date supplied' });
      }
      pushUpdate('due_date', toNullableDate(dueDate));
    }
    if (assignedTo !== undefined) pushUpdate('assigned_to', normalizeString(assignedTo) || null);

    if (assignedUserId !== undefined) {
      const parsedUserId = assignedUserId === null ? null : parseId(assignedUserId);
      if (assignedUserId !== null && !parsedUserId) {
        return res.status(400).json({ message: 'assignedUserId must be a valid user id' });
      }
      pushUpdate('assigned_user', parsedUserId);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    values.push(id);
    const updateSql = `
      UPDATE tasks
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING id`;

    const result = await db.query(updateSql, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updated = await fetchTaskById(result.rows[0].id);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM tasks WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:id/assign', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedUserId, status } = req.body;

    const updates = [];
    const values = [];
    const pushUpdate = (column, value) => {
      updates.push(`${column} = $${updates.length + 1}`);
      values.push(value);
    };

    if (assignedUserId !== undefined) {
      const parsedUserId = assignedUserId === null ? null : parseId(assignedUserId);
      if (assignedUserId !== null && !parsedUserId) {
        return res.status(400).json({ message: 'assignedUserId must be a valid user id' });
      }
      pushUpdate('assigned_user', parsedUserId);
    }

    if (status !== undefined) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status supplied' });
      }
      pushUpdate('status', status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    values.push(id);

    const updateSql = `
      UPDATE tasks
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING id`;

    const result = await db.query(updateSql, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updated = await fetchTaskById(result.rows[0].id);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
