exports.notFound = (req, res, next) => {
  const err = new Error(`Route not found — ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

// Central error handler: turns Mongoose / JWT / custom errors into clean JSON
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.code === 11000) {
    status = 409;
    message = `${Object.keys(err.keyValue || {})[0] || 'Field'} already exists`;
  }

  if (status === 500) console.error('💥', err);

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && status === 500 ? { stack: err.stack } : {}),
  });
};
