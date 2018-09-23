import { LivingObject } from "./living-object";
import { SocketEvents } from "../network/socket-events";

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
  _connectionTimeoutMs = 5000;

  /**
   * @type {number|*}
   * @private
   */
  _connectionTimeout = null;

  /**
   * @type {number|*}
   * @private
   */
  _disconnectedAtMs = null;

  /**
   * @param {Socket} socket
   */
  setSocket (socket) {
    if (this._socket) {
      this.resetSocket();
    }

    this._socket = socket;
    socket.once(SocketEvents.DISCONNECT, _ => this._onDisconnect());
  }

  /**
   * Reset current socket
   */
  resetSocket () {
    this.disconnectClient();
    this._socket.removeAllListeners();
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
    this._disconnectedAtMs = Date.now();
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
      this._disconnectedAtMs = null;
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
   * @returns {number}
   */
  get timeToDisconnectMs () {
    if (!this._disconnectedAtMs) {
      return Infinity;
    }
    return Math.max( 0, this._disconnectedAtMs + this._connectionTimeoutMs - Date.now() );
  }

  /**
   * @private
   */
  _onDisconnect () {
    this.createConnectionTimeout();
    this.emit( NetworkObjectEvents.DISCONNECTED, { byUser: true } );
  }

  /**
   * @private
   */
  _onConnectionTimeout () {
    this.disconnectClient();
    this.emit( NetworkObjectEvents.DISCONNECTED, { byServer: true } );
  }
}