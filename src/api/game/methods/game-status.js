import { wrapRequest } from "../../../utils";
import Promise from 'bluebird';
import { GameStatus } from "../../../game";

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
  const gameStatus = GameStatus.getInstance();
  return gameStatus.getActualStatus();
}