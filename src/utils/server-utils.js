import Promise from 'bluebird';
import crypto from 'crypto';

/**
 *
 * Normalize a port into a number, string, or false.
 *
 * @param {number|*} value
 * @return {number|string|boolean}
 */
export function normalizePort(value) {
  const port = parseInt( value, 10 );
  if (isNaN( port )) {
    // named pipe
    return value;
  }
  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * @param {*} request
 * @return {*}
 */
export function extractAllParams (request) {
  return Object.assign(
    {}, request.body, request.query, request.params, { user: request.user }
  );
}

/**
 * @param {Function} asyncMethodFn
 * @param {*} req
 * @param {*} res
 * @param {Function} next
 * @return {Promise<T>|*}
 */
export function wrapRequest (asyncMethodFn, req, res, next) {
  const promiseLike = asyncMethodFn( extractAllParams( req ) );
  if (!promiseLike.then) {
    return promiseLike;
  }
  return promiseLike.then(response => {
    return res.json({
      response
    });
  }).catch( next );
}

/**
 * @param {number} bufferLength
 * @return {Promise<string>}
 */
export function generateCryptoToken (bufferLength = 48) {
  let getRandomBytes = Promise.promisify( crypto.randomBytes );
  return getRandomBytes( bufferLength ).then(buffer => {
    return buffer.toString( 'hex' );
  });
}

/**
 * @param {Socket} socket
 * @return {Object}
 */
export function extractSocketQuery (socket) {
  const { handshake = {} } = socket;
  return handshake.query || {};
}