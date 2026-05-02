const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,    // MongoDB creates an index to enforce no duplicate emails
      lowercase: true, // normalises "User@Example.COM" → "user@example.com" before saving
      trim: true,      // removes accidental leading/trailing spaces
    },
    // select: false means the password field is NEVER returned in query results
    // by default. You must explicitly opt in with .select('+password') when
    // you actually need it (e.g. during login to verify the hash). This
    // prevents the password hash from accidentally leaking in API responses.
    password: { type: String, required: true, minlength: 6, select: false },
  },
  // timestamps: true automatically adds createdAt and updatedAt fields.
  { timestamps: true }
);

// pre('save') is a Mongoose hook that runs automatically before every save.
// We hash the password here instead of in the controller so the hashing
// happens in one place — whether the user registers, changes their password,
// or is created by a script.
// NOTE: In Mongoose 9, async hooks should just return/await — do NOT call next().
userSchema.pre('save', async function () {
  // isModified('password') is false when other fields (name, email) are
  // updated. Without this check we would re-hash an already-hashed password
  // on every save, making the stored hash invalid.
  if (!this.isModified('password')) return;

  // bcrypt.hash(password, 12) — the 12 is the "cost factor" (salt rounds).
  // Higher = slower to compute = harder for attackers to brute-force.
  // 12 is a good balance between security and server speed.
  this.password = await bcrypt.hash(this.password, 12);
});

// A helper method on every User document to compare a plain-text password
// (what the user typed) against the stored hash. Defined on the model so
// the login controller doesn't need to import bcrypt directly.
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
