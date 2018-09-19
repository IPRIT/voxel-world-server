export function revertObject (object) {
  return Object.keys( object ).reduce((result, key) => {
    const value = object[ key ];
    Reflect.set( object, value, key.toLowerCase() );
    return object;
  }, {});
}