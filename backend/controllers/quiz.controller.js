const { validationResult } = require('express-validator');
const Question = require('../models/Question');
const Score = require('../models/Score');

// Fisher-Yates shuffle
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const getQuestions = async (req, res) => {
  try {
    //const questions = await Question.find({ isActive: true }).select('-__v');
    const questions = await Question.find({ isActive: true }).select('-__v -correctIndex');
    if (questions.length < 6) {
      return res.status(400).json({ success: false, error: 'Not enough active questions (minimum 6)' });
    }

    const shuffled = shuffle(questions);
    const count = Math.min(10, shuffled.length);
    const selected = shuffled.slice(0, count);

    res.json({ success: true, data: { questions: selected } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch questions' });
  }
};

const submitQuiz = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }

  const { answers, attemptId } = req.body;
  // answers: [{ questionId, selectedAnswer, timeRemaining }]

  // Reject duplicate question submissions.
  // Each question should only be answered once in one quiz attempt.
  const questionIds = answers.map((a) => String(a.questionId));
  const uniqueQuestionIds = new Set(questionIds);

  if (uniqueQuestionIds.size !== questionIds.length) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate question submissions are not allowed',
    });
  }

  try {
    // Idempotency: if this attemptId has already been submitted by this user
    // (e.g. double-click on Submit, network retry), return the original record
    // instead of creating another Score row.
    const existing = await Score.findOne({ userId: req.user._id, attemptId });
    if (existing) {
      const populated = await Score.findById(existing._id)
        .populate('answers.questionId', 'text options correctIndex timeLimit')
        .lean();
      const review = populated.answers.map((ans) => ({
        questionId: ans.questionId?._id,
        text: ans.questionId?.text,
        options: ans.questionId?.options,
        selectedAnswer: ans.selectedAnswer,
        correctIndex: ans.questionId?.correctIndex,
        isCorrect: ans.isCorrect,
        timeRemaining: ans.timeRemaining,
      }));
      return res.status(200).json({
        success: true,
        data: {
          score: existing.score,
          bonusPoints: existing.bonusPoints,
          totalScore: existing.totalScore,
          scoreId: existing._id,
          review,
          duplicate: true,
        },
      });
    }

    // Fetch questions to validate correctness server-side
    const questions = await Question.find({ _id: { $in: questionIds } });
    if (questions.length !== uniqueQuestionIds.size) {
      return res.status(400).json({
        success: false,
        error: 'Submitted answers contain invalid questions',
      });
    }

    const questionMap = {};
    questions.forEach((q) => { questionMap[q._id.toString()] = q; });

    let score = 0;
    let bonusSum = 0;

    const processedAnswers = answers.map((a) => {
      const question = questionMap[a.questionId];
      if (!question) return null;

      const selectedAnswer = Number(a.selectedAnswer);

      // Do not trust timeRemaining from the frontend.
      // Clamp it to the valid range: 0 <= timeRemaining <= question.timeLimit.
      const rawTimeRemaining = Number(a.timeRemaining);
      const safeTimeRemaining = Number.isFinite(rawTimeRemaining)
        ? Math.max(0, Math.min(rawTimeRemaining, question.timeLimit))
        : 0;

      const isCorrect = selectedAnswer !== -1 && selectedAnswer === question.correctIndex;

      if (isCorrect) {
        score += 1;
        bonusSum += safeTimeRemaining / question.timeLimit;
      }

      return {
        questionId: question._id,
        selectedAnswer: a.selectedAnswer,
        isCorrect,
        timeRemaining: safeTimeRemaining,
      };
    }).filter(Boolean);

    // Bonus capped at 1.0, distributed across total questions
    const bonusPoints = Math.min(1.0, bonusSum / answers.length);
    const totalScore = score + bonusPoints;

    let scoreDoc;
    try {
      scoreDoc = await Score.create({
        userId: req.user._id,
        score,
        bonusPoints: Math.round(bonusPoints * 1000) / 1000,
        totalScore: Math.round(totalScore * 1000) / 1000,
        answers: processedAnswers,
        attemptId,
      });
    } catch (createErr) {
      // Race condition: another request with the same attemptId committed first.
      if (createErr && createErr.code === 11000) {
        const existing = await Score.findOne({ userId: req.user._id, attemptId });
        if (existing) {
          return res.status(200).json({
            success: true,
            data: {
              score: existing.score,
              bonusPoints: existing.bonusPoints,
              totalScore: existing.totalScore,
              scoreId: existing._id,
              review: [],
              duplicate: true,
            },
          });
        }
      }
      throw createErr;
    }

    const review = processedAnswers.map((ans) => {
      const question = questionMap[ans.questionId.toString()];

      return {
        questionId: ans.questionId,
        text: question.text,
        options: question.options,
        selectedAnswer: ans.selectedAnswer,
        correctIndex: question.correctIndex,
        isCorrect: ans.isCorrect,
        timeRemaining: ans.timeRemaining,
      };
    });

    res.status(201).json({
      success: true,
      data: {
        score,
        bonusPoints: scoreDoc.bonusPoints,
        totalScore: scoreDoc.totalScore,
        scoreId: scoreDoc._id,
        review,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to submit quiz' });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Score.aggregate([
      {
        $group: {
          _id: '$userId',
          bestScore: { $max: '$totalScore' },
          rawScore: { $max: '$score' },
          attempts: { $sum: 1 },
        },
      },
      { $sort: { bestScore: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          username: '$user.username',
          bestScore: { $round: ['$bestScore', 2] },
          rawScore: 1,
          attempts: 1,
        },
      },
    ]);

    res.json({ success: true, data: { leaderboard } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
};

const getHistory = async (req, res) => {
  try {
    const history = await Score.find({ userId: req.user._id })
      .sort({ completedAt: -1 })
      .populate('answers.questionId', 'text options correctIndex timeLimit')
      .lean();

    res.json({ success: true, data: { history } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
};

module.exports = { getQuestions, submitQuiz, getLeaderboard, getHistory };