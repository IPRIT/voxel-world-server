import { fetchGameSession } from "../../methods";
import { GameStatus } from "../../game";

const defaultErrorCode = 'invalid_game_session';

/**
 * @param {*} request
 * @param {Function} next
 */
export function connectionVerifier ({ handshake = {} }, next) {
  const { query = {} } = handshake;
  const { sessionToken } = query;

  if (!sessionToken) {
    return next( new Error( defaultErrorCode ) );
  }

  return verifyToken( sessionToken ).then(session => {
    return verifyInstance( session );
  }).then(_ => next()).catch( next );
}

/**
 * @param {string} sessionToken
 * @param {*} serverOptions
 * @return {Promise<boolean>}
 */
export async function verifyToken (sessionToken, serverOptions = {}) {
  console.log( `[Socket#connection] verifying game token (${sessionToken.slice(0, 10)}...).` );

  return fetchGameSession( sessionToken, serverOptions ).then(session => {
    console.log( `[Socket#connection] game token (${sessionToken.slice(0, 10)}...) verified by server!` );
    return session;
  }).catch(({ error = {} } = {}) => {
    console.log( `[Socket#connection] game token (${sessionToken.slice(0, 10)}...) declined by server.` );
    const serverError = error.error || {};
    throw new Error( serverError.code || defaultErrorCode );
  });
}

/**
 * @param session
 * @return {*}
 */
export function verifyInstance (session) {
  const gameStatus = GameStatus.getInstance();

  if (!gameStatus.isAvailableToConnect || !gameStatus.gameInstance) {
    throw new Error( 'unable_to_connect' );
  } else if (gameStatus.gameInstance.id !== session.instanceId) {
    throw new Error( 'access_denied' );
  }

  return session;
}