const { StatusCodes } = require('http-status-codes');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      message,
      statusCode: StatusCodes.NOT_FOUND
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = {
      message,
      statusCode: StatusCodes.CONFLICT
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message,
      statusCode: StatusCodes.BAD_REQUEST
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      message,
      statusCode: StatusCodes.UNAUTHORIZED
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      message,
      statusCode: StatusCodes.UNAUTHORIZED
    };
  }

  // Express validator errors
  if (err.array && typeof err.array === 'function') {
    const errors = err.array();
    const message = errors.map(error => error.msg).join(', ');
    error = {
      message,
      statusCode: StatusCodes.BAD_REQUEST
    };
  }

  // Default error
  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = error.message || 'Server Error';

  // Don't leak error details in production
  const errorResponse = {
    success: false,
    error: message
  };

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = { errorHandler };