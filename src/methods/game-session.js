import { config } from "../../config";
import request from "request-promise";

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

  const endpoint = `${serverProtocol}://${serverHost}/api/game/session/${gameToken}`;

  const options = {
    method: 'GET',
    uri: endpoint,
    json: true
  };
  return request( options ).then(({ response }) => {
    return response;
  });
}