import EventEmitter from 'events';
import { Players } from "../instance/players";
import { WorldMap } from "./map";

export class World extends EventEmitter {

  constructor () {
    super();

    let map = WorldMap.getMap();
    if (!map.isLoaded) {
      map.load().then(_ => {
        WorldMap._instance = null;
        map = null;
      });
    }
  }

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