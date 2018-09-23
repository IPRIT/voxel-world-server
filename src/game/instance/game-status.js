import EventEmitter from 'eventemitter3';
import { config } from "../../../config";

export const GameStatusEvents = {
  STATUS_CHANGED: 'status-changed',
  WAITING_FOR_PLAYERS_ACTIVATED: 'waiting-for-players-activated',
  PREPARING_ACTIVATED: 'preparing-activated',
  GAME_STARTED: 'game-started',
  GAME_FINISHED: 'game-finished',
  INSTANCE_RECEIVED: 'instance-received',
  PLAYERS_NUMBER_CHANGED: 'players-number-changed'
};

export class GameStatus extends EventEmitter {

  /**
   * @type {Object|null}
   * @private
   */
  _gameInstance = null;

  /**
   * @type {number}
   * @private
   */
  _playersNumber = 0;

  /**
   * @type {number}
   * @private
   */
  _maxPlayersNumber = config.game.maxPlayersNumber || 50;

  /**
   * @type {string}
   * @private
   */
  _status = GameStatus.Statuses.FREE;

  /**
   * @type {Date}
   * @private
   */
  _waitingStartedAt = null;

  /**
   * @type {Date}
   * @private
   */
  _preparingStartedAt = null;

  /**
   * @type {Date}
   * @private
   */
  _finishedAt = null;

  /**
   * @type {Date}
   * @private
   */
  _gameStartedAt = null;

  /**
   * @type {{FREE: string, WAITING_FOR_PLAYERS: string, PREPARING: string, IN_GAME: string, UNAVAILABLE: string}}
   */
  static Statuses = {
    FREE: 'free',
    WAITING_FOR_PLAYERS: 'waiting-for-players',
    PREPARING: 'preparing',
    IN_GAME: 'in-game',
    UNAVAILABLE: 'unavailable',
    FINISHED: 'finished'
  };

  /**
   * @type {GameStatus}
   * @private
   */
  static _instance = null;

  /**
   * @return {GameStatus}
   */
  static getInstance () {
    if (this._instance) {
      return this._instance;
    }
    return ( this._instance = new GameStatus() );
  }

  /**
   * @return {{
   *  playersNumber: number,
   *  maxPlayersNumber: number,
   *  status: string,
   *  isWaitingForPlayers: boolean,
   *  isPreparing: boolean,
   *  isStarted: boolean,
   *  gameStartedAt: Date,
   *  waitingStartedAt: Date,
   *  preparingStartedAt: Date
   * }}
   */
  getActualStatus () {
    return {
      // players
      playersNumber: this._playersNumber,
      maxPlayersNumber: this._maxPlayersNumber,

      // status
      status: this._status,
      isWaitingForPlayers: this.isWaitingForPlayers,
      isPreparing: this.isPreparing,
      isStarted: this.isStarted,
      gameStartedAt: this._gameStartedAt,
      waitingStartedAt: this._waitingStartedAt,
      preparingStartedAt: this._preparingStartedAt,

      // game instance
      instance: this._gameInstance
    };
  }

  /**
   * @param {string} status
   */
  setStatus (status) {
    if (!this._hasStatus( status )) {
      throw new RangeError( `status "${status}" does not supported` );
    }

    const oldStatus = this._status;
    this._status = status;

    if (oldStatus !== status) {
      this._fireStatusEvents( status, oldStatus );
    }
  }

  /**
   * @param {Object} instance
   */
  setInstance (instance = null) {
    this._gameInstance = instance;

    this.emit( GameStatusEvents.INSTANCE_RECEIVED, instance );
  }

  /**
   * @param {number} playersNumber
   */
  addPlayersNumber (playersNumber = 1) {
    this.setPlayersNumber( playersNumber + this._playersNumber );
  }

  /**
   * @param {number} playersNumber
   */
  setPlayersNumber (playersNumber) {
    if (typeof playersNumber !== 'number') {
      return;
    }

    const oldPlayersNumber = this._playersNumber;
    this._playersNumber = playersNumber;

    if (oldPlayersNumber !== playersNumber) {
      this.emit( GameStatusEvents.PLAYERS_NUMBER_CHANGED, playersNumber );
    }
  }

  /**
   * @return {string}
   */
  get status () {
    return this._status;
  }

  /**
   * @return {number}
   */
  get playersNumber () {
    return this._playersNumber;
  }

  /**
   * @return {number}
   */
  get maxPlayersNumber () {
    return this._maxPlayersNumber;
  }

  /**
   * @return {Date}
   */
  get waitingStartedAt () {
    return this._waitingStartedAt;
  }

  /**
   * @return {Date}
   */
  get preparingStartedAt () {
    return this._preparingStartedAt;
  }

  /**
   * @return {Date}
   */
  get gameStartedAt () {
    return this._gameStartedAt;
  }

  /**
   * @return {boolean}
   */
  get isAvailableToConnect () {
    const statuses = GameStatus.Statuses;
    return [ statuses.WAITING_FOR_PLAYERS, statuses.PREPARING ].includes( this._status );
  }

  /**
   * @return {boolean}
   */
  get isFree () {
    return this._status === GameStatus.Statuses.FREE;
  }

  /**
   * @return {boolean}
   */
  get isFinished () {
    return this._status === GameStatus.Statuses.FINISHED;
  }

  /**
   * @return {boolean}
   */
  get isWaitingForPlayers () {
    return this._status === GameStatus.Statuses.WAITING_FOR_PLAYERS;
  }

  /**
   * @return {boolean}
   */
  get isPreparing () {
    return this._status === GameStatus.Statuses.PREPARING;
  }

  /**
   * @return {boolean}
   */
  get isStarted () {
    return this._status === GameStatus.Statuses.IN_GAME;
  }

  /**
   * @return {boolean}
   */
  get hasInstance () {
    return !!this._gameInstance;
  }

  /**
   * @return {Object}
   */
  get gameInstance () {
    return this._gameInstance;
  }

  /**
   * @param {string} status
   * @return {boolean}
   * @private
   */
  _hasStatus (status) {
    return Object.values( GameStatus.Statuses ).some(value => {
      return value === status;
    });
  }

  /**
   * @param {string} status
   * @param {string} oldStatus
   * @private
   */
  _fireStatusEvents (status, oldStatus) {
    this.emit( GameStatusEvents.STATUS_CHANGED, status, oldStatus );

    if (status === GameStatus.Statuses.IN_GAME) {
      // in-game
      this._gameStartedAt = new Date();
      this.emit( GameStatusEvents.GAME_STARTED );
    } else if (status === GameStatus.Statuses.WAITING_FOR_PLAYERS) {
      // waiting-for-players
      this._waitingStartedAt = new Date();
      this.emit( GameStatusEvents.WAITING_FOR_PLAYERS_ACTIVATED );
    } else if (status === GameStatus.Statuses.PREPARING) {
      // preparing
      this._preparingStartedAt = new Date();
      this.emit( GameStatusEvents.PREPARING_ACTIVATED );
    } else if (status === GameStatus.Statuses.FINISHED) {
      // finished
      this._finishedAt = new Date();
      this.emit( GameStatusEvents.GAME_FINISHED );
    }
  }
}
