# Online Quiz Platform

![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933)
![Express](https://img.shields.io/badge/Express-REST%20API-000000)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248)
![Mongoose](https://img.shields.io/badge/Mongoose-ODM-880000)
![JWT](https://img.shields.io/badge/JWT-Authentication-purple)

A full-stack online quiz platform built with **React**, **Node.js**, **Express**, and **MongoDB**.

The platform supports timed quizzes, automatic timeout submission, score calculation, speed bonuses, answer review, quiz history, leaderboards, and administrator question management.

[Live Demo](https://0226Yan.github.io/online-quiz-platform/)

### Demo Login

| Role | Email | Password |
| --- | --- | --- |
| Player | `demo@example.com` | `123456` |
| Administrator | `admin@example.com` | `123456` |

> The GitHub Pages version is a frontend-only demo using static mock data and browser storage. It does not require the Express backend or MongoDB.

---

## Overview

The system contains two main parts:

- **Player Portal**: users can register, log in, complete timed quizzes, review answers, view previous attempts, and compare results on the leaderboard.
- **Admin Dashboard**: administrators can create, edit, delete, activate, deactivate, and bulk-import quiz questions.

Each question has an individual countdown timer. Questions are automatically recorded as unanswered when time expires. Correct answers receive standard points, while faster correct answers can receive an additional speed bonus.

---

## My Contribution

This was a four-person team project. I was primarily responsible for the **quiz logic and timed scoring subsystem**.

My work included:

- Designed the timed-question model and individual question time limits.
- Implemented the frontend countdown and automatic timeout behaviour.
- Developed the backend answer-checking and score-calculation logic.
- Designed and implemented the speed-bonus mechanism.
- Implemented quiz attempt saving and answer-review generation.
- Added validation for duplicate question IDs.
- Added server-side validation for submitted remaining-time values.
- Connected quiz results with the history and leaderboard features.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, React Router, Axios |
| State Management | Context API, `useReducer` |
| Form Validation | React Hook Form, Zod |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | JWT (full-stack) / Mock login (demo) |
| Security | Helmet, CORS, Rate Limiting |
| Development Tools | npm, Git, MongoDB Shell |
| Deployment | GitHub Pages, GitHub Actions |

---

## Features

### Player Portal

- User registration and login
- JWT-based authentication in full-stack mode
- Randomised active quiz questions
- Individual countdown timer
- Automatic timeout submission
- Score and speed-bonus calculation
- Answer review
- Personal quiz history
- Leaderboard rankings
- Dark mode

### Admin Dashboard

- Dedicated administrator login
- Role-based access control
- Question creation, editing, and deletion
- Question activation and deactivation
- Question time-limit configuration
- Bulk question import
- Duplicate-question validation

---

## Timed Scoring Design

Each question contains a `timeLimit` value between 5 and 120 seconds, with a default value of 30 seconds.

When the timer reaches zero, the question is recorded as unanswered:

```json
{
  "selectedAnswer": -1,
  "timeRemaining": 0
}
```

### Speed Bonus

The speed bonus rewards correct answers completed with more remaining time:

```text
bonusPoints =
min(
  1.0,
  sum(timeRemaining / timeLimit for each correct answer)
  / totalQuestions
)
```

The final score is calculated as:

```text
totalScore = score + bonusPoints
```

The speed bonus is capped at `1.0` point per quiz so that speed rewards do not outweigh answer accuracy.

In full-stack local mode, the backend:

- Verifies that submitted questions exist.
- Rejects duplicate question IDs.
- Validates selected answer indexes.
- Limits `timeRemaining` to the valid range.
- Calculates results using server-side question data.
- Stores the score, bonus, answers, and completion time.

In the GitHub Pages demo, the same quiz workflow is simulated in the browser. Quiz attempts, history, leaderboard updates, and question changes are stored in `localStorage` and are not shared between visitors.

---

## Project Structure

```text
online-quiz-platform/
├── README.md
├── .gitignore
│
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Question.js
│   │   └── Score.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── quiz.controller.js
│   │   └── admin.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── quiz.routes.js
│   │   └── admin.routes.js
│   └── middleware/
│       ├── auth.middleware.js
│       └── admin.middleware.js
│
└── frontend/
    ├── .env.production
    ├── package.json
    └── src/
        ├── App.js
        ├── api/
        │   └── api.js
        ├── mock/
        │   └── demoApi.js
        ├── context/
        ├── components/
        └── pages/
```

---

## Local Setup

### Prerequisites

- Node.js 18 or later
- npm 9 or later
- MongoDB 6 or later
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/911413485-spec/online-quiz-platform.git
cd online-quiz-platform
```

### 2. Start the Backend

```bash
cd backend
npm install
cp .env.example .env
```

Configure `backend/.env`:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/quiz_game
JWT_SECRET=replace_with_a_random_secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:3000
NODE_ENV=development
```

Start the backend:

```bash
npm run dev
```

The backend runs at:

```text
http://localhost:5001
```

### 3. Start the Frontend

Open another terminal from the project root:

```bash
cd frontend
npm install
npm start
```

The frontend runs at:

```text
http://localhost:3000
```

---

## Create an Administrator Account (Local Mode)

Register a normal account at:

```text
http://localhost:3000/register
```

Update the account role in MongoDB:

```bash
mongosh quiz_game --eval 'db.users.updateOne({email:"your@email.com"},{$set:{role:"admin"}})'
```

Then log out and open:

```text
http://localhost:3000/admin/login
```

---

## Static Demo Mode

The GitHub Pages version runs entirely in the browser and does not require Express or MongoDB.

Static demo mode is enabled in:

```text
frontend/.env.production
```

Mock API responses and demo data are defined in:

```text
frontend/src/mock/demoApi.js
```

To test the static demo locally:

```bash
cd frontend
REACT_APP_DEMO_MODE=true npm start
```

Quiz history, leaderboard updates, registered demo accounts, and administrator question changes are stored in the current browser's `localStorage`.