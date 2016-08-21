/**
 * singpath-core/filters.js - spfShared filter factories.
 */

/**
 * Create a filter checking a an object (including angularFire object) or an
 * arrayis empty.
 *
 * @return {function} [description]
 */
export function spfEmptyFilterFactory() {

  /**
   * Return true if the object is empty or falsy.
   *
   * @param  {any} obj value to test.
   * @return {boolean}
   */
  return function spfEmpty(obj) {
    if (!obj) {
      return true;
    }

    if (obj.hasOwnProperty('$value')) {
      return obj.$value === null;
    }

    if (obj.length !== undefined) {
      return obj.length === 0;
    }

    return Object.keys(obj).length === 0;
  };
}

spfEmptyFilterFactory.$inject = [];

/**
 * Create a filter checking for the length of an array or object.
 *
 * @return {function} [description]
 */
export function spfLengthFilterFactory() {

  /**
   * Return the number of elements (array element or object properties).
   *
   * Returns:
   * - 0 if the object is falsy;
   * - 0 if it's an angularfire object referencing null;
   * - the object element length if it's an array-like object;
   * - or the number of iterable properties otherwise.
   *
   * @param  {any}    obj Object to assess the length.
   * @return {number}
   */
  return function spfLength(obj) {
    if (!obj) {
      return 0;
    }

    if (obj.hasOwnProperty('$value') && obj.$value === null) {
      return 0;
    }

    if (obj.length !== undefined) {
      return obj.length;
    }

    return Object.keys(obj).filter(function(k) {
      return k && k[0] !== '$';
    }).length;
  };
}

spfLengthFilterFactory.$inject = [];

/**
 * Create filter extract the values of an object iterable properties.
 *
 * @return {function}
 */
export function spfToArrayFilterFactory() {

  /**
   * Return the object values.
   *
   * @param  {object} obj Object to convert.
   * @return {array}
   */
  return function spfToArrayFilter(obj) {
    if (!(obj instanceof Object)) {
      return obj;
    }

    return Object.keys(obj).reduce(function(arr, key) {
      if (!key || key[0] === '$') {
        return arr;
      }

      const value = obj[key];

      if (!(obj instanceof Object) || value.$$hashkey) {
        arr.push(value);
        return arr;
      }

      arr.push(Object.defineProperty(
        value,
        '$$hashKey',
        {__proto__: null, value: key}
      ));
      return arr;
    }, []);
  };
}

spfToArrayFilterFactory.$inject = [];
