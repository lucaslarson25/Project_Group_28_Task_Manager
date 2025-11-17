const express = require('express');
const db = require('../db');

const router = express.Router();

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const toNullableDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const mapDbTask = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  status: row.status,
  priority: row.priority,
  dueDate: row.due_date,
  assignedTo: row.assigned_to,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, title, description, status, priority, due_date, assigned_to, created_at, updated_at
       FROM tasks
       ORDER BY
         CASE WHEN due_date IS NULL THEN 1 ELSE 0 END,
         due_date ASC,
         created_at DESC`
    );

    res.json(result.rows.map(mapDbTask));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT id, title, description, status, priority, due_date, assigned_to, created_at, updated_at
       FROM tasks WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(mapDbTask(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ message: 'A task title is required' });
    }

    if (dueDate && !toNullableDate(dueDate)) {
      return res.status(400).json({ message: 'Invalid due date supplied' });
    }

    const result = await db.query(
      `INSERT INTO tasks (title, description, status, priority, due_date, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, description, status, priority, due_date, assigned_to, created_at, updated_at`,
      [
        title.trim(),
        normalizeString(description),
        status || 'open',
        priority || 'normal',
        toNullableDate(dueDate),
        normalizeString(assignedTo) || null,
      ]
    );

    res.status(201).json(mapDbTask(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, assignedTo } = req.body;

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

    if (status !== undefined) pushUpdate('status', status);
    if (priority !== undefined) pushUpdate('priority', priority);
    if (dueDate !== undefined) {
      if (dueDate && !toNullableDate(dueDate)) {
        return res.status(400).json({ message: 'Invalid due date supplied' });
      }
      pushUpdate('due_date', toNullableDate(dueDate));
    }
    if (assignedTo !== undefined) pushUpdate('assigned_to', normalizeString(assignedTo) || null);

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    values.push(id);
    const updateSql = `
      UPDATE tasks
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING id, title, description, status, priority, due_date, assigned_to, created_at, updated_at`;

    const result = await db.query(updateSql, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(mapDbTask(result.rows[0]));
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

module.exports = router;
