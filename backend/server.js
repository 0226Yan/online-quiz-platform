// Load environment variables early (e.g., DB URI, JWT secret, allowed client origin).
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const quizRoutes = require('./routes/quiz.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Establish the database connection at startup. If this fails, the app may still
// start listening, but API calls that depend on DB will fail.
connectDB();

// Harden common HTTP headers (helps mitigate XSS, clickjacking, etc.).
app.use(helmet());

// Allow browser clients to call this API from a specific origin.
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Parse JSON request bodies (keep a small-ish limit to reduce abuse surface).
app.use(express.json({ limit: '2mb' }));

// Strip Mongo operator keys ($gt, $ne, ...) from req.body / params / query to
// block NoSQL injection (e.g. `{"email":{"$ne":null}}` bypass attempts).
app.use(mongoSanitize());

// Sanitise user input against XSS — escapes HTML tags inside string values
// before they reach controllers or the database.
app.use(xss());

// Mount API route modules.
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);

// Fallback for unknown routes (keeps responses consistent as JSON).
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Centralized error handler. We avoid leaking raw Mongoose/Mongo error
// messages to clients in production — they can disclose schema details.
app.use((err, req, res, next) => {
  console.error(err.stack);

  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);

  let clientMessage;
  if (status < 500) {
    // 4xx — message is likely safe and useful to the client.
    clientMessage = err.message || 'Bad request';
  } else if (process.env.NODE_ENV === 'production') {
    clientMessage = 'Server error';
  } else {
    clientMessage = err.message || 'Server error';
  }

  res.status(status).json({ success: false, error: clientMessage });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
