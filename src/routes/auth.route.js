const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate');
const { register, login } = require('../controllers/auth.controller');

// Each route has three stages in its handler array:
//   1. Validation rules (body() calls) — define what the input must look like
//   2. validate middleware — checks if any rules failed and returns 400 if so
//   3. The controller — only runs if validation passed

router.post(
  '/register',
  [
    // trim() removes surrounding whitespace before checking notEmpty(),
    // so "  " (spaces only) is correctly rejected.
    body('name').trim().notEmpty().withMessage('Name is required'),
    // isEmail() checks format; normalizeEmail() lowercases and strips dots
    // so "User@Example.COM" and "user@example.com" are treated as the same.
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    // notEmpty() rejects an empty string — isLength({ min: 1 }) would do the same.
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

module.exports = router;
