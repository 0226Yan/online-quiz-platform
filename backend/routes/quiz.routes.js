const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { getQuestions, submitQuiz, getLeaderboard, getHistory } = require('../controllers/quiz.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

const submitLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 5 : 60,
  message: { success: false, error: 'Too many submissions, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/questions', protect, getQuestions);

router.post(
  '/submit',
  protect,
  submitLimiter,
  [
    body('answers')
      .isArray({ min: 6, max: 10 })
      .withMessage('Answers must be an array of 6–10 items'),
    body('answers.*.questionId')
      .isMongoId()
      .withMessage('Each answer must have a valid questionId'),
    body('answers.*.selectedAnswer')
      .isInt({ min: -1, max: 3 })
      .withMessage('selectedAnswer must be -1 (timeout) or 0–3'),
    body('answers.*.timeRemaining')
      .isFloat({ min: 0 })
      .withMessage('timeRemaining must be a non-negative number'),
    body('attemptId')
      .isString()
      .trim()
      .isLength({ min: 8, max: 64 })
      .withMessage('attemptId is required (8–64 chars)'),
  ],
  submitQuiz
);

router.get('/leaderboard', protect, getLeaderboard);
router.get('/history', protect, getHistory);

module.exports = router;
