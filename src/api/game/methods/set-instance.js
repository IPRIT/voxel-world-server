import { wrapRequest } from "../../../utils";
import { ApiError } from "../../error";
import { GameStatus } from "../../../game";

/**
 * @param {*} req
 * @param {*} res
 * @param {Function} next
 * @return {Promise<T>|*}
 */
export function setInstanceRequest (req, res, next) {
  return wrapRequest( setInstance, req, res, next );
}

/**
 * @param {{ instance: Object }} params
 * @return {Promise<Object>}
 */
export async function setInstance (params) {
  const {
    instance = null
  } = params;

  const gameStatus = GameStatus.getInstance();

  if (gameStatus.hasInstance) {
    throw new ApiError( 'instance_already_set' );
  }

  gameStatus.setInstance( instance );
  gameStatus.setStatus( GameStatus.Statuses.WAITING_FOR_PLAYERS );

  return gameStatus.getActualStatus();
}