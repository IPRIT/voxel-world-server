import { EventEmitter } from 'events';

export class NetworkObject extends EventEmitter {

  /**
   * @type {Socket}
   * @private
   */
  _socket = null;

  /**
   * @param {Socket} socket
   */
  setSocket (socket) {
    this._socket = socket;
  }

  /**
   * @returns {Socket}
   */
  get socket () {
    return this._socket;
  }
}