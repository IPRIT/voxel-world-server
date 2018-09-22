import { NetworkObject } from "../network-object";

export class Player extends NetworkObject {

  /**
   * @type {Session}
   * @private
   */
  _session = null;

  /**
   * @param {Socket} socket
   * @param {Session} session
   */
  constructor (socket, session) {
    super();

    this.setSocket( socket );
    this.setSession( session );
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
}