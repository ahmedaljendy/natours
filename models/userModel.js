const mongoose = require('mongoose');
const validator = require('validator');

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
  password: {
    type: String,
    required: [true, 'please provide a password'],
    minlength: 8,
  },
  passwordConfirm: {
    type: String,
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
