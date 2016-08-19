'use strict';

import {spfShared} from './module.js';

spfShared.filter('spfEmpty', [
  function spfEmptyFactory() {
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
]);

spfShared.filter('spfLength', [
  function spfLengthFactory() {
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
]);

spfShared.filter('spfToArray', [
  function spfToArrayFilterFactory() {
    return function spfToArrayFilter(obj) {
      if (!(obj instanceof Object)) {
        return obj;
      }
      return Object.keys(obj).reduce(function(arr, key) {
        if (!key || key[0] === '$') {
          return arr;
        }

        arr.push(Object.defineProperty(
          obj[key],
          '$$hashKey',
          {__proto__: null, value: key}
        ));

        return arr;
      }, []);
    };
  }
]);
