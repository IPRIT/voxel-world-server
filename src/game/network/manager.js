import Socket from 'socket.io';
import { config } from "../../../config";
import { connectionVerifier } from "./utils/index";
import { CharactersMap, CharactersMapReverted } from "../dictionary/characters";
import { revertObject } from "../../utils/game-utils";

export class SocketManager {

  /**
   * @type {*}
   * @private
   */
  _io = null;

  /**
   * @type {SocketManager}
   * @private
   */
  static _instance = null;

  /**
   * @return {SocketManager}
   */
  static getManager () {
    if (this._instance) {
      return this._instance;
    }
    return ( this._instance = new SocketManager() );
  }

  /**
   * @param {Server} server
   */
  initialize (server) {
    this._io = Socket( server, config.socket.options );
    this._io.use( connectionVerifier );
    this._io.on( 'connection', this._onConnection.bind( this ) );
  }

  /**
   * @return {boolean}
   */
  get isInitialized () {
    return !!this._io;
  }

  /**
   * @param {Socket} socket
   * @private
   */
  _onConnection (socket) {
    console.log( '[Socket#connection]', socket.id, 'joined the server.' );
    setInterval(_ => {
      socket.emit( 'test', { a: CharactersMap, b: revertObject( CharactersMap ) }, 'etst' );
    }, 500);
  }
}