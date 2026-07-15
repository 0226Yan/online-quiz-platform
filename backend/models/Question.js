const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      maxlength: [500, 'Question text cannot exceed 500 characters'],
    },
    options: {
      type: [String],
      required: [true, 'Options are required'],
      validate: {
        validator: (arr) => arr.length === 4,
        message: 'Exactly 4 options are required',
      },
    },
    correctIndex: {
      type: Number,
      required: [true, 'Correct answer index is required'],
      min: 0,
      max: 3,
    },
    // Timed variation: per-question countdown in seconds
    timeLimit: {
      type: Number,
      default: 30,
      min: [5, 'Time limit must be at least 5 seconds'],
      max: [120, 'Time limit cannot exceed 120 seconds'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
