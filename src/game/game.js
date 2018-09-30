import * as THREE from 'three';
import raf from 'raf';
import { World } from "./world";
import { FRAMES_DELTA_MS } from "../utils/game-utils";
import { UpdateWarper, UpdateWarperEvents } from "../utils/update-warper";

export class Game {

  /**
   * @type {THREE.Clock}
   * @private
   */
  _clock = null;

  /**
   * @type {UpdateWarper}
   * @private
   */
  _updateWarper = null;

  /**
   * @type {Game}
   * @private
   */
  static _instance = null;

  /**
   * @returns {Game}
   */
  static getInstance () {
    if (this._instance) {
      return this._instance;
    }
    return ( this._instance = new Game() );
  }

  constructor () {
    this._world = new World();
    this._clock = new THREE.Clock( true );

    this._updateWarper = new UpdateWarper( 60, 1 );
    this._updateWarper.on(UpdateWarperEvents.UPDATE, deltaTime => {
      this._world.update( deltaTime );
    });
  }

  update () {
    const deltaTime = this._clock.getDelta();
    this._updateWarper.update( deltaTime );
  }

  /**
   * Starts the game
   */
  start () {
    this.animate();
  }

  animate () {
    this.update();

    raf( this.animate.bind( this ), FRAMES_DELTA_MS );
  }
}