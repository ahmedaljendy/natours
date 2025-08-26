const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'please provide your name'],
  },
  photo: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'please provide your email'],
    lowercase: true,
    validate: [validator.isEmail, 'please provide a valid email'],
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lesd-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'please confirm a password'],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: "consfirmed password doesn't match",
    },
  },
  passwordChangedAt: Date,
  passwordRestToken: String,
  passwordRestExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.pre(/^find/, function (next) {
  // `this` refers to the current query
  this.find({ active: true });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassord,
  userPossword,
) {
  return await bcrypt.compare(candidatePassord, userPossword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamo) {
  if (this.passwordChangedAt) {
    const changedTimestap = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamo < changedTimestap;
  }
  return false;
};

userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordRestToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordRestExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
