import EventEmitter from 'events';
import { PlayersEvents } from "./players-events";
import { config } from "../../../../config";
import { GameStatus } from "../game-status";
import { PlayerEvents } from "../../objects/player";

export class Players extends EventEmitter {

  /**
   *
   * @type {Map<number, Player>}
   * @private
   */
  _map = new Map();

  /**
   * @type {Players}
   * @private
   */
  static _instance = null;

  /**
   * @returns {Players}
   */
  static getPlayers () {
    if (this._instance) {
      return this._instance;
    }
    return ( this._instance = new Players() );
  }

  /**
   * @param {number} deltaTime
   */
  update (deltaTime) {
    const players = this.players;
    for (let i = 0; i < players.length; ++i) {
      const player = players[ i ];
      player.update( deltaTime );
    }
  }

  /**
   * Checks player in the map by user ID
   *
   * @param {number} userId
   * @returns {boolean}
   */
  hasPlayer (userId) {
    return this._map.has( userId );
  }

  /**
   * Get a player by user ID
   *
   * @param userId
   * @returns {Player | undefined}
   */
  getPlayer (userId) {
    return this._map.get( userId );
  }

  /**
   * Add a player
   *
   * @param {Player} player
   */
  addPlayer (player) {
    const gameStatus = GameStatus.getInstance();

    if (!gameStatus.isAvailableToConnect) {
      throw new Error( 'Unable to join: game already started' );
    } else if (gameStatus.playersNumber >= gameStatus.maxPlayersNumber) {
      throw new Error( 'Unable to join: too many players' );
    }

    this._map.set( player.userId, player );
    this._subscribeEvents( player );
    gameStatus.setPlayersNumber( this.playersNumber );

    this._log( 'addPlayer', `[#${player.userId} ${player.nickname}] joined the server.` );
    this.emit( PlayersEvents.PLAYER_JOINED, player );
  }

  /**
   * @param {number} userId
   */
  deletePlayer (userId) {
    const gameStatus = GameStatus.getInstance();
    const player = this.getPlayer( userId );

    if (player) {
      this._map.delete( userId );
      gameStatus.setPlayersNumber( this.playersNumber );

      this._log( 'deletePlayer', `Player [#${player.userId} ${player.nickname}] left the game.` );
      this.emit( PlayersEvents.PLAYER_LEFT, player );
    }
  }

  /**
   * @param {number} userId
   * @param {Socket} socket
   * @param {Session} session
   */
  repairPlayer (userId, socket, session) {
    const player = this.getPlayer( userId );
    player.repair( socket, session );

    this._log( 'repairPlayer', `Repaired player [#${userId} ${session.nickname}].` );
    this.emit( PlayersEvents.PLAYER_REPAIRED, player );
  }

  /**
   * @returns {Array<Player>}
   */
  get players () {
    return [ ...this._map.values() ];
  }

  /**
   * @returns {number}
   */
  get playersNumber () {
    return this._map.size;
  }

  /**
   * @returns {number}
   */
  get maxPlayersNumber () {
    return config.game.maxPlayersNumber;
  }

  /**
   * @param {Player} player
   * @private
   */
  _subscribeEvents (player) {
    player.on( PlayerEvents.DISCONNECTED, args => this._onPlayerDisconnected( player, args ) );
  }

  /**
   * @param {Player} player
   * @param {boolean} byUser
   * @param {boolean} byServer
   * @private
   */
  _onPlayerDisconnected (player, { byUser = false, byServer = false }) {
    if (byServer) {
      this.deletePlayer( player.userId );
    } else {
      this._log(
        '_onPlayerDisconnected',
        `Player [#${player.userId} ${player.nickname}] disconnected.`
      );
      this.emit( PlayersEvents.PLAYER_DISCONNECTED, player );
    }
  }

  /**
   * @param {string} method
   * @param {*} args
   * @private
   */
  _log (method, ...args) {
    console.log(
      `[(${this.playersNumber}/${this.maxPlayersNumber}) Players#${method}]`,
      ...args
    );
  }
}