const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const duplicateUserError = (err) => {
  if (err.code !== 11000) return null;
  if (err.keyPattern?.email && err.keyPattern?.username) return 'Email and username already in use';
  if (err.keyPattern?.email || err.keyValue?.email) return 'Email already in use';
  if (err.keyPattern?.username || err.keyValue?.username) return 'Username already in use';
  return 'User already exists';
};

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }

  const { username, email, password } = req.body;

  try {
    const existingUsers = await User.find({ $or: [{ email }, { username }] }).select('email username');
    if (existingUsers.length > 0) {
      const emailExists = existingUsers.some((user) => user.email === email);
      const usernameExists = existingUsers.some((user) => user.username === username);

      if (emailExists && usernameExists) {
        return res.status(409).json({ success: false, error: 'Email and username already in use' });
      }

      const field = emailExists ? 'Email' : 'Username';
      return res.status(409).json({ success: false, error: `${field} already in use` });
    }

    const user = await User.create({ username, email, password });
    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user._id, username: user.username, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    const duplicateMessage = duplicateUserError(err);
    if (duplicateMessage) {
      return res.status(409).json({ success: false, error: duplicateMessage });
    }

    res.status(500).json({ success: false, error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = signToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        user: { id: user._id, username: user.username, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Login failed' });
  }
};

const getMe = async (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
      },
    },
  });
};

module.exports = { register, login, getMe };
