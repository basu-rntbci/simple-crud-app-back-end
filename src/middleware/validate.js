const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Routes use express-validator's body()/param() functions to define rules,
// but those functions only collect errors — they don't stop the request.
// This middleware must run after them to actually check if any rules failed
// and return a 400 before the controller runs.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Join all failed rule messages into one string, e.g.:
    // "Name is required, Price must be a positive number"
    const message = errors
      .array()
      .map((e) => e.msg)
      .join(', ');
    return next(new ApiError(400, message));
  }
  // No validation errors — let the request continue to the controller.
  next();
};

module.exports = validate;
