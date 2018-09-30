import { NetworkPlayer } from "./network-player";
import { CharactersMap, CharactersMapReverted, LivingObjectType } from "../../dictionary";
import { GameStatus } from "../../instance";
import { PlayerEvents } from "./player-events";

export class Player extends NetworkPlayer {

  /**
   * @type {Session}
   * @private
   */
  _session = null;

  /**
   * @type {number|*}
   * @private
   */
  _characterType = null;

  /**
   * @param {Socket} socket
   * @param {Session} session
   */
  constructor (socket, session) {
    super();

    this.setLivingObjectType( LivingObjectType.PLAYER );
    this.setSocket( socket );
    this.setSession( session );
    this.setName( this.nickname );
  }

  /**
   * @param {Session} session
   */
  setSession (session) {
    this._session = session;
  }

  /**
   * @param {Socket} socket
   * @param {Session} session
   */
  repair (socket, session) {
    this.setSocket( socket );
    this.setSession( session );
    this.cancelConnectionTimeout();
  }

  /**
   * Select hero
   */
  selectCharacter () {
    const socket = this.socket;
    socket.emit( PlayerEvents.SELECT_CHARACTER );
    socket.once( PlayerEvents.CHARACTER_SELECTED, this._onCharacterSelected.bind( this ) );
  }

  /**
   * @param {number} characterType
   */
  setCharacterType (characterType) {
    const gameStatus = GameStatus.getInstance();
    if (this._characterType
      && !gameStatus.isAvailableToConnect) {
      return;
    }
    this._characterType = characterType in CharactersMapReverted
      ? characterType
      : CharactersMap.MYSTIC;
  }

  /**
   * @returns {User}
   */
  get user () {
    return this._session.User;
  }

  /**
   * @returns {Session}
   */
  get session () {
    return this._session;
  }

  /**
   * @returns {number}
   */
  get userId () {
    return this.user.id;
  }

  /**
   * @returns {string}
   */
  get nickname () {
    return this.user.nickname;
  }

  /**
   * @returns {boolean}
   */
  get isCharacterSelected () {
    return this._characterType !== null;
  }

  /**
   * @returns {number|*}
   */
  get characterType () {
    return this._characterType;
  }

  /**
   * @returns {string}
   */
  get characterTypeName () {
    return CharactersMapReverted[ this._characterType || CharactersMap.MYSTIC ];
  }

  /**
   * @param {number} data
   * @private
   */
  _onCharacterSelected (data) {
    this.setCharacterType( data );

    console.log(
      `[#${this.userId} ${this.nickname}]`,
      `selected "${this.characterTypeName}" as character.`
    );
  }
}