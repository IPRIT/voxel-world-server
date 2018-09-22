import { LivingObject } from "./living-object";

export const NetworkObjectEvents = {
  DISCONNECTED: 'network.disconnected'
};

export class NetworkObject extends LivingObject {

  /**
   * @type {Socket}
   * @private
   */
  _socket = null;

  /**
   * @type {number}
   * @private
   */
  _connectionTimeoutMs = 60000;

  /**
   * @type {number|*}
   * @private
   */
  _connectionTimeout = null;

  /**
   * @param {Socket} socket
   */
  setSocket (socket) {
    this._socket = socket;

    // todo:
    // socket.once();
  }

  /**
   * Reset current socket
   */
  resetSocket () {
    this._socket = null;
  }

  /**
   * Disconnect client from the server
   */
  disconnectClient () {
    const socket = this._socket;

    if (socket) {
      socket.emit( NetworkObjectEvents.DISCONNECTED, { byServer: true } );
      socket.disconnect( true );
    }
  }

  /**
   * Creates connection timeout
   */
  createConnectionTimeout () {
    if (this.hasConnectionTimeout) {
      this.cancelConnectionTimeout();
    }
    this._connectionTimeout = setTimeout(_ => {
      this._onConnectionTimeout();
    }, this._connectionTimeoutMs);
  }

  /**
   * Clear connection timeout
   */
  cancelConnectionTimeout () {
    if (this.hasConnectionTimeout) {
      clearTimeout( this._connectionTimeout );
      this._connectionTimeout = null;
    }
  }

  /**
   * @returns {Socket}
   */
  get socket () {
    return this._socket;
  }

  /**
   * @returns {boolean}
   */
  get hasConnectionTimeout () {
    return !!this._connectionTimeout;
  }

  /**
   * @private
   */
  _onConnectionTimeout () {
    this.disconnectClient();
    this.emit( NetworkObjectEvents.DISCONNECTED, { byServer: true } );
  }
}