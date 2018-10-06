import { ensureNumber } from "./common-utils";
import { WORLD_MAP_BLOCK_SIZE } from "../game/vars";

export const FRAMES_PER_SECOND = 60;
export const FRAMES_DELTA_SEC = 1 / 60;
export const FRAMES_DELTA_MS = 1000 / 60;

/**
 * @param {number[]} colorArray
 * @returns {number}
 */
export function rgbToInt(colorArray) {
  return ((colorArray[0] & 0xFF) << 24)
    | ((colorArray[1] & 0xFF) << 16)
    | ((colorArray[2] & 0xFF) << 8)
    | (0 & 0xFF);
}

/**
 * @param {THREE.Vector3|Vector3} vector
 * @returns {THREE.Vector3|Vector3}
 */
export function floorVector (vector) {
  vector.x |= 0;
  vector.y |= 0;
  vector.z |= 0;
  return vector;
}

/**
 * @param {THREE.Vector3|Vector3} vector
 * @returns {boolean}
 */
export function isVectorZeroStrict (vector) {
  return vector.equals({ x: 0, y: 0, z: 0 });
}

/**
 * @param {THREE.Vector3|Vector3} vector
 * @param {number} eps
 * @returns {boolean}
 */
export function isVectorZero (vector, eps = 1e-5) {
  for (let i = 0; i < 3; ++i) {
    if (Math.abs(vector.getComponent( i )) > eps) {
      return false;
    }
  }
  return true;
}

/**
 * @param {number} value
 * @param {number} deltaTime
 * @param {number} framesDeltaSec
 * @returns {number}
 */
export function warp (value, deltaTime, framesDeltaSec = FRAMES_DELTA_SEC) {
  return value * warpRatio( deltaTime, framesDeltaSec );
}

/**
 * @param {number} deltaTime
 * @param {number} framesDeltaSec
 * @returns {number}
 */
export function warpRatio (deltaTime, framesDeltaSec = FRAMES_DELTA_SEC) {
  return deltaTime / framesDeltaSec;
}

/**
 * @param {number} value
 * @param {number} bitIndex
 * @returns {number}
 */
export function hasBit (value, bitIndex) {
  return value & ( 1 << bitIndex );
}

/**
 * @param {number} value
 * @param {number} bitIndex
 * @returns {number}
 */
export function setBit (value, bitIndex) {
  return value | ( 1 << bitIndex );
}

/**
 * @param {number} value
 * @param {number} bitIndex
 * @returns {number}
 */
export function unsetBit (value, bitIndex) {
  return value & ~( 1 << bitIndex );
}

/**
 * @see http://graphics.stanford.edu/~seander/bithacks.html#RoundUpPowerOf2
 * @param {number} v
 * @returns {number}
 */
export function nearestHighestPowerOfTwo (v) {
  v--;
  v |= v >> 1;
  v |= v >> 2;
  v |= v >> 4;
  v |= v >> 8;
  v |= v >> 16;
  return ++v;
}

/**
 * @see http://graphics.stanford.edu/~seander/bithacks.html#DetermineIfPowerOf2
 * @param {number} v
 * @returns {boolean}
 */
export function isPowerOfTwo (v) {
  return v && !(v & (v - 1));
}

/**
 * Computes integer log2 of number
 * @see http://graphics.stanford.edu/~seander/bithacks.html#IntegerLog
 * @param {number} v
 * @returns {number}
 */
export function log2 (v) {
  let b = [ 0x2, 0xC, 0xF0, 0xFF00, 0xFFFF0000 ];
  let S = [ 1, 2, 4, 8, 16 ];
  let r = 0; // result of log2(v) will go here
  for (let i = 4; i >= 0; i--) { // unroll for speed...
    if (v & b[i]) {
      v >>= S[i];
      r |= S[i];
    }
  }
  return r;
}

/**
 * 0000100011110111000 ->
 * 0000100011110111111 ->
 * 0000100011111111000 ^ 0000100011110111111 ->
 * 0000000000001000000 ->
 * 0000000000000100000
 * @param {number} v
 * @returns {number}
 */
export function lowestMaxBit (v) {
  // filling lowest bit set
  v |= v - 1;
  // find difference between current value and value with lowest zero bit "fired"
  v ^= v | (v + 1);
  return v >> 1;
}

const powersOfTwoInv = {
  1: 0
};
const powersOfTwo = {
  0: 1
};

for (let i = 1; i < 32; ++i) {
  const powerOfTwo = powersOfTwo[ i - 1 ] * 2;
  powersOfTwo[ i ] = powerOfTwo;
  powersOfTwoInv[ powerOfTwo ] = i;
}

export const powers = { powersOfTwo, powersOfTwoInv };

/**
 * @param {number} x
 * @param {number} z
 * @returns {string}
 */
export function buildChunkIndex (x, z) {
  return `${x}|${z}`;
}

/**
 * @param {string} value
 * @returns {number[]}
 */
export function parseChunkIndex (value) {
  return value.split( '|' ).map( ensureNumber );
}

/**
 * @param {string} value
 * @returns {THREE.Vector3}
 */
export function parseChunkIndexToVector (value) {
  const parsedIndex = parseChunkIndex( value );
  return new THREE.Vector3( parsedIndex[ 0 ], 0, parsedIndex[ 1 ] );
}

/**
 * @param {THREE.Vector3} position
 * @returns {THREE.Vector3}
 */
export function toBlockPosition (position) {
  return position.clone().divideScalar( WORLD_MAP_BLOCK_SIZE );
}