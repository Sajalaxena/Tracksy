# Tracksy — Personal Habit Tracker

A full-stack personal habit tracker presented as a diary-style matrix grid. Habit categories are rows, calendar days are columns, and each cell holds a daily entry. Supports boolean (checkbox) and numeric habit types, JWT authentication, and an analytics page with completion rates, streaks, and monthly trends.

## Tech Stack

- **Frontend**: React 18 (Vite), Tailwind CSS
- **Backend**: Node.js, Express 4
- **Database**: MongoDB, Mongoose 7
- **Auth**: JWT (jsonwebtoken), bcrypt

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/) running locally on port 27017, or a MongoDB Atlas connection string

## Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd <repo-directory>
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Install client dependencies

```bash
cd ../client
npm install
```

## Environment Variables

Copy the example env file and fill in your values:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```
MONGO_URI=mongodb://localhost:27017/tracksy
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

| Variable    | Description                                      | Default                              |
|-------------|--------------------------------------------------|--------------------------------------|
| `MONGO_URI` | MongoDB connection string                        | `mongodb://localhost:27017/tracksy`  |
| `JWT_SECRET`| Secret key used to sign JWTs (keep this private) | —                                    |
| `PORT`      | Port the Express server listens on               | `5000`                               |

## Running in Development

Open two terminal windows:

**Terminal 1 — Start the backend:**

```bash
cd server
npm run dev
```

The API server starts on `http://localhost:5000`.

**Terminal 2 — Start the frontend:**

```bash
cd client
npm run dev
```

The Vite dev server starts on `http://localhost:5173` and proxies `/api/*` requests to the Express server automatically.

## Running Tests

**Backend tests:**

```bash
cd server
npm test
```

**Frontend tests:**

```bash
cd client
npm test
```

## Project Structure

```
.
├── server/                 # Express API
│   ├── index.js            # App entry point
│   ├── routes/             # Route handlers (auth, habits)
│   ├── middleware/         # JWT auth middleware
│   ├── models/             # Mongoose schemas (User, HabitRecord)
│   ├── utils/              # Analytics utilities
│   ├── .env.example        # Environment variable template
│   └── package.json
├── client/                 # React SPA
│   ├── src/
│   │   ├── main.jsx        # React entry point
│   │   ├── App.jsx         # Root component with router
│   │   ├── index.css       # Tailwind directives
│   │   ├── pages/          # Page-level components
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context providers
│   │   └── services/       # API service module
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
└── README.md
```
