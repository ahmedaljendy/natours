const AppErr = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `invalid ${err.path} : ${err.value}`;

  return new AppErr(400, message);
};
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Dublicate field value : ${value}`;

  return new AppErr(400, message);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `invalid input data ${errors.join('. ')}`;

  return new AppErr(400, message);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: 'ERROR 💥',
      message: 'something wen wrong',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'deveploment') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (error.message === 'CastError') error = handleCastErrorDB(err);
    if (error.code === 11000) error = handleDuplicateFieldsDB(err);
    if (error.message === 'ValidationError')
      error = handleValidationErrorDB(err);
    sendErrorProd(err, res);
  }
};
