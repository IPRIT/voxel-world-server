import * as THREE from 'three';
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
    this._createBufferFrom( model );

    return this;
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
    return ( x << WORLD_MAP_CHUNK_SIZE_POWER )
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
    return !!this._hasBit(
      this.getBufferOffset( x, y, z ),
      y & 0x1f
    );
  }
  
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  addBlock (x, y, z) {
    this._setBit(
      this.getBufferOffset( x, y, z ),
      y & 0x1f
    );
  }
  
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  deleteBlock (x, y, z) {
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
    const bufferOffset = this.getBufferOffset( x, 0, z );
    return this._buffer.slice( bufferOffset, bufferOffset + COLUMN_CAPACITY );
  }
  
  /**
   * Works correctly
   *
   * @param {number} x
   * @param {number} z
   * @returns {number}
   */
  getMinMaxY (x, z) {
    return this.getMinMaxYBetween( x, z, 0, WORLD_MAP_CHUNK_HEIGHT - 1 )
  }
  
  /**
   * @param {number} x
   * @param {number} z
   * @param {number} fromY
   * @param {number} toY
   * @returns {number}
   */
  getMinMaxYBetween (x, z, fromY, toY) {
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
  inside ({ x, y, z }) {
    let restrictions = {
      x: [ 0, this.size.x ],
      y: [ 0, this.size.y ],
      z: [ 0, this.size.z ]
    };
    return x >= restrictions.x[0] && x < restrictions.x[1] &&
      y >= restrictions.y[0] && y < restrictions.y[1] &&
      z >= restrictions.z[0] && z < restrictions.z[1];
  }

  /**
   * Check world coordinates
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  absoluteInside ({ x, y, z }) {
    let restrictions = {
      x: [ this._fromX, this._toX ],
      y: [ this._fromY, this._toY ],
      z: [ this._fromZ, this._toZ ]
    };
    return x > restrictions.x[0] && x < restrictions.x[1] &&
      y >= restrictions.y[0] && y < restrictions.y[1] &&
      z > restrictions.z[0] && z < restrictions.z[1];
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

    // free memory
    model.dispose();
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