const ApiError = require('../utils/ApiError');

// Catches requests to URLs that don't match any route.
// It must be placed after all routes so it only fires as a fallback.
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
};

// Central error handler — Express recognises it by the 4-parameter
// signature (err, req, res, next). Any time next(err) is called
// anywhere in the app, execution jumps here. Centralising this means
// we never need try/catch in each route; we just throw or call next(err).
const errorHandler = (err, req, res, next) => {

  // Mongoose throws a ValidationError when a document fails schema
  // constraints (e.g. a required field is missing). We extract all the
  // individual field messages and join them into one readable string.
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors)
        .map((e) => e.message)
        .join(', '),
    });
  }

  // Mongoose throws a CastError when an ID in the URL (e.g. /products/abc)
  // can't be converted to a valid MongoDB ObjectId. Return 400 instead
  // of letting the generic 500 handler fire.
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  // MongoDB error code 11000 means a unique index was violated — most
  // commonly someone trying to register with an email that already exists.
  // We extract the field name from keyValue so the message is specific.
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }

  // jsonwebtoken throws JsonWebTokenError when the token signature is
  // invalid (e.g. it was tampered with or signed with a different secret).
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  // jsonwebtoken throws TokenExpiredError when the token's expiresIn
  // time has passed. The client needs to log in again to get a new one.
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  // For all other errors, use the statusCode we attached (via ApiError),
  // or fall back to 500. In production we hide the raw error message for
  // unexpected 500s to avoid leaking internal implementation details.
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal Server Error'
      : err.message;

  res.status(statusCode).json({ success: false, message });
};

module.exports = { notFound, errorHandler };
