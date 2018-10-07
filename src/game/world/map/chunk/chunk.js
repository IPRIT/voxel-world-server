import * as THREE from 'three';
import { ChunkHeightMap } from "./chunk-height-map";
import { buildChunkIndex, hasBit, lowestMaxBit, powers } from "../../../../utils/game-utils";
import {
  WORLD_MAP_CHUNK_HEIGHT,
  WORLD_MAP_CHUNK_HEIGHT_POWER,
  WORLD_MAP_CHUNK_SIZE,
  WORLD_MAP_CHUNK_SIZE_POWER
} from "../../../vars";

const COLUMN_CAPACITY = 2 ** Math.max(0, WORLD_MAP_CHUNK_HEIGHT_POWER - 5 );

export class Chunk {

  /**
   * @type {VoxModel}
   * @private
   */
  _model = null;

  /**
   * @type {number}
   * @private
   */
  _chunkIndexX = 0;

  /**
   * @type {number}
   * @private
   */
  _chunkIndexY = 0;

  /**
   * @type {number}
   * @private
   */
  _chunkIndexZ = 0;

  /**
   * @type {number}
   * @private
   */
  _fromX = 0;

  /**
   * @type {number}
   * @private
   */
  _fromY = 0;

  /**
   * @type {number}
   * @private
   */
  _fromZ = 0;

  /**
   * @type {number}
   * @private
   */
  _toX = 0;

  /**
   * @type {number}
   * @private
   */
  _toY = 0;

  /**
   * @type {number}
   * @private
   */
  _toZ = 0;

  /**
   * @type {Uint32Array}
   * @private
   */
  _buffer = new Uint32Array( 0 );

  /**
   * @type {boolean}
   * @private
   */
  _inited = false;

  /**
   * @type {boolean}
   */
  needsUpdate = false;

  /**
   * @param {number} x
   * @param {number} z
   */
  constructor ({ x, z }) {
    this._setPosition( x, z );
  }
  
  /**
   * @param {VoxModel} model
   */
  createFrom (model) {
    this._createBufferFrom( model )
  }

  /**
   * Initializing chunk buffer
   * @returns {Chunk}
   */
  init () {
    this._createBlocksBuffer();
    this._inited = true;
    this._model = null;

    return this;
  }

  /**
   * Computes buffer offset
   *
   * @param {number} x
   * @param {number} z
   * @returns {number}
   */
  getBufferOffset (x, z) {
    return ( x << WORLD_MAP_CHUNK_SIZE_POWER ) + z;
  }
  
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  hasBlock (x, y, z) {
    return !!this._hasBit( (x << WORLD_MAP_CHUNK_SIZE_POWER) + z, y );
  }
  
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  addBlock (x, y, z) {
    this._setBit( (x << WORLD_MAP_CHUNK_SIZE_POWER) + z, y );
  }
  
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  removeBlock (x, y, z) {
    this._unsetBit( (x << WORLD_MAP_CHUNK_SIZE_POWER) + z, y );
  }
  
  /**
   * @param {number} x
   * @param {number} z
   * @returns {number}
   */
  getColumn (x, z) {
    return this._buffer[ (x << WORLD_MAP_CHUNK_SIZE_POWER) + z ];
  }
  
  /**
   * This method is faster than getMinMaxBlock2 relying on the performance test
   *
   * @param {number} x
   * @param {number} z
   * @returns {number}
   */
  getMinMaxBlock (x, z) {
    let column = this.getColumn( x, z );
    let minMaxY = 0, minY = -1;
    for (let y = 0; y < WORLD_MAP_CHUNK_HEIGHT; ++y) {
      if (hasBit( column, y )) {
        minMaxY = y;
        if (minY === -1) {
          minY = y;
        }
      } else if (minY >= 0) {
        break;
      }
    }
    return minMaxY;
  }
  
  /**
   * @param {number} x
   * @param {number} z
   * @returns {number}
   */
  getMinMaxBlock2 (x, z) {
    let column = this.getColumn( x, z );
    if (!column) {
      return 0;
    }
    let minMax = lowestMaxBit( column );
    if (minMax < 0) {
      return 30; // lowestMaxBit returns negative value when log2 is 30 (single case)
    }
    // lowestMaxBit returns zero when power of 2 is 31 (single case)
    return minMax === 0 ? 31 : powers.powersOfTwoInv[ minMax ]; // minMax always power of 2
  }
  
  /**
   * @param {number} x
   * @param {number} z
   * @param {number} fromY
   * @param {number} toY
   * @returns {number}
   */
  getMinMaxBlockBetween (x, z, fromY, toY) {
    let column = this.getColumn( x, z );
    let minMaxY = fromY, minY = -1;
    for (let y = fromY; y < toY; ++y) {
      if (hasBit( column, y )) {
        minMaxY = y;
        if (minY === -1) {
          minY = y;
        }
      } else if (minY >= 0) {
        break;
      }
    }
    return minMaxY;
  }

