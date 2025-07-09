/**
 * Custom API Error class for consistent error handling
 */
class ApiError extends Error {
  /**
   * Create an API error
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {string} code - Custom error code
   * @param {Object} details - Additional error details
   */
  constructor(statusCode, message, code = 'API_ERROR', details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a bad request error (400)
   * @param {string} message - Error message
   * @param {string} code - Custom error code
   * @param {Object} details - Additional error details
   * @returns {ApiError}
   */
  static badRequest(message = 'Bad Request', code = 'BAD_REQUEST', details = {}) {
    return new ApiError(400, message, code, details);
  }

  /**
   * Create an unauthorized error (401)
   * @param {string} message - Error message
   * @param {string} code - Custom error code
   * @param {Object} details - Additional error details
   * @returns {ApiError}
   */
  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED', details = {}) {
    return new ApiError(401, message, code, details);
  }

  /**
   * Create a forbidden error (403)
   * @param {string} message - Error message
   * @param {string} code - Custom error code
   * @param {Object} details - Additional error details
   * @returns {ApiError}
   */
  static forbidden(message = 'Forbidden', code = 'FORBIDDEN', details = {}) {
    return new ApiError(403, message, code, details);
  }

  /**
   * Create a not found error (404)
   * @param {string} message - Error message
   * @param {string} code - Custom error code
   * @param {Object} details - Additional error details
   * @returns {ApiError}
   */
  static notFound(message = 'Not Found', code = 'NOT_FOUND', details = {}) {
    return new ApiError(404, message, code, details);
  }

  /**
   * Create a validation error (422)
   * @param {string} message - Error message
   * @param {Array|Object} errors - Validation errors
   * @param {string} code - Custom error code
   * @param {Object} details - Additional error details
   * @returns {ApiError}
   */
  static validationError(
    message = 'Validation Error',
    errors = [],
    code = 'VALIDATION_ERROR',
    details = {}
  ) {
    return new ApiError(422, message, code, { ...details, errors });
  }

  /**
   * Create a too many requests error (429)
   * @param {string} message - Error message
   * @param {string} code - Custom error code
   * @param {Object} details - Additional error details
   * @returns {ApiError}
   */
  static tooManyRequests(
    message = 'Too Many Requests',
    code = 'RATE_LIMIT_EXCEEDED',
    details = {}
  ) {
    return new ApiError(429, message, code, details);
  }

  /**
   * Create an internal server error (500)
   * @param {string} message - Error message
   * @param {string} code - Custom error code
   * @param {Object} details - Additional error details
   * @returns {ApiError}
   */
  static internal(
    message = 'Internal Server Error',
    code = 'INTERNAL_SERVER_ERROR',
    details = {}
  ) {
    return new ApiError(500, message, code, details);
  }

  /**
   * Create a not implemented error (501)
   * @param {string} message - Error message
   * @param {string} code - Custom error code
   * @param {Object} details - Additional error details
   * @returns {ApiError}
   */
  static notImplemented(
    message = 'Not Implemented',
    code = 'NOT_IMPLEMENTED',
    details = {}
  ) {
    return new ApiError(501, message, code, details);
  }

  /**
   * Create a service unavailable error (503)
   * @param {string} message - Error message
   * @param {string} code - Custom error code
   * @param {Object} details - Additional error details
   * @returns {ApiError}
   */
  static serviceUnavailable(
    message = 'Service Unavailable',
    code = 'SERVICE_UNAVAILABLE',
    details = {}
  ) {
    return new ApiError(503, message, code, details);
  }

  /**
   * Convert error to JSON response
   * @returns {Object} JSON response object
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(Object.keys(this.details).length > 0 && { details: this.details }),
        ...(process.env.NODE_ENV !== 'production' && { stack: this.stack }),
      },
    };
  }

  /**
   * Create an API error from another error
   * @param {Error} error - Original error
   * @param {Object} options - Options
   * @param {number} options.statusCode - HTTP status code
   * @param {string} options.code - Custom error code
   * @param {Object} options.details - Additional error details
   * @returns {ApiError}
   */
  static fromError(error, { statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = {} } = {}) {
    if (error instanceof ApiError) {
      return error;
    }

    const apiError = new ApiError(
      statusCode,
      error.message || 'An unexpected error occurred',
      code,
      { ...details, originalError: error.message }
    );

    // Preserve the original stack trace if available
    if (error.stack) {
      apiError.stack = error.stack;
    }

    return apiError;
  }
}

/**
 * Error handler middleware for Express/Next.js API routes
 * @param {Error} err - Error object
 * @param {import('next').NextApiRequest} req - Request object
 * @param {import('next').NextApiResponse} res - Response object
 */
const errorHandler = (err, req, res) => {
  // Log the error for debugging
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    stack: err.stack,
    url: req?.url,
    method: req?.method,
    ...(err.details && { details: err.details }),
  });

  // Handle API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const authError = ApiError.unauthorized('Invalid or expired token', 'INVALID_TOKEN');
    return res.status(authError.statusCode).json(authError.toJSON());
  }

  // Handle validation errors (e.g., from express-validator)
  if (err.name === 'ValidationError' || Array.isArray(err.errors)) {
    const validationError = ApiError.validationError(
      'Validation failed',
      err.errors,
      'VALIDATION_ERROR'
    );
    return res.status(validationError.statusCode).json(validationError.toJSON());
  }

  // Handle rate limiting errors
  if (err.statusCode === 429) {
    const rateLimitError = ApiError.tooManyRequests(
      'Too many requests, please try again later',
      'RATE_LIMIT_EXCEEDED',
      {
        retryAfter: err.retryAfter,
        limit: err.limit,
        current: err.current,
      }
    );
    return res.status(rateLimitError.statusCode).json(rateLimitError.toJSON());
  }

  // Default to 500 Internal Server Error
  const internalError = ApiError.internal(
    process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    'INTERNAL_SERVER_ERROR',
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}
  );

  return res.status(internalError.statusCode).json(internalError.toJSON());
};

/**
 * Async handler for API routes to catch async/await errors
 * @param {Function} handler - Async route handler function
 * @returns {Function} Wrapped handler with error handling
 */
const asyncHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

export { ApiError, errorHandler, asyncHandler };
export default ApiError;
