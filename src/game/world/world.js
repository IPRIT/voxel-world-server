import EventEmitter from 'events';
import { Players } from "../instance/players";

export class World extends EventEmitter {

  /**
   * @param {number} deltaTime
   */
  update (deltaTime) {
    this.players.update( deltaTime );
  }

  /**
   * @returns {Players}
   */
  get players () {
    return Players.getPlayers();
  }
}