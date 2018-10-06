import { ChunkHeightMap } from "./chunk-height-map";
import { buildChunkIndex, rgbToInt } from "../../../../utils/game-utils";
import {
  WORLD_MAP_CHUNK_HEIGHT,
  WORLD_MAP_CHUNK_HEIGHT_POWER,
  WORLD_MAP_CHUNK_SIZE,
  WORLD_MAP_CHUNK_SIZE_POWER
} from "../../../vars";

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
   * Block value represents as unsigned integer value
   * Structure: [R-color]  [G-color]  [B-color]  [0][00]   [below_back_left_right_above_front]
   *            8bit       8bit       8bit       2bit(ff)  6bit(faces)
   * @type {Uint32Array}
   * @private
   */
  _blocks = new Uint32Array( 0 );

  /**
   * @type {boolean}
   * @private
   */
  _inited = false;

  /**
   * @type {ChunkHeightMap}
   * @private
   */
  _heightMap = null;

  /**
   * @type {boolean}
   */
  needsUpdate = false;

  /**
   * @param {VoxModel} model
   * @param {number} x
   * @param {number} z
   */
  constructor (model, { x, z }) {
    if (!model) {
      throw new TypeError( `Model is empty. Expected: VoxModel, got: ${model}` );
    }
    this._model = model;
    this._setPosition( x, z );
  }

  /**
   * Initializing chunk buffer
   * @returns {Chunk}
   */
  init () {
    this._createBlocksBuffer();
    this._createHeightMap();
    this._buildModel();
    this._inited = true;
    this._model = null;

    return this;
  }

  /**
   * Computes buffer offset
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {number}
   */
  blockIndex (x, y, z) {
    return ((x << WORLD_MAP_CHUNK_HEIGHT_POWER) << WORLD_MAP_CHUNK_SIZE_POWER)
      + (y << WORLD_MAP_CHUNK_SIZE_POWER)
      + z;
  }

  /**
   * @param {number} index
   * @returns {{x: number, y: number, z: number}}
   */
  blockPosition (index) {
    const yz = this.size.y * this.size.z;
    const t1 = index % yz;
    const z = t1 % this.size.z;
    const y = (t1 - z) / this.size.z;
    const x = (index - t1) / yz;
    return { x, y, z };
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param color
   */
  addBlock ({ x, y, z }, color) {
    if (typeof color !== 'number') {
      color = Array.isArray(color)
        ? rgbToInt(color)
        : 0;
    }

    if (!this.inside(x, y, z)) {
      return;
    }

    const blockIndex = this.blockIndex( x, y, z );
    this._blocks[ blockIndex ] = color;
    this._heightMap.addBlock( x, y, z );
    this.needsUpdate = true;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {number}
   */
  getBlock ({ x, y, z }) {
    if (!this.inside(x, y, z)) {
      return 0;
    }
    return this._blocks[ this.blockIndex(x, y, z) ];
  }

  /**
   * @param {{x: number, y: number, z: number}} position
   * @returns {boolean}
   */
  hasBlock (position) {
    return !!this.getBlock(position);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  removeBlock ({ x, y, z }) {
    if (!this.inside(x, y, z)) {
      return;
    }
    const blockIndex = this.blockIndex( x, y, z );
    this._blocks[ blockIndex ] = 0;
    this._heightMap.removeBlock( x, y, z );
    this.needsUpdate = true;
  }

  /**
   * @param {number} x
   * @param {number} z
   * @returns {number}
   */
  getMinMaxBlockY ({ x, z }) {
    return this._heightMap.getMinMaxBlock( x, z );
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
  get blocks () {
    return this._blocks;
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
    return (WORLD_MAP_CHUNK_SIZE ** 2) * WORLD_MAP_CHUNK_HEIGHT;
  }

  /**
   * @return {ChunkHeightMap}
   */
  get heightMap () {
    return this._heightMap;
  }

  /**
   * @returns {THREE.Vector3}
   */
  get fromPosition () {
    return new THREE.Vector3(
      this._fromX,
      this._fromY,
      this._fromZ
    );
  }

  /**
   * @returns {THREE.Vector3}
   */
  get toPosition () {
    return new THREE.Vector3(
      this._toX,
      this._toY,
      this._toZ
    );
  }

  /**
   * @returns {Uint32Array}
   * @private
   */
  _createBlocksBuffer () {
    return (this._blocks = new Uint32Array( this.bufferSize ));
  }

  /**
   * @returns {ChunkHeightMap}
   * @private
   */
  _createHeightMap () {
    return ( this._heightMap = new ChunkHeightMap( this.size ) );
  }

  /**
   * @private
   */
  _buildModel () {
    if (this._inited) {
      return;
    }
    const model = this._model;
    const blocks = model.getBlocks();

    for (let i = 0; i < blocks.length; ++i) {
      this.addBlock( blocks[i], blocks[i].color );
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
}