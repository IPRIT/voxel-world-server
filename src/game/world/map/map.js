import EventEmitter from 'events';
import Promise from 'bluebird';
import * as THREE from 'three';
import { ChunkLoader } from "./chunk";
import { buildChunkIndex, floorVector, hasBit, parseChunkIndex, powers } from "../../../utils/game-utils";
import {
  WORLD_MAP_CHUNK_HEIGHT, WORLD_MAP_CHUNK_HEIGHT_POWER,
  WORLD_MAP_CHUNK_SIZE,
  WORLD_MAP_CHUNK_SIZE_VECTOR,
  WORLD_MAP_CHUNK_VIEW_DISTANCE,
  WORLD_MAP_SIZE, WORLD_MAP_SIZE_POWER
} from "../../vars";
import { MapCollisions } from "./collisions/map-collisions";

const COLUMN_CAPACITY = 2 ** Math.max(0, WORLD_MAP_CHUNK_HEIGHT_POWER - 5 );

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
   * @type {Uint32Array}
   * @private
   */
  _buffer = new Uint32Array( 0 );

  /**
   * @type {MapCollisions}
   * @private
   */
  _collisions = new MapCollisions();

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
  async load () {
    if (this._isLoaded) {
      return;
    }
    this._buffer = new Uint32Array( this.bufferSize );

    return Promise.try(_ => {
      const chunksToLoad = this.getVisibleChunks( this.center, 1e9 );
      return this._loadChunks( chunksToLoad );
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
   * Computes buffer offset
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {number}
   */
  getBufferOffset (x, y, z) {
    return ( x << WORLD_MAP_SIZE_POWER )
      + ( y >> 5 )
      + z;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  hasBlock (x, y, z) {
    if (!this.isInside( x, y, z )) {
      return false;
    }

    return !!this._hasBit(
      this.getBufferOffset( x, y, z ),
      y & 0x1f
    );
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  addBlock (x, y, z) {
    if (!this.isInside( x, y, z )) {
      return;
    }

    this._setBit(
      this.getBufferOffset( x, y, z ),
      y & 0x1f
    );
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  deleteBlock (x, y, z) {
    if (!this.isInside( x, y, z )) {
      return;
    }

    this._unsetBit(
      this.getBufferOffset( x, y, z ),
      y & 0x1f
    );
  }

  /**
   * @param {number} x
   * @param {number} z
   * @returns {Uint32Array}
   */
  getColumn (x, z) {
    if (!this.isInside( x, 0, z )) {
      return new Uint32Array( 0 );
    }

    const bufferOffset = this.getBufferOffset( x, 0, z );
    return this._buffer.slice( bufferOffset, bufferOffset + COLUMN_CAPACITY );
  }

  /**
   * @param {number} x
   * @param {number} z
   * @returns {number}
   */
  getMinMaxY (x, z) {
    return this.getMinMaxYBetween( x, z, 0, WORLD_MAP_CHUNK_HEIGHT - 1 );
  }

  /**
   * Works correctly
   *
   * @param {number} x
   * @param {number} z
   * @param {number} fromY
   * @param {number} toY
   * @returns {number}
   */
  getMinMaxYBetween (x, z, fromY, toY) {
    if (!this.isInside( x, 0, z )) {
      return 0;
    }

    let column = this.getColumn( x, z );
    let minMaxY = 0, minY = -1;

    fromY = Math.max( fromY, 0 );
    toY = Math.min( toY, WORLD_MAP_CHUNK_HEIGHT - 1 );

    const minColumn = Math.max( fromY >> 5, 0 );
    const maxColumn = Math.min( toY >> 5, column.length - 1 );

    l1: for (let columnOffset = minColumn; columnOffset <= maxColumn; ++columnOffset) {
      const value = column[ columnOffset ];

      for (let y = fromY & 0x1f; y <= ( toY & 0x1f ); ++y) {
        if (hasBit( value, y )) {
          minMaxY = columnOffset * 0x20 + y;
          if (minY === -1) {
            minY = columnOffset * 0x20 + y;
          }
        } else if (minY >= 0) {
          break l1;
        }
      }
    }

    return minMaxY;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  isInside (x, y, z) {
    return x >= 0 && x < WORLD_MAP_SIZE
      && z >= 0 && z < WORLD_MAP_SIZE
      && y >= 0 && y < WORLD_MAP_CHUNK_HEIGHT;
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
   * @returns {number}
   * @override
   */
  get bufferSize () {
    return ( WORLD_MAP_SIZE ** 2 ) * COLUMN_CAPACITY;
  }

  /**
   * @returns {MapCollisions}
   */
  get collisions () {
    return this._collisions;
  }

  /**
   * @param {Array<string>} chunksToLoad
   * @returns {Promise<void>}
   * @private
   */
  _loadChunks (chunksToLoad) {
    const startedAt = Date.now();

    const loader = new ChunkLoader();
    return Promise.resolve( chunksToLoad ).map(chunkIndex => {
      const [ x, z ] = parseChunkIndex( chunkIndex );
      return loader.load( x, z ).then(model => {
        this._fillFromModel(
          model,
          x * WORLD_MAP_CHUNK_SIZE,
          z * WORLD_MAP_CHUNK_SIZE
        );
        // free memory
        model.dispose();
      });
    }, { concurrency: 30 }).tap(({ length }) => {
      const timeElapsed = Date.now() - startedAt;
      console.log( `[WorldMap] ${length} chunks has been loaded into memory in ${timeElapsed} ms.` );
      console.log( `[WorldMap] Buffer size: ${this._buffer.length}.` );
    });
  }

  /**
   * @param {VoxModel} model
   * @param {number} offsetX
   * @param {number} offsetZ
   * @private
   */
  _fillFromModel (model, offsetX, offsetZ) {
    const blocks = model.getBlocks();

    for (let i = 0; i < blocks.length; ++i) {
      const { x, y, z } = blocks[ i ];
      this.addBlock( offsetX + x, y, offsetZ + z );
    }
  }

  /**
   * @param {number} bufferOffset
   * @param {number} bitPosition
   * @returns {number} 0 or 1
   * @private
   */
  _hasBit (bufferOffset, bitPosition) {
    return this._buffer[ bufferOffset ] & powers.powersOfTwo[ bitPosition ];
  }

  /**
   * @param {number} bufferOffset
   * @param {number} bitPosition
   * @private
   */
  _setBit (bufferOffset, bitPosition) {
    this._buffer[ bufferOffset ] |= powers.powersOfTwo[ bitPosition ];
  }

  /**
   * @param {number} bufferOffset
   * @param {number} bitPosition
   * @private
   */
  _unsetBit (bufferOffset, bitPosition) {
    this._buffer[ bufferOffset ] &= ~powers.powersOfTwo[ bitPosition ];
  }
}