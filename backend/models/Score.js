const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedAnswer: {
      type: Number,
      required: true,
      // -1 = timed out (no answer selected)
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    timeRemaining: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const scoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    bonusPoints: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    totalScore: {
      type: Number,
      required: true,
    },
    answers: {
      type: [answerSchema],
      required: true,
    },
    // Client-generated identifier for one quiz attempt. Used to make
    // POST /api/quiz/submit idempotent: the same attemptId from the same user
    // returns the original Score instead of creating a duplicate row.
    attemptId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for leaderboard queries
scoreSchema.index({ totalScore: -1 });
scoreSchema.index({ userId: 1, completedAt: -1 });
// One Score per (user, attemptId) — enforces idempotency at the DB layer.
scoreSchema.index({ userId: 1, attemptId: 1 }, { unique: true });

module.exports = mongoose.model('Score', scoreSchema);
