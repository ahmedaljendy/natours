const express = require('express');
const morgan = require('morgan');

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xssSanitizer = require('./middlewares/xssSanitizer');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) GLOPAL MIDDLEWARES
app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//change the default parser of Express
app.set('query parser', 'extended');

const limiter = rateLimit({
  max: 100,
  windowMS: 60 * 60 * 1000,
  message: 'too mant requests from that IP, please try again in an hour ',
});

app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));

app.use(mongoSanitize());
// Custom middleware to sanitize req.body, req.query, req.params
app.use(xssSanitizer);

app.use(
  hpp({
    whitelist: [
      'duration',
      'price',
      'ratingQuantity',
      'ratingAverages',
      'difficulty',
      'maxGroupSize',
    ],
  }),
);

app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all(/.*/, (req, res, next) => {
  next(new AppError(404, `Can't find ${req.originalUrl} on this server!`));
});

app.use(globalErrorHandler);

module.exports = app;
