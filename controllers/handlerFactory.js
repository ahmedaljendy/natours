const APIFeatures = require('../utils/apiFeaturs');
const AppError = require('../utils/appError');

exports.deleteOne = (Model) => async (req, res) => {
  const doc = await Model.findByIdAndDelete(req.params.id);

  if (!doc) {
    throw new AppError(404, 'there is no document with that ID');
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
};

exports.updateOne = (Model) => async (req, res) => {
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!doc) {
    throw new AppError(404, 'there is no document with that ID');
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
};
exports.createOne = (Model) => async (req, res) => {
  const doc = await Model.create(req.body);
  res.status(201).json({
    status: 'error',
    daye: {
      data: doc,
    },
  });
};

exports.getOne = (Model, popOptions) => async (req, res) => {
  let query = Model.findById(req.params.id);
  if (popOptions) {
    query = query.populate(popOptions);
  }
  const doc = await query;
  if (!doc) {
    throw new AppError(404, 'there is no document with that ID');
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
};

exports.getAll = (Model) => async (req, res) => {
  let filter = {};
  if (req.params.tourId) {
    filter = { tour: req.params.tourId };
  }
  const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const docs = await features.query;
  // const docs = await features.query.explain;

  res.status(200).json({
    status: 'success',
    results: docs.length,
    data: {
      docs,
    },
  });
};