  /**
   * @param {number|THREE.Vector3} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  inside (x, y, z) {
    if (typeof x === 'object') {
      const position = x;
      x = position.x;
      y = position.y;
      z = position.z;
    }
    let limits = {
      x: [ 0, this.size.x ],
      y: [ 0, this.size.y ],
      z: [ 0, this.size.z ]
    };
    return x >= limits.x[0] && x < limits.x[1] &&
      y >= limits.y[0] && y < limits.y[1] &&
      z >= limits.z[0] && z < limits.z[1];
  }

  /**
   * Check world coordinates
   *
   * @param {number|THREE.Vector3|Vector3} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  absoluteInside (x, y, z) {
    if (typeof x === 'object') {
      const position = x;
      x = position.x;
      y = position.y;
      z = position.z;
    }
    let limits = {
      x: [this._fromX, this._toX],
      y: [this._fromY, this._toY],
      z: [this._fromZ, this._toZ]
    };
    return x > limits.x[0] && x < limits.x[1] &&
      y >= limits.y[0] && y < limits.y[1] &&
      z > limits.z[0] && z < limits.z[1];
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  computeWorldPosition ({ x, y, z }) {
    return {
      x: x + this._fromX,
      y: y + this._fromY,
      z: z + this._fromZ
    };
  }

  /**
   * @returns {string}
   */
  get chunkIndex () {
    return buildChunkIndex( this._chunkIndexX, this._chunkIndexZ );
  }

  /**
   * @returns {Uint32Array}
   */
  get buffer () {
    return this._buffer;
  }

  /**
   * @returns {VoxModel|function}
   */
  get model () {
    return this._model;
  }

  /**
   * @returns {boolean}
   */
  get inited () {
    return this._inited;
  }

  /**
   * @returns {{x: number, y: number, z: number}}
   */
  get size () {
    return {
      x: WORLD_MAP_CHUNK_SIZE,
      y: WORLD_MAP_CHUNK_HEIGHT,
      z: WORLD_MAP_CHUNK_SIZE
    };
  }

  /**
   * @returns {number}
   * @override
   */
  get bufferSize () {
    return ( WORLD_MAP_CHUNK_SIZE ** 2 ) * COLUMN_CAPACITY;
  }

  /**
   * @returns {THREE.Vector3|Vector3}
   */
  get fromPosition () {
    return new THREE.Vector3(
      this._fromX,
      this._fromY,
      this._fromZ
    );
  }

  /**
   * @returns {THREE.Vector3|Vector3}
   */
  get toPosition () {
    return new THREE.Vector3(
      this._toX,
      this._toY,
      this._toZ
    );
  }

  /**
   * @param {VoxModel} model
   * @private
   */
  _createBufferFrom (model) {
    if (this._inited) {
      return;
    }
    
    this._buffer = new Uint32Array( this.bufferSize );
    
    const blocks = model.getBlocks();

    for (let i = 0; i < blocks.length; ++i) {
      const { x, y, z } = blocks[ i ];
      this.addBlock( x, y, z );
    }
  }

  /**
   * @param {number} x
   * @param {number} z
   * @private
   */
  _setPosition (x, z) {
    this._fromX = this._chunkIndexX * WORLD_MAP_CHUNK_SIZE;
    this._fromY = 0;
    this._fromZ = this._chunkIndexZ * WORLD_MAP_CHUNK_SIZE;

    this._toX = this._fromX + WORLD_MAP_CHUNK_SIZE;
    this._toY = this._fromY + WORLD_MAP_CHUNK_HEIGHT;
    this._toZ = this._fromZ + WORLD_MAP_CHUNK_SIZE;
  }
  
  /**
   * @param {number} bufferOffset
   * @param {number} bitPosition
   * @returns {number} 0 or 1
   * @private
   */
  _hasBit (bufferOffset, bitPosition) {
    return this._buffer[ bufferOffset ] & (1 << bitPosition);
  }
  
  /**
   * @param {number} bufferOffset
   * @param {number} bitPosition
   * @private
   */
  _setBit (bufferOffset, bitPosition) {
    this._buffer[ bufferOffset ] |= 1 << bitPosition;
  }
  
  /**
   * @param {number} bufferOffset
   * @param {number} bitPosition
   * @private
   */
  _unsetBit (bufferOffset, bitPosition) {
    this._buffer[ bufferOffset ] &= ~( 1 << bitPosition );
  }
}