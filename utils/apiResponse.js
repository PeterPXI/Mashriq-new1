/**
 * API Response Utility
 * Unifies all success and error responses into a single predictable contract.
 */

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {string} message - Human-readable success message
 * @param {Object} data - Payload to return
 * @param {number} statusCode - HTTP status code
 */
const success = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} message - User-safe error message
 * @param {string} code - Machine-readable error code
 * @param {number} statusCode - HTTP status code
 */
const error = (res, message, code = "SERVER_ERROR", statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
    code
  });
};

module.exports = {
  success,
  error
};
