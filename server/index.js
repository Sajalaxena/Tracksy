require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const authRouter = require('./routes/auth');
const habitsRouter = require('./routes/habits');
const chatRouter = require('./routes/chat');
const profileRouter = require('./routes/profile');
const authMiddleware = require('./middleware/auth');

const app = express();

// Security middleware
// 1. Helmet - sets various HTTP headers for security
app.use(helmet());

// 2. Rate limiting - prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 3. Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login/signup attempts per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // don't count successful requests
});

// 4. NoSQL injection prevention
app.use(mongoSanitize());

// Global middleware
app.use(cors());
app.use(express.json({ limit: '10kb' })); // limit body size

// Routes with rate limiting
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/habits', authMiddleware, habitsRouter);
app.use('/api/chat', authMiddleware, chatRouter);
app.use('/api/profile', authMiddleware, profileRouter);

// Global error-handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

module.exports = app;
