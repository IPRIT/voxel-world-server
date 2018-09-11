import { config } from "../../config";
import request from "request-promise";

/**
 * @param {string} sessionToken
 * @param {*} serverOptions
 * @return {Promise<*>}
 */
export function fetchGameSession (sessionToken, serverOptions = {}) {
  const {
    serverHost = config.serverApi.host,
    serverProtocol = config.serverApi.protocol
  } = serverOptions;

  const endpoint = `${serverProtocol}://${serverHost}/api/game/session/${sessionToken}`;

  const options = {
    method: 'GET',
    uri: endpoint,
    json: true
  };
  return request( options ).then(({ response }) => {
    return response;
  });
}