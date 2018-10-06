import EventEmitter from 'events';
import Promise from 'bluebird';
import * as THREE from 'three';
import { buildChunkIndex, floorVector, parseChunkIndex } from "../../../utils/game-utils";
import {
  WORLD_MAP_CHUNK_HEIGHT,
  WORLD_MAP_CHUNK_SIZE,
  WORLD_MAP_CHUNK_SIZE_VECTOR,
  WORLD_MAP_CHUNK_VIEW_DISTANCE,
  WORLD_MAP_SIZE
} from "../../vars";
import { ChunkLoader } from "./chunk";

export class WorldMap extends EventEmitter {

  /**
   * @type {boolean}
   * @private
   */
  _isLoaded = false;

  /**
   * @type {THREE.Vector3}
   * @private
   */
  _chunkSize = new THREE.Vector3( ...WORLD_MAP_CHUNK_SIZE_VECTOR );

  /**
   * @type {WorldMap}
   * @private
   */
  static _instance = null;

  /**
   * @returns {WorldMap}
   */
  static getMap () {
    if (this._instance) {
      return this._instance;
    }
    return ( this._instance = new WorldMap() );
  }

  /**
   * @returns {Promise<*>}
   */
  load () {
    return Promise.try(_ => {
      const chunksToLoad = this.getVisibleChunks( this.center, 1e9 );

      return this._loadChunks( chunksToLoad );
    }).then(chunks => {
      return chunks;
    });
  }

  /**
   * @param {THREE.Vector3|Vector3} center
   * @param {number} viewDistance
   * @returns {Array<string>}
   */
  getVisibleChunks (center = new THREE.Vector3(0, 0, 0), viewDistance = WORLD_MAP_CHUNK_VIEW_DISTANCE) {
    center = new THREE.Vector3( center.x, center.y, center.z );

    const visibleChunksBox = this.getVisibleChunksBox( center, viewDistance );
    const chunkIndexes = [];

    for (let xIndex = visibleChunksBox.from.x; xIndex <= visibleChunksBox.to.x; ++xIndex) {
      for (let zIndex = visibleChunksBox.from.z; zIndex <= visibleChunksBox.to.z; ++zIndex) {
        chunkIndexes.push( buildChunkIndex( xIndex, zIndex ) );
      }
    }

    return chunkIndexes;
  }

  /**
   * @param {THREE.Vector3|Vector3} center
   * @param {number} viewDistance
   * @returns {{from: THREE.Vector3|Vector3, to: THREE.Vector3|Vector3}}
   * @private
   */
  getVisibleChunksBox (center, viewDistance) {
    center = new THREE.Vector3( center.x, center.y, center.z );

    let visibleBox = this.getVisibleBox( center, viewDistance );
    return {
      from: floorVector( visibleBox.from.clone().divide( this._chunkSize ).setY(0) ),
      to: floorVector( visibleBox.to.clone().divide( this._chunkSize ).setY(0) )
    };
  }

  /**
   * @param {THREE.Vector3|Vector3} center
   * @param {number} viewDistance
   * @returns {{from: THREE.Vector3|Vector3, to: THREE.Vector3|Vector3}}
   */
  getVisibleBox (center, viewDistance) {
    center = new THREE.Vector3( center.x, center.y, center.z );

    let worldBorders = [
      new THREE.Vector3( 0, 0, 0 ),
      new THREE.Vector3( WORLD_MAP_SIZE - 1, WORLD_MAP_CHUNK_HEIGHT - 1, WORLD_MAP_SIZE - 1 )
    ];

    let viewAreaBox = new THREE.Vector3(
      WORLD_MAP_CHUNK_SIZE * viewDistance,
      WORLD_MAP_CHUNK_HEIGHT,
      WORLD_MAP_CHUNK_SIZE * viewDistance
    );

    /**
     * @type {THREE.Vector3|Vector3}
     */
    let viewBorderFrom = center.clone()
      .sub( viewAreaBox )
      .sub( this._chunkSize.clone().subScalar(1) )
      .max( worldBorders[0] )
      .divide( this._chunkSize );

    /**
     * @type {THREE.Vector3|Vector3}
     */
    let viewBorderTo = center.clone()
      .add( viewAreaBox )
      .add( this._chunkSize.clone().subScalar(1) )
      .min( worldBorders[1] )
      .divide( this._chunkSize );

    floorVector( viewBorderFrom );
    floorVector( viewBorderTo );

    viewBorderFrom.multiply( this._chunkSize );
    viewBorderTo.multiply( this._chunkSize )
      .add( this._chunkSize.clone().subScalar(1) );

    return {
      from: viewBorderFrom,
      to: viewBorderTo
    };
  }

  /**
   * @returns {boolean}
   */
  get isLoaded () {
    return this._isLoaded;
  }

  /**
   * @returns {THREE.Vector3|Vector3}
   */
  get center () {
    return new THREE.Vector3(
      WORLD_MAP_SIZE << 1,
      WORLD_MAP_CHUNK_HEIGHT << 1,
      WORLD_MAP_SIZE << 1
    );
  }

  /**
   * @param {Array<string>} chunksToLoad
   * @returns {Promise<Array<Chunk>>}
   * @private
   */
  _loadChunks (chunksToLoad) {
    const loader = new ChunkLoader();
    return Promise.resolve( chunksToLoad ).map(chunkIndex => {
      const [ x, z ] = parseChunkIndex( chunkIndex );
      return loader.load( x, z );
    }, { concurrency: 100 });
  }
}