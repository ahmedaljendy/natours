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

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

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

reviewSchema.statics.calcAverageRatinga = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    ratingQuantity: stats[0].nRating,
    ratingAverages: stats[0].avgRating,
  });
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRatinga(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  // this -> query object ( update ) , this.findOne() -> gives the document, this.r -> saving the document in a property r in the query object so I can pass it to the post hook
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // noe the this -> still the query , this.r -> represent the Model (documnent)
  await this.r.constructor.calcAverageRatinga(this.r.tour);
  // this.r.tour -> the tour field ( tourId ) from the review document
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
