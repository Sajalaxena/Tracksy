// Feature: personal-habit-tracker
// Integration tests for auth and habits routes
// Uses Supertest + MongoDB Memory Server

import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const authRouter = require('./auth');
const habitsRouter = require('./habits');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const HabitRecord = require('../models/HabitRecord');

const TEST_SECRET = 'integration-test-secret';

let mongod;
let app;

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
  await User.deleteMany({});
  await HabitRecord.deleteMany({});
});

// ---------------------------------------------------------------------------
// Auth routes — POST /api/auth/signup
// Requirements: 1.1–1.6
// ---------------------------------------------------------------------------
describe('POST /api/auth/signup', () => {
  it('201 + token on valid email and password ≥ 8 chars', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ email: 'alice@example.com' });
  });

  it('409 on duplicate email', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dup@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dup@example.com', password: 'password456' });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('400 on password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'short@example.com', password: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('400 on missing email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('400 on malformed email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// Auth routes — POST /api/auth/login
// Requirements: 2.1–2.5
// ---------------------------------------------------------------------------
describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    // Pre-register a user for login tests
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'login@example.com', password: 'loginPass1' });
  });

  it('200 + token on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'loginPass1' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ email: 'login@example.com' });
  });

  it('401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('401 on unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'loginPass1' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// Habits routes — GET /api/habits
// Requirements: 9.1, 9.2, 3.1, 3.2
// ---------------------------------------------------------------------------
describe('GET /api/habits', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'getter@example.com', password: 'getterPass1' });
    token = res.body.token;
  });

  it('200 with empty array when no habits exist for the month', async () => {
    const res = await request(app)
      .get('/api/habits?month=2025-07')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('200 returns only the authenticated user\'s habits', async () => {
    // Create a habit for this user
    await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Habit', type: 'boolean', month: '2025-07' });

    // Register another user and create their habit
    const res2 = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'other@example.com', password: 'otherPass1' });
    const otherToken = res2.body.token;

    await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Other Habit', type: 'boolean', month: '2025-07' });

    // Fetch as first user — should only see own habit
    const res = await request(app)
      .get('/api/habits?month=2025-07')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('My Habit');
  });

  it('400 when month param is missing', async () => {
    const res = await request(app)
      .get('/api/habits')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('400 when month param has invalid format', async () => {
    const res = await request(app)
      .get('/api/habits?month=July-2025')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('401 without auth token', async () => {
    const res = await request(app).get('/api/habits?month=2025-07');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Habits routes — POST /api/habits
// Requirements: 4.1–4.4
// ---------------------------------------------------------------------------
describe('POST /api/habits', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'creator@example.com', password: 'creatorPass1' });
    token = res.body.token;
  });

  it('201 with created document on valid request', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Exercise', type: 'boolean', month: '2025-07' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Exercise', type: 'boolean', month: '2025-07' });
    expect(res.body).toHaveProperty('_id');
  });

  it('409 on duplicate name + month for same user', async () => {
    await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Duplicate', type: 'boolean', month: '2025-08' });

    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Duplicate', type: 'boolean', month: '2025-08' });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('400 on invalid type', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bad Type', type: 'text', month: '2025-07' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('400 on missing name', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'boolean', month: '2025-07' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('400 on empty name (whitespace only)', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '   ', type: 'boolean', month: '2025-07' });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Habits routes — PATCH /api/habits/:id
// Requirements: 9.3–9.5, 3.1, 3.2
// ---------------------------------------------------------------------------
describe('PATCH /api/habits/:id', () => {
  let token;
  let habitId;

  beforeAll(async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'patcher@example.com', password: 'patcherPass1' });
    token = signupRes.body.token;
  });

  // Re-create the habit before each test since afterEach clears the DB
  beforeEach(async () => {
    // Ensure the user exists (re-signup if needed after afterEach cleanup)
    let signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'patcher@example.com', password: 'patcherPass1' });

    if (signupRes.status === 409) {
      // User already exists — log in to get a fresh token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'patcher@example.com', password: 'patcherPass1' });
      token = loginRes.body.token;
    } else {
      token = signupRes.body.token;
    }

    const createRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Patch Target', type: 'boolean', month: '2025-07' });
    habitId = createRes.body._id;
  });

  it('200 with updated document on valid day and value', async () => {
    const res = await request(app)
      .patch(`/api/habits/${habitId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ day: '15', value: true });

    expect(res.status).toBe(200);
    // The data map should contain the updated value
    const data = res.body.data;
    const val = typeof data.get === 'function' ? data.get('15') : data['15'];
    expect(val).toBe(true);
  });

  it('403 when a different user tries to patch', async () => {
    const otherRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'intruder@example.com', password: 'intruderPass1' });
    const otherToken = otherRes.body.token;

    const res = await request(app)
      .patch(`/api/habits/${habitId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ day: '1', value: true });

    expect(res.status).toBe(403);
  });

  it('400 on invalid day key (non-numeric string)', async () => {
    const res = await request(app)
      .patch(`/api/habits/${habitId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ day: 'abc', value: true });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('400 on day key "0" (out of range)', async () => {
    const res = await request(app)
      .patch(`/api/habits/${habitId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ day: '0', value: true });

    expect(res.status).toBe(400);
  });

  it('400 on day key "32" (out of range)', async () => {
    const res = await request(app)
      .patch(`/api/habits/${habitId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ day: '32', value: true });

    expect(res.status).toBe(400);
  });

  it('400 on float day key like "1.5"', async () => {
    const res = await request(app)
      .patch(`/api/habits/${habitId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ day: '1.5', value: true });

    expect(res.status).toBe(400);
  });

  it('401 without auth token', async () => {
    const res = await request(app)
      .patch(`/api/habits/${habitId}`)
      .send({ day: '1', value: true });

    expect(res.status).toBe(401);
  });
});
