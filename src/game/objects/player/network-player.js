import { LivingObject } from "../living-object";
import { SocketEvents } from "../../network/socket-events";
import { PlayerEvents } from "./player-events";
import { ensureNumber } from "../../../utils/common-utils";

export class NetworkPlayer extends LivingObject {

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
   * @type {Map<string, number>}
   * @private
   */
  _lastActionMap = new Map();

  /**
   * @param {Socket} socket
   */
  setSocket (socket) {
    if (this._socket) {
      this.resetSocket();
    }

    this._socket = socket;
    this._subscribeEvents();
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
      socket.emit( PlayerEvents.DISCONNECTED, { byServer: true } );
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
   * @returns {boolean}
   */
  get isConnected () {
    return this._socket
      && this._socket.connected
      && !this.hasConnectionTimeout;
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
    this.emit( PlayerEvents.DISCONNECTED, { byUser: true } );
  }

  /**
   * @private
   */
  _onConnectionTimeout () {
    this.disconnectClient();
    this.emit( PlayerEvents.DISCONNECTED, { byServer: true } );
  }

  /**
   * @private
   */
  _subscribeEvents () {
    const socket = this._socket;
    socket.once( SocketEvents.DISCONNECT, _ => this._onDisconnect() );
    socket.on( PlayerEvents.SET_TARGET_LOCATION, this._onSetTargetLocation.bind( this ) );
    socket.on( PlayerEvents.JUMP, this._onJump.bind( this ) );
    socket.on( PlayerEvents.SET_COMING_STATE, this._onSetComingState.bind( this ) );
  }

  /**
   * @param {Array<number>} location
   * @param {boolean} isInfinite
   * @param {number} calledAtMs
   * @private
   */
  _onSetTargetLocation (location = [], isInfinite = false, calledAtMs = Date.now()) {
    const actionName = 'setTargetLocation';
    if (!location && !this._isNewestAction( actionName, calledAtMs )) {
      return;
    }

    const [ x = 0, y = 0, z = 0 ] = location;
    this.setTargetLocation( { x, y, z }, isInfinite );
  }

  /**
   * @private
   */
  _onJump (calledAtMs = Date.now()) {
    const actionName = 'jump';
    if (!this._isNewestAction( actionName, calledAtMs )) {
      return;
    }

    this.jump();
  }

  /**
   * @param {boolean} state
   * @param {number} calledAtMs
   * @private
   */
  _onSetComingState (state, calledAtMs = Date.now()) {
    const actionName = 'setComingState';
    if (!this._isNewestAction( actionName, calledAtMs )) {
      return;
    }

    this.setComingState( state );
  }

  /**
   * @param {string} action
   * @param {number} value
   * @returns {boolean}
   * @private
   */
  _isNewestAction (action, value) {
    const lastActionAtMs = this._lastActionMap.get( action );
    const isNewest = !lastActionAtMs || !value || value > lastActionAtMs;
    isNewest && this._updateAction( action, value );
    return isNewest;
  }

  /**
   * @param {string} action
   * @param {number} value
   * @private
   */
  _updateAction (action, value) {
    if (value) {
      this._lastActionMap.set( action, ensureNumber( value ) );
    }
  }
}