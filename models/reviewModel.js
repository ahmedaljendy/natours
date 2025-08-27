const mongoose = require('mongoose');
const User = require('./userModel');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, "review can't be empty "],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'review must belong to a tour'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'review must belong to a user'],
  },
});

reviewSchema.pre(/^find/, function (next) {
  this.populate([
    {
      path: 'user',
      select: 'name photo',
    },
    // {
    //   path: 'tour',
    //   select: 'name',
    // },
  ]);
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
