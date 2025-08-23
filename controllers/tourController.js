const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeaturs');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingAverage,price';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  // console.log(req.query.sort);
  // console.log(req.query);
  // console.log(req.query.fields);

  // 1A) Filtering
  // const queryObj = { ...req.query };
  // const excludeValues = ['page', 'limit', 'sort', 'fields'];
  // excludeValues.forEach((element) => {
  //   delete queryObj[element];
  // });

  // // 1B) Advanced Filtering  price[gte]=2000
  // let queryStr = JSON.stringify(queryObj);
  // queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`); // replac {gte :5} -> {$gte:5}

  // // const query = Tour.find(queryObj);
  // let query = Tour.find(JSON.parse(queryStr));
  // // const tours =  Tour.find().where('duration').equals(5);

  // 2) Sorting
  // if (req.query.sort) {
  //   // const sortFields = req.query.sort.replace(',', ' ');
  //   const sortFields = req.query.sort.split(',').join(' ');
  //   query = query.sort(sortFields);
  // } else {
  //   query = query.sort('-createdAt');
  // }

  // 3) limit fields
  // if (req.query.fields) {
  //   const fields = req.query.fields.split(',').join(' ');
  //   query = query.select(fields);
  // } else {
  //   query = query.select('-__v');
  // }

  // 4) Pagination
  // const page = req.query.page * 1 || 1;
  // const limit = req.query.limit * 1 || 100;
  // const skip = (page - 1) * limit;
  // // must sort before pagination
  // if (req.query.page) {
  //   const totalDocs = await Tour.countDocuments();
  //   if (skip >= totalDocs)
  //     throw new Error('number of pages are more that limited');
  // }
  // query = query.sort('_id').skip(skip).limit(limit);

  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    throw new AppError(404, 'there is no tour with that ID');
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  // const newTour = new Tour(req.body);
  // newTour.save();
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!tour) {
    throw new AppError(404, 'there is no tour with that ID');
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    throw new AppError(404, 'there is no tour with that ID');
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getTourStates = catchAsync(async (req, res, next) => {
  const states = await Tour.aggregate([
    {
      $match: { ratingAverages: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numOdTours: { $sum: 1 },
        numOfRatings: { $sum: '$ratingQuantity' },
        avgRating: { $avg: '$ratingAverages' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      states,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  // const year = req.params.year;
  // console.log(year);

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${req.params.year}-01-01`),
          $lte: new Date(`${req.params.year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numOfTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { month: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});
