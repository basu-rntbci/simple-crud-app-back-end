const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Product = require('../models/product.model');

// Every query filters by createdBy: req.user._id so that users can only
// ever read or modify products they created. Without this filter, any
// logged-in user could read or delete another user's products by guessing IDs.

const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ createdBy: req.user._id });
  res.json({ success: true, count: products.length, data: products });
});

const getProduct = asyncHandler(async (req, res) => {
  // findOne with both _id and createdBy means a user cannot access a
  // product they don't own even if they know its ID. If it doesn't exist
  // OR belongs to someone else, we return the same 404 (no information leak).
  const product = await Product.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, data: product });
});

const createProduct = asyncHandler(async (req, res) => {
  // Spread req.body (name, price, quantity, image from the client) and
  // then add createdBy from the authenticated user. The client never sends
  // createdBy — we set it server-side so it can't be spoofed.
  const product = await Product.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user._id }, // filter — ownership check
    req.body,                                         // fields to update
    {
      returnDocument: 'after',  // return the updated document, not the original
      runValidators: true,       // re-run schema validations (min, required, etc.) on update
    }
  );
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, data: product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({
    _id: req.params.id,
    createdBy: req.user._id,
  });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, message: 'Product deleted' });
});

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
