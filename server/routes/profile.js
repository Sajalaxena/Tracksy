const { Router } = require('express');
const User = require('../models/User');

const router = Router();

// GET /api/profile - Get user profile
router.get('/', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('profile email createdAt');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      profile: user.profile || { displayName: '', bio: '', avatar: null },
      email: user.email,
      memberSince: user.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/profile - Update user profile
router.put('/', async (req, res, next) => {
  try {
    const { displayName, bio, avatar } = req.body;

    // Validate inputs
    if (displayName && displayName.length > 40) {
      return res.status(400).json({ error: 'Display name must be 40 characters or less' });
    }

    if (bio && bio.length > 160) {
      return res.status(400).json({ error: 'Bio must be 160 characters or less' });
    }

    // Build update object
    const updates = {};
    if (displayName !== undefined) updates['profile.displayName'] = displayName.trim();
    if (bio !== undefined) updates['profile.bio'] = bio.trim();
    if (avatar !== undefined) updates['profile.avatar'] = avatar;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('profile email');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      profile: user.profile,
      email: user.email,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
