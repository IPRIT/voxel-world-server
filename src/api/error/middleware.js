import { ApiError } from "./api-error";

const defaultErrorMessage = 'Internal Server Error';

/**
 * @param {*} error
 * @param {*} req
 * @param {*} res
 * @param {Function} next
 * @return {*}
 */
export function clientError (error, req, res, next) {
  if (!error.httpCode) {
    return next( error );
  }
  console.error( 'Bad request:', error );
  res.status( error.httpCode ).json({
    error: error.plainError
  });
}

/**
 * @param {*} error
 * @param {*} req
 * @param {*} res
 * @param {Function} next
 * @return {*}
 */
export function serverError(error, req, res, next) {
  console.error( 'Internal Server Error:', error );
  if (res.headersSent) {
    return next( error );
  }

  const isDevelopmentMode = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
  const {
    message = defaultErrorMessage,
    params = {}
  } = ( isDevelopmentMode ? error : {} ) || {};

  const apiError = new ApiError( message, 500, params );

  res.status( apiError.httpCode ).json({
    error: apiError.plainError
  });
}