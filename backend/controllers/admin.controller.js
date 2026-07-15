const { validationResult } = require('express-validator');
const Question = require('../models/Question');

const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: { questions } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch questions' });
  }
};

const createQuestion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }

  try {
    const question = await Question.create(req.body);
    res.status(201).json({ success: true, data: { question } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create question' });
  }
};

const updateQuestion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }

  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }
    res.json({ success: true, data: { question } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update question' });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }
    res.json({ success: true, data: { message: 'Question deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete question' });
  }
};

const toggleQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }
    question.isActive = !question.isActive;
    await question.save();
    res.json({ success: true, data: { question } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to toggle question' });
  }
};

const bulkImport = async (req, res) => {
  const { questions } = req.body;

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ success: false, error: 'Provide a non-empty JSON array of questions' });
  }

  const errors = [];
  const valid = [];

  questions.forEach((q, i) => {
    if (!q.text || typeof q.text !== 'string') {
      errors.push(`Question ${i + 1}: missing or invalid "text"`);
      return;
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      errors.push(`Question ${i + 1}: "options" must be an array of exactly 4 strings`);
      return;
    }
    if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) {
      errors.push(`Question ${i + 1}: "correctIndex" must be a number 0–3`);
      return;
    }
    valid.push({
      text: String(q.text).slice(0, 500),
      options: q.options.map((o) => String(o)),
      correctIndex: q.correctIndex,
      timeLimit: typeof q.timeLimit === 'number' ? Math.min(120, Math.max(5, q.timeLimit)) : 30,
      isActive: q.isActive !== false,
    });
  });

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: errors.join('; ') });
  }

  try {
    // Deduplicate within the payload itself (case-insensitive on question text).
    const seenInPayload = new Set();
    const payloadDeduped = [];
    let dupInPayload = 0;
    valid.forEach((q) => {
      const key = q.text.trim().toLowerCase();
      if (seenInPayload.has(key)) {
        dupInPayload += 1;
        return;
      }
      seenInPayload.add(key);
      payloadDeduped.push(q);
    });

    // Deduplicate against existing DB rows so re-imports stay idempotent.
    const existing = await Question.find(
      { text: { $in: payloadDeduped.map((q) => q.text) } },
      'text'
    ).lean();
    const existingTexts = new Set(existing.map((q) => q.text.trim().toLowerCase()));
    const toInsert = payloadDeduped.filter(
      (q) => !existingTexts.has(q.text.trim().toLowerCase())
    );
    const dupInDb = payloadDeduped.length - toInsert.length;

    const inserted = toInsert.length > 0 ? await Question.insertMany(toInsert) : [];
    res.status(201).json({
      success: true,
      data: {
        imported: inserted.length,
        skipped: dupInPayload + dupInDb,
        skippedReason: dupInPayload + dupInDb > 0
          ? `${dupInPayload} duplicate in payload, ${dupInDb} already in database`
          : undefined,
        questions: inserted,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Bulk import failed' });
  }
};

module.exports = { getQuestions, createQuestion, updateQuestion, deleteQuestion, toggleQuestion, bulkImport };
