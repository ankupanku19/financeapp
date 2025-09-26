const { StatusCodes } = require('http-status-codes');

const notFound = (req, res, next) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
};

module.exports = { notFound };