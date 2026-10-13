export const errorHandler = (err, req, res, next) => {
  console.error('[ServerError]', err);

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: `Resource with this ${field} already exists`,
    });
  }

  // CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid resource identifier: ${err.value}`,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'An internal operational error occurred';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  });
};
