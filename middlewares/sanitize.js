const mongoSanitize = require('express-mongo-sanitize');
const { has, set } = require('lodash'); // optional helper, can also use plain JS

module.exports = function sanitize() {
  return function (req, res, next) {
    // Sanitize req.body
    if (req.body) {
      req.body = mongoSanitize.sanitize(req.body);
    }

    // Sanitize req.query (mutate instead of reassign)
    if (req.query) {
      const sanitizedQuery = mongoSanitize.sanitize(req.query);
      for (const key of Object.keys(req.query)) {
        delete req.query[key];
      }
      Object.assign(req.query, sanitizedQuery);
    }

    // Sanitize req.params
    if (req.params) {
      req.params = mongoSanitize.sanitize(req.params);
    }

    next();
  };
};
