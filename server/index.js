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

// Lightweight, unauthenticated health check — safe target for an external
// keep-alive/cron ping on free hosting tiers that spin the server down
// after a period of inactivity.
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', dbState: mongoose.connection.readyState });
});

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

// Log connection issues instead of letting them surface as unhandled
// errors — mongoose retries/reconnects on its own, so a transient drop
// (idle timeout, network blip) shouldn't take the whole process down.
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected — mongoose will attempt to reconnect');
});
mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// A promise rejection or thrown error that escapes every try/catch should
// not silently crash the process without a trace — log it so the cause is
// visible in the host's logs, then exit so the platform can restart clean.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

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
