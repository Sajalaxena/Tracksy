const express = require('express');
const HabitRecord = require('../models/HabitRecord');

const router = express.Router();

// GET /api/habits?month=YYYY-MM
// Returns all HabitRecords for the authenticated user for the given month.
router.get('/', async (req, res, next) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ error: 'month query parameter is required' });
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'month must be in YYYY-MM format' });
    }

    const records = await HabitRecord.find({ userId: req.userId, month });
    return res.status(200).json(records);
  } catch (err) {
    next(err);
  }
});

// POST /api/habits
// Creates a new HabitRecord for the authenticated user.
router.post('/', async (req, res, next) => {
  try {
    const { name, type, month } = req.body;

    // Validate name
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }

    // Validate type
    if (!['boolean', 'numeric'].includes(type)) {
      return res.status(400).json({ error: 'type must be boolean or numeric' });
    }

    // Validate month format
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'month must be in YYYY-MM format' });
    }

    const record = new HabitRecord({
      userId: req.userId,
      name: name.trim(),
      type,
      month,
    });

    await record.save();
    return res.status(201).json(record);
  } catch (err) {
    // Mongoose duplicate-key error
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A habit with this name already exists for this month' });
    }
    next(err);
  }
});

// PATCH /api/habits/:id
// Updates a single day's value in the HabitRecord's data map.
router.patch('/:id', async (req, res, next) => {
  try {
    const record = await HabitRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ error: 'Habit record not found' });
    }

    if (record.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { day, value } = req.body;

    // Validate day: must be a string matching a whole integer in range 1–31
    // Reject floats like "1.5", leading zeros, and non-numeric strings
    if (typeof day !== 'string' || !/^\d+$/.test(day)) {
      return res.status(400).json({ error: 'day must be a string integer between 1 and 31' });
    }

    const dayInt = parseInt(day, 10);
    if (!Number.isInteger(dayInt) || dayInt < 1 || dayInt > 31) {
      return res.status(400).json({ error: 'day must be a string integer between 1 and 31' });
    }

    record.data.set(day, value);
    record.markModified('data');
    await record.save();

    return res.status(200).json(record);
  } catch (err) {
    next(err);
  }
});

// PUT /api/habits/:id/rename
// Renames a habit (updates the name field).
router.put('/:id/rename', async (req, res, next) => {
  try {
    const record = await HabitRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ error: 'Habit record not found' });
    }

    if (record.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }

    record.name = name.trim();
    await record.save();

    return res.status(200).json(record);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A habit with this name already exists for this month' });
    }
    next(err);
  }
});

// DELETE /api/habits/:id
// Deletes a HabitRecord.
router.delete('/:id', async (req, res, next) => {
  try {
    const record = await HabitRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ error: 'Habit record not found' });
    }

    if (record.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await record.deleteOne();
    return res.status(200).json({ message: 'Habit deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
