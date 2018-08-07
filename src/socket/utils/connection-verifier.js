import request from 'request-promise';
import { config } from "../../../config";

const defaultErrorCode = 'invalid_game_session';

/**
 * @param {*} request
 * @param {Function} next
 */
export function connectionVerifier ({ handshake = {} }, next) {
  const { query = {} } = handshake;
  const { gameToken } = query;

  if (!gameToken) {
    return next( new Error( defaultErrorCode ) );
  }

  return verifyToken( gameToken )
    .then(_ => next())
    .catch( next );
}

/**
 * @param {string} gameToken
 * @param {*} serverOptions
 * @return {Promise<boolean>}
 */
export async function verifyToken (gameToken, serverOptions = {}) {
  console.log( `[Socket#connection] verifying game token (${gameToken.slice(0, 10)}...).` );

  return fetchGameSession( gameToken, serverOptions ).then(session => {
    console.log( `[Socket#connection] game token (${gameToken.slice(0, 10)}...) verified by server!` );
    return session;
  }).catch(({ error = {} } = {}) => {
    console.log( `[Socket#connection] game token (${gameToken.slice(0, 10)}...) declined by server.` );
    const serverError = error.error || {};
    throw new Error( serverError.code || defaultErrorCode );
  });
}

/**
 * @param {string} gameToken
 * @param {*} serverOptions
 * @return {Promise<*>}
 */
export function fetchGameSession (gameToken, serverOptions = {}) {
  const {
    serverHost = config.serverApi.host,
    serverProtocol = config.serverApi.protocol
  } = serverOptions;

  const options = {
    method: 'GET',
    uri: `${serverProtocol}://${serverHost}/api/game/session/${gameToken}`,
    json: true
  };
  return request( options ).then(({ response }) => {
    return response;
  });
}