// Feature: personal-habit-tracker
// Property-based tests for JWT, auth middleware, data isolation, and day key validation
// Properties 3, 4, 5, 7

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import fc from 'fast-check';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';

// ---------------------------------------------------------------------------
// App factory — builds a minimal Express app wired to the in-memory DB
// ---------------------------------------------------------------------------

let mongod;
let app;

// Import models and routes using dynamic require (CJS interop)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const authRouter = require('./auth');
const habitsRouter = require('./habits');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const HabitRecord = require('../models/HabitRecord');

const TEST_SECRET = 'test-secret-for-property-tests';

function buildApp() {
  const a = express();
  a.use(express.json());
  a.use('/api/auth', authRouter);
  a.use('/api/habits', authMiddleware, habitsRouter);
  a.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
  });
  return a;
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  process.env.JWT_SECRET = TEST_SECRET;
  app = buildApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  // Clean up between tests
  await User.deleteMany({});
  await HabitRecord.deleteMany({});
});

// ---------------------------------------------------------------------------
// Helper: sign a token with the test secret
// ---------------------------------------------------------------------------
function signToken(userId) {
  return jwt.sign({ userId }, TEST_SECRET, { expiresIn: '7d' });
}

// ---------------------------------------------------------------------------
// Helper: register a user and return { token, userId }
// ---------------------------------------------------------------------------
async function registerUser(email, password) {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email, password });
  return { token: res.body.token, userId: res.body.user?.id };
}

