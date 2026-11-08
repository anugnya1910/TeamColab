const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, httpError } = require('../utils/helpers');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (await User.findOne({ email: email.toLowerCase() })) {
    throw httpError(409, 'An account with this email already exists');
  }
  const user = await User.create({ name, email, password, ...(role ? { role } : {}) });
  res.status(201).json({ token: signToken(user._id), user });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw httpError(401, 'Invalid email or password');
  user.lastActive = new Date();
  await user.save();
  res.json({ token: signToken(user._id), user });
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'role', 'bio', 'avatarColor'];
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) req.user[f] = req.body[f];
  });
  await req.user.save();
  res.json({ user: req.user });
});

// PUT /api/auth/password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) throw httpError(400, 'Current password is incorrect');
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully', token: signToken(user._id) });
});
