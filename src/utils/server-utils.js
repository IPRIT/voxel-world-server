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
 * @param {number} bufferLength
 * @return {Promise<string>}
 */
export function generateCryptoToken (bufferLength = 48) {
  let getRandomBytes = Promise.promisify( crypto.randomBytes );
  return getRandomBytes( bufferLength ).then(buffer => {
    return buffer.toString( 'hex' );
  });
}