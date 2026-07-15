const express = require('express');
const { body } = require('express-validator');
const {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  toggleQuestion,
  bulkImport,
} = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');

const router = express.Router();

router.use(protect, adminOnly);

const questionValidation = [
  body('text').trim().notEmpty().withMessage('Question text is required').isLength({ max: 500 }),
  body('options')
    .isArray({ min: 4, max: 4 })
    .withMessage('Exactly 4 options are required'),
  body('options.*').isString().notEmpty().withMessage('Each option must be a non-empty string'),
  body('correctIndex')
    .isInt({ min: 0, max: 3 })
    .withMessage('correctIndex must be 0–3'),
  body('timeLimit')
    .optional()
    .isInt({ min: 5, max: 120 })
    .withMessage('timeLimit must be 5–120 seconds'),
];

router.get('/questions', getQuestions);
router.post('/questions', questionValidation, createQuestion);
router.put('/questions/:id', questionValidation, updateQuestion);
router.delete('/questions/:id', deleteQuestion);
router.patch('/questions/:id/toggle', toggleQuestion);
router.post('/questions/bulk-import', bulkImport);

module.exports = router;
