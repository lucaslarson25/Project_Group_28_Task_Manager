const express = require('express');
const db = require('../db');

const router = express.Router();

const parseId = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const mapDbTask = (row) => ({
  id: row.id,
  title: row.title,
  status: row.status,
  priority: row.priority,
  dueDate: row.due_date,
  assignedUserId: row.assigned_user,
  assignedUser: row.assigned_user
    ? { id: row.assigned_user, name: row.assigned_user_name, email: row.assigned_user_email }
    : null,
});

router.get('/summary', async (req, res, next) => {
  try {
    const counts = await db.query(
      `SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE status = 'completed')::INT AS completed,
        COUNT(*) FILTER (WHERE status != 'completed')::INT AS open,
        COUNT(*) FILTER (
          WHERE status != 'completed'
          AND due_date IS NOT NULL
          AND due_date < CURRENT_DATE
        )::INT AS overdue
      FROM tasks`
    );

    const upcoming = await db.query(
      `SELECT
         t.id,
         t.title,
         t.status,
         t.priority,
         t.due_date,
         t.assigned_user,
         u.name AS assigned_user_name,
         u.email AS assigned_user_email
       FROM tasks t
       LEFT JOIN users u ON t.assigned_user = u.id
       WHERE t.due_date IS NOT NULL
         AND t.status != 'completed'
         AND t.due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')
       ORDER BY t.due_date ASC
       LIMIT 10`
    );

    const countsRow = counts.rows[0] || {};

    res.json({
      total: countsRow.total || 0,
      completed: countsRow.completed || 0,
      open: countsRow.open || 0,
      overdue: countsRow.overdue || 0,
      upcoming: upcoming.rows.map(mapDbTask),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/user/:id', async (req, res, next) => {
  try {
    const userId = parseId(req.params.id);
    if (!userId) {
      return res.status(400).json({ message: 'User id must be a positive integer' });
    }

    const userResult = await db.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const stats = await db.query(
      `SELECT
        COUNT(*)::INT AS assigned,
        COUNT(*) FILTER (WHERE status = 'completed')::INT AS completed,
        COUNT(*) FILTER (
          WHERE status != 'completed'
          AND due_date IS NOT NULL
          AND due_date < CURRENT_DATE
        )::INT AS overdue
      FROM tasks
      WHERE assigned_user = $1`,
      [userId]
    );

    res.json({
      user: userResult.rows[0],
      assigned: stats.rows[0].assigned || 0,
      completed: stats.rows[0].completed || 0,
      overdue: stats.rows[0].overdue || 0,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
