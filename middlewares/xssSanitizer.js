const xss = require('xss');

const xssSanitizer = (req, res, next) => {
  function sanitize(obj) {
    if (!obj) return;

    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string') {
        // Sanitize plain strings
        obj[key] = xss(obj[key]);
      } else if (Array.isArray(obj[key])) {
        // Handle arrays explicitly
        obj[key].forEach((item, i) => {
          if (typeof item === 'string') obj[key][i] = xss(item);
          else if (typeof item === 'object' && item !== null) sanitize(item);
        });
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Handle nested objects
        sanitize(obj[key]);
      }
    });
  }

  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);

  next();
};

module.exports = xssSanitizer;
