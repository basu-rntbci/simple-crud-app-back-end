const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/user.model');

// protect is a middleware that runs before any route that requires the
// user to be logged in. It checks the Authorization header for a valid
// JWT token and, if valid, attaches the user to req.user so the route
// handler can use it (e.g. to know who is making the request).
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Clients send the token in the Authorization header as: "Bearer <token>"
  // If the header is missing or in the wrong format, reject immediately.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authorized, no token');
  }

  // Split "Bearer <token>" and take just the token part.
  const token = authHeader.split(' ')[1];

  // jwt.verify checks the token's signature using our secret key and
  // decodes the payload. If the token was tampered with or has expired,
  // it throws an error which asyncHandler forwards to errorHandler.
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Look up the user from the ID stored inside the token payload.
  // select('-password') means: return all fields EXCEPT the password,
  // so it's never accidentally sent to the client.
  req.user = await User.findById(decoded.id).select('-password');

  // The token could be valid but the user might have been deleted since
  // the token was issued — check for that edge case.
  if (!req.user) throw new ApiError(401, 'User no longer exists');

  // User is authenticated — pass control to the actual route handler.
  next();
});

module.exports = { protect };
