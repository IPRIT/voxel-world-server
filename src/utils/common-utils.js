/**
 * @param {Object} object
 * @returns {Object}
 */
export function revertObject (object) {
  return Object.keys( object ).reduce((result, key) => {
    const value = object[ key ];
    Reflect.set( result, value, key.toLowerCase() );
    return result;
  }, {});
}

/**
 * @param objects
 * @returns {*}
 */
export function extendDeep (...objects) {
  if (objects.length === 1) {
    return objects[ 0 ];
  }

  let result = {};
  for (let i = 0; i < objects.length; ++i) {
    mergeDeep( result, objects[ i ] );
  }

  return result;
}

/**
 * Custom deep objects merge for particle options
 *
 * @param {*} objectA
 * @param {*} objectB
 */
export function mergeDeep(objectA, objectB) {
  if (typeof objectB !== 'object' || Array.isArray(objectB)) {
    return objectB;
  }

  Object.keys( objectB ).forEach(keyB => {
    if (typeof objectB[ keyB ] === 'object'
      && objectB[ keyB ] !== null
      && !objectB[ keyB ].clone) {
      objectA[ keyB ] = mergeDeep( objectA[ keyB ] || {}, objectB[ keyB ] );
    } else {
      objectA[ keyB ] = objectB[ keyB ];
    }
  });

  return objectA;
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function valueBetween (value, min = -Infinity, max = Infinity) {
  if (min > max) {
    [ min, max ] = [ max, min ];
  }
  return Math.min(
    Math.max( ensureNumber(value), min ),
    max
  );
}

/**
 * @param {number|*} value
 * @returns {number}
 */
export function ensureNumber (value) {
  value = Number( value );
  return Number.isNaN( value ) ? 0 : value;
}