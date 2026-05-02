const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/user.model');

// A JWT (JSON Web Token) is a signed string the server gives to a client
// after login. The client sends it back on every request so the server
// knows who is making the call — without needing a session or database
// lookup on every request (the signature proves the server issued it).
const generateToken = (id) =>
  jwt.sign(
    { id },                          // payload — what we store inside the token
    process.env.JWT_SECRET,          // secret key used to sign and verify
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } // token expires after 7 days
  );

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check for an existing user before calling User.create() so we can
  // return a clean 409 instead of letting MongoDB's duplicate-key error
  // bubble up (which would also work but gives a less clear message).
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  // User.create() saves the document and triggers the pre('save') hook
  // in user.model.js which hashes the password automatically.
  const user = await User.create({ name, email, password });

  // Return a token immediately after registration so the user is
  // logged in right away without needing a separate login request.
  res.status(201).json({ success: true, token: generateToken(user._id) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // The password field has select: false in the schema, so it is never
  // returned by default. We must explicitly opt in here with .select('+password')
  // because we need to compare it against what the user typed.
  const user = await User.findOne({ email }).select('+password');

  // Combine both checks into one condition intentionally. If we returned
  // separate errors ("user not found" vs "wrong password"), an attacker
  // could use that to discover which emails are registered in the system.
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  res.json({ success: true, token: generateToken(user._id) });
});

module.exports = { register, login };
