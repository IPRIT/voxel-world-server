import { wrapRequest } from "../../../utils";

const status = [ 'free', 'waiting-for-players', 'preparing', 'in-game' ][ Math.floor(Math.random() * 4) ];

/**
 * @param {*} req
 * @param {*} res
 * @param {Function} next
 * @return {Promise<T>|*}
 */
export function getGameStatusRequest (req, res, next) {
  return wrapRequest( getGameStatus, req, res, next );
}

/**
 * @param params
 * @return {Promise<Object>}
 */
export async function getGameStatus (params) {
  return {
    // enum( 'free', 'waiting-for-players', 'preparing', 'in-game', 'unavailable' )
    status,
    playersNumber: 10,
    maxPlayersNumber: 20,
    gameStartedAt: Date.now()
  };
}