// ---------------------------------------------------------------------------
// Property 3: JWT round-trip identity
// Feature: personal-habit-tracker, Property 3
// Validates: Requirements 2.2, 1.6
// ---------------------------------------------------------------------------
describe('Property 3: JWT round-trip identity', () => {
  it('sign then verify always recovers the original userId', () => {
    // Use fc.string({ minLength: 1 }) to generate random userId strings
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 64 }),
        (userId) => {
          const token = jwt.sign({ userId }, TEST_SECRET, { expiresIn: '7d' });
          const payload = jwt.verify(token, TEST_SECRET);
          return payload.userId === userId;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Auth middleware rejects invalid tokens
// Feature: personal-habit-tracker, Property 4
// Validates: Requirements 3.1
// ---------------------------------------------------------------------------
describe('Property 4: Auth middleware rejects invalid tokens', () => {
  it('returns 401 for empty, random, or malformed Bearer tokens', async () => {
    // Generate invalid token strings
    const invalidTokenArb = fc.oneof(
      fc.constant(''),
      fc.string({ maxLength: 80 }),
      fc.constant('Bearer malformed'),
      fc.constant('notabearer token'),
      fc.constant('Bearer '),
    );

    await fc.assert(
      fc.asyncProperty(invalidTokenArb, async (badToken) => {
        const res = await request(app)
          .get('/api/habits?month=2025-07')
          .set('Authorization', badToken);
        return res.status === 401;
      }),
      { numRuns: 50 }
    );
  });

  it('returns 401 when Authorization header is absent', async () => {
    const res = await request(app).get('/api/habits?month=2025-07');
    expect(res.status).toBe(401);
  });

  it('returns 401 for a token signed with the wrong secret', async () => {
    const badToken = jwt.sign({ userId: 'abc' }, 'wrong-secret', { expiresIn: '7d' });
    const res = await request(app)
      .get('/api/habits?month=2025-07')
      .set('Authorization', `Bearer ${badToken}`);
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Property 5: Data isolation between users
// Feature: personal-habit-tracker, Property 5
// Validates: Requirements 3.2, 9.4
// ---------------------------------------------------------------------------
describe('Property 5: Data isolation between users', () => {
  it('GET /api/habits never returns records belonging to another user', async () => {
    // Register two users
    const { token: tokenA } = await registerUser('user-a@test.com', 'passwordA1');
    const { token: tokenB } = await registerUser('user-b@test.com', 'passwordB1');

    // User A creates a habit
    await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'User A Habit', type: 'boolean', month: '2025-07' });

    // User B creates a habit
    await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'User B Habit', type: 'boolean', month: '2025-07' });

    // User A's GET should only return User A's habit
    const resA = await request(app)
      .get('/api/habits?month=2025-07')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(resA.status).toBe(200);
    expect(resA.body.every((h) => h.name === 'User A Habit')).toBe(true);
    expect(resA.body.some((h) => h.name === 'User B Habit')).toBe(false);

    // User B's GET should only return User B's habit
    const resB = await request(app)
      .get('/api/habits?month=2025-07')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(resB.status).toBe(200);
    expect(resB.body.every((h) => h.name === 'User B Habit')).toBe(true);
    expect(resB.body.some((h) => h.name === 'User A Habit')).toBe(false);
  });

  it('PATCH /api/habits/:id returns 403 when user B tries to modify user A\'s record', async () => {
    const { token: tokenA } = await registerUser('owner@test.com', 'ownerPass1');
    const { token: tokenB } = await registerUser('attacker@test.com', 'attackPass1');

    // User A creates a habit
    const createRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Private Habit', type: 'boolean', month: '2025-07' });

    const habitId = createRes.body._id;

    // User B tries to PATCH it
    const patchRes = await request(app)
      .patch(`/api/habits/${habitId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ day: '1', value: true });

    expect(patchRes.status).toBe(403);
  });

  it('property: user A records are never visible to user B across random months', async () => {
    const { token: tokenA } = await registerUser('prop-a@test.com', 'propPassA1');
    const { token: tokenB } = await registerUser('prop-b@test.com', 'propPassB1');

    const monthArb = fc.tuple(
      fc.integer({ min: 2020, max: 2030 }),
      fc.integer({ min: 1, max: 12 })
    ).map(([y, m]) => `${y}-${String(m).padStart(2, '0')}`);

    await fc.assert(
      fc.asyncProperty(monthArb, async (month) => {
        // Create a habit for user A in this month
        await request(app)
          .post('/api/habits')
          .set('Authorization', `Bearer ${tokenA}`)
          .send({ name: `Habit-${month}`, type: 'boolean', month });

        // User B fetches the same month — should see 0 records
        const res = await request(app)
          .get(`/api/habits?month=${month}`)
          .set('Authorization', `Bearer ${tokenB}`);

        return res.status === 200 && res.body.length === 0;
      }),
      { numRuns: 20 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Day key range validation
// Feature: personal-habit-tracker, Property 7
// Validates: Requirements 9.5
// ---------------------------------------------------------------------------
describe('Property 7: Day key range validation', () => {
  it('PATCH returns 400 for day keys outside "1"–"31"', async () => {
    const { token } = await registerUser('daykey@test.com', 'dayKeyPass1');

    // Create a habit to patch
    const createRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Day Key Test', type: 'boolean', month: '2025-07' });

    const habitId = createRes.body._id;

    // Generate invalid day keys: "0", "32", negative numbers, non-numeric strings
    const invalidDayArb = fc.oneof(
      fc.constant('0'),
      fc.constant('32'),
      fc.constant('-1'),
      fc.constant('100'),
      fc.constant('abc'),
      fc.constant(''),
      fc.constant('1.5'),
      fc.integer({ min: 32, max: 1000 }).map(String),
      fc.integer({ min: -1000, max: 0 }).map(String),
    );

    await fc.assert(
      fc.asyncProperty(invalidDayArb, async (badDay) => {
        const res = await request(app)
          .patch(`/api/habits/${habitId}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ day: badDay, value: true });
        return res.status === 400;
      }),
      { numRuns: 50 }
    );
  });

  it('PATCH returns 200 for valid day keys "1"–"31" and data map is updated', async () => {
    const { token } = await registerUser('validday@test.com', 'validDayPass1');

    const createRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Valid Day Test', type: 'boolean', month: '2025-07' });

    const habitId = createRes.body._id;

    const validDayArb = fc.integer({ min: 1, max: 31 }).map(String);

    await fc.assert(
      fc.asyncProperty(validDayArb, async (day) => {
        const res = await request(app)
          .patch(`/api/habits/${habitId}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ day, value: true });
        return res.status === 200;
      }),
      { numRuns: 31 }
    );
  });
});
