const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');

// router.use(protect) applies the auth middleware to every route defined
// below it in this file. This is cleaner than adding protect to each
// route individually and makes it impossible to accidentally leave one unprotected.
router.use(protect);

// GET /api/products — no extra validation needed, just fetch all
router.get('/', getProducts);

// param('id').isMongoId() checks that the :id in the URL is a valid
// 24-character hex MongoDB ObjectId. Without this, passing "abc" as an ID
// would reach the database, cause a CastError, and return a confusing 500.
// By validating first we return a clean 400 before hitting the DB.
router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid product ID'),
  validate,
  getProduct
);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    // optional() means the field is allowed to be absent. If it IS present,
    // the isInt check still runs. This avoids requiring clients to always send quantity.
    body('quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Quantity must be a non-negative integer'),
  ],
  validate,
  createProduct
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid product ID'),
    // All body fields are optional on PUT so partial updates are allowed
    // (e.g. updating only the price without sending name and quantity).
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Quantity must be a non-negative integer'),
  ],
  validate,
  updateProduct
);

router.delete(
  '/:id',
  param('id').isMongoId().withMessage('Invalid product ID'),
  validate,
  deleteProduct
);

module.exports = router;
