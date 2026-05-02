// A custom error class that extends the built-in Error so we can attach
// an HTTP status code to it. This lets controllers throw errors like:
//   throw new ApiError(404, 'Product not found')
// and the global error handler can read err.statusCode to send the
// correct HTTP response instead of always defaulting to 500.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message); // sets this.message via the built-in Error constructor
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;
