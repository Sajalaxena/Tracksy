const { Router } = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/User');

const router = Router();

// POST /api/auth/signup
// Requirements: 1.1–1.6
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email — requirement 1.4
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    // Validate password length — requirement 1.5
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check for existing user — requirement 1.3
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password — requirement 1.2
    const hashedPassword = await bcrypt.hash(password, 12);

    // Save new user — requirement 1.2
    const user = new User({ email, password: hashedPassword });
    await user.save();

    // Sign JWT — requirement 1.6
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return 201 with token and user info — requirement 1.6
    return res.status(201).json({
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
// Requirements: 2.1–2.5
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email — requirement 2.3
    const user = await User.findOne({ email: email ? email.toLowerCase().trim() : '' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare password — requirement 2.4
    const match = await bcrypt.compare(password || '', user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Sign JWT — requirement 2.5
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return 200 with token and user info — requirement 2.2
    return res.status(200).json({
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
