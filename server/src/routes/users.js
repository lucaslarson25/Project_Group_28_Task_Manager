const express = require('express');
const db = require('../db');

const router = express.Router();

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, created_at FROM users ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const name = normalizeString(req.body.name);
    const email = normalizeString(req.body.email);

    if (!name) {
      return res.status(400).json({ message: 'A name is required' });
    }
    if (!email) {
      return res.status(400).json({ message: 'An email is required' });
    }

    const result = await db.query(
      `INSERT INTO users (name, email)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, email, created_at`,
      [name, email.toLowerCase()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
