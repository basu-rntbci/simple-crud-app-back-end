const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'], // second element is the error message Mongoose uses
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'], // Mongoose enforces this at the DB layer, not just in the route
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    image: {
      type: String,
      default: '', // optional field — no URL means an empty string, not null
    },
    // createdBy links every product to the user who created it.
    // This is what makes the API multi-user: when fetching or modifying
    // a product we always filter by BOTH _id AND createdBy, so users can
    // only ever see and edit their own products, never someone else's.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId, // stores the User's _id
      ref: 'User',                          // tells Mongoose which model to use if you call .populate()
      required: true,
    },
  },
  // timestamps: true automatically adds createdAt and updatedAt to every document.
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
