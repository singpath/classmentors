'use strict';

import angular from 'angular';
import Firebase from 'firebase';
import {spfShared} from '../module.js';

/**
 * spfFirebaseRef return a Firebase reference to singpath database,
 * at a specific path, with a specific query; e.g:
 *
 *    // ref to "https://singpath.firebaseio.com/"
 *    spfFirebaseRef);
 *
 *    // ref to "https://singpath.firebaseio.com/auth/users/google:12345"
 *    spfFirebaseRef(['auth/users', 'google:12345']);
 *
 *    // ref to "https://singpath.firebaseio.com/events?limitTo=50"
 *    spfFirebaseRef(['events', 'google:12345'], {limitTo: 50});
 *
 *
 * The base url is configurable with `spfFirebaseRefProvider.setBaseUrl`:
 *
 *    angular.module('spf').config([
 *      'spfFirebaseRefProvider',
 *      function(spfFirebaseRefProvider){
 *          spfFirebaseRefProvider.setBaseUrl(newBaseUrl);
 *      }
 *    ])
 *
 */
spfShared.provider('spfFirebaseRef', function OepFirebaseProvider() {
  var baseUrl = 'https://singpath-play.firebaseio.com/';

  this.setBaseUrl = function(url) {
    baseUrl = url;
  };

  this.$get = [
    '$log',
    function spfFirebaseRefFactory($log) {
      return function spfFirebaseRef(paths, queryOptions) {
        var ref = new Firebase(baseUrl);
        var filters = ['equalTo', 'startAt', 'endAt'];
        var filter, i;

        paths = paths || [];
        paths = angular.isArray(paths) ? paths : [paths];
        ref = paths.reduce(function(prevRef, p) {
          return prevRef.child(p);
        }, ref);

        queryOptions = queryOptions || {};
        if (queryOptions.hasOwnProperty('orderByPriority')) {
          ref = ref.orderByPriority();
        } else if (queryOptions.hasOwnProperty('orderByKey')) {
          ref = ref.orderByKey();
        } else if (queryOptions.orderByChild) {
          ref = ref.orderByChild(queryOptions.orderByChild);
        } else if (queryOptions.orderByValue) {
          ref = ref.orderByValue(queryOptions.orderByValue);
        }

        for (i = 0; i < filters.length; i++) {
          filter = queryOptions[filters[i]];

          if (filter == null) {
            continue;
          }

          if (!angular.isArray(filter)) {
            ref = ref[filters[i]](filter);
          } else if (queryOptions.hasOwnProperty('orderByPriority')) {
            ref = ref[filters[i]].apply(ref, filter);
          } else {
            $log.warning('The query should be ordered by priority to filter by value and key');
          }

          break;
        }

        if (queryOptions.limitToFirst) {
          ref = ref.limitToFirst(queryOptions.limitToFirst);
        } else if (queryOptions.limitToLast) {
          ref = ref.limitToLast(queryOptions.limitToLast);
        }

        $log.debug('singpath base URL: "' + baseUrl + '".');
        $log.debug('singpath ref path: "' + ref.path.toString() + '".');
        return ref;
      };
    }
  ];

});

/**
 * Helpers for firebase Firebase, $firebaseObject and $firebaseArray object.
 *
 * Remove boilerplates:
 * - get $firebaseObject or $firebaseArray object using a relative path
 *   instead of Firebase obj.
 * - wrap a promise around the Firebase operation (currently provide set,
 *   remove and push).
 * - limit the number of object and returned object to mock in tests; just
 *   mock spfFirebase.
 *
 */
spfShared.factory('spfFirebase', [
  '$q',
  '$log',
  '$firebaseObject',
  '$firebaseArray',
  'spfFirebaseRef',
  function spfFirebaseFactory($q, $log, $firebaseObject, $firebaseArray, spfFirebaseRef) {
    var invalidChar = ['.', '#', '$', '/', '[', ']'];
    var spfFirebase;

    spfFirebase = {

      ServerValue: Firebase.ServerValue,

      /**
       * alias for spfFirebaseRef.
       *
       */
      ref: function() {
        return spfFirebaseRef.apply(this, arguments);
      },

      /**
       * Convenient function to return a $firebaseObject object.
       *
       * example:
       *
       *    var userPromise = spfFirebase.obj(['singpath/auth/users', userId]).$loaded();
       *
       */
      obj: function() {
        return $firebaseObject(spfFirebaseRef.apply(this, arguments));
      },

      loadedObj: function() {
        return spfFirebase.obj.apply(this, arguments).$loaded();
      },

      /**
       * Convenient function to return a $firebaseArray object.
       *
       * example:
       *
       *     var usersPromise = spfFirebase.obj(['singpath/auth/users']).$loaded();
       *
       */
      array: function() {
        return $firebaseArray(spfFirebaseRef.apply(this, arguments));
      },

      loadedArray: function() {
        return spfFirebase.array.apply(this, arguments).$loaded();
      },

      /**
       * Add data to a collection.
       *
       * Returns a promise resolving to an error on error or a Firebase
       * reference to the new item in the collection.
       *
       */
      push: function(root, value) {
        return $q(function(resolve, reject) {
          var ref;

          ref = spfFirebaseRef(root).push(value, function(err) {
            if (err) {
              reject(err);
            } else {
              resolve(ref);
            }
          });
        });
      },

      /**
       * Add data to a collection like `push` but also set the priority.
       *
       * Returns a promise resolving to an error on error or a Firebase
       * reference to the new item in the collection.
       *
       */
      pushWithPriority: function(root, value, priority) {
        return $q(function(resolve, reject) {
          var ref = spfFirebaseRef(root).push();

          ref.setWithPriority(value, priority, function(err) {
            if (err) {
              reject(err);
            } else {
              resolve(ref);
            }
          });
        });
      },

      /**
       * Set a firebase entry to the value.
       *
       * Returns a promise resolving to an error on error or to a Firebase
       * reference to the firebase entry.
       *
       */
      set: function(path, value) {
        return $q(function(resolve, reject) {
          var ref = spfFirebaseRef(path);

          ref.set(value, function(err) {
            if (err) {
              reject(err);
            } else {
              resolve(ref);
            }
          });
        });
      },

      /**
       * Set a firebase entry to the value with a priority.
       *
       * Returns a promise resolving to an error on error or to a Firebase
       * reference to the firebase entry.
       *
       */
      setWithPriority: function(path, value, priority) {
        priority = priority || 0;

        return $q(function(resolve, reject) {
          var ref = spfFirebaseRef(path);

          ref.setWithPriority(value, priority, function(err) {
            if (err) {
              reject(err);
            } else {
              resolve(ref);
            }
          });
        });
      },

      patch: function(path, value) {
        return $q(function(resolve, reject) {
          var ref = spfFirebaseRef(path);

          $log.debug('PATCH', JSON.stringify(value));

          ref.update(value, function(err) {
            if (err) {
              reject(err);
            } else {
              resolve(ref);
            }
          });
        });
      },

      /**
       * Remove firebase entry to the value.
       *
       * Returns a promise resolving to an error on error or to a Firebase
       * reference to empty firebase entry.
       */
      remove: function(path) {
        return $q(function(resolve, reject) {
          var ref = spfFirebaseRef(path);

          ref.remove(function(err) {
            if (err) {
              reject(err);
            } else {
              resolve(ref);
            }
          });
        });
      },

      /**
       * Return a factory extending `$firebaseObject`.
       *
       * Unlike `$firebaseObject.$extend`, it return a plain function and not
       * a constructor. It also takes as argument path and options like
       * `spfFirebase.ref`.
       *
       */
      objFactory: function(mixin) {
        var Obj = $firebaseObject.$extend(mixin);
        return function factory() {
          return new Obj(spfFirebase.ref.apply(spfFirebase, arguments));
        };
      },

      /**
       * Return a factory extending `$firebaseArray`.
       *
       * Unlike `$firebaseArray.$extend`, it return a plain function and not
       * a constructor. It also takes as argument path and options like
       * `spfFirebase.ref`.
       *
       */
      arrayFactory: function(mixin) {
        var Arr = $firebaseArray.$extend(mixin);
        return function factory() {
          return new Arr(spfFirebase.ref.apply(spfFirebase, arguments));
        };
      },

      /**
       * Remove invalid items from an object.
       *
       * Invalid items have a key with an invalid char:
       * '.', '#', '$', '/', '[' or ']'.
       */
      cleanObj: function(obj) {
        if (obj === undefined) {
          return null;
        }

        if (
          obj == null ||
          !angular.isObject(obj) ||
          angular.isArray(obj) ||
          angular.isNumber(obj) ||
          angular.isString(obj) ||
          angular.isDate(obj)
        ) {
          return obj;
        }

        return Object.keys(obj).reduce(function(copy, key) {
          if (!key) {
            return copy;
          }

          for (var i = 0; i < invalidChar.length; i++) {
            if (key.indexOf(invalidChar[i]) !== -1) {
              return copy;
            }
          }

          copy[key] = obj[key];

          if (copy[key] === undefined) {
            copy[key] = null;
          }
          return copy;
        }, {});
      },

      errTransactionFailed: new Error('Transaction failed'),
      errTransactionAborted: new Error('Transaction aborted'),

      /**
       * Promise based transaction helper.
       *
       * `path` is the firebase path the transaction will work on.
       *
       * `callback` will be called with the current value at the path. It should return
       * a new value to update the path with or undefined to abort the transaction.
       *
       * The returned promise will resolve to the new value or will reject
       * with a spfFirebase.errTransactionFailed or spfFirebase.errTransactionAborted
       * error.
       *
       */
      transaction: function(path, callback) {
        return $q(function(ok, fails) {
          spfFirebase.ref(path).transaction(callback, function(error, committed, snapshot) {
            if (error) {
              $log.error(error);
              fails(spfFirebase.errTransactionFailed);
            } else if (!committed) {
              fails(spfFirebase.errTransactionAborted);
            } else {
              ok(snapshot);
            }
          }, false);
        });
      },

      /**
       * Return a promise resolving to the record at the firebase path.
       *
       * An alternative to using an AngularFire object whenyou don't need
       * the update.
       *
       */
      valueAt: function(path) {
        return $q(function(ok, fails) {
          spfFirebase.ref(path).once('value', function(snapshot) {
            ok(snapshot.val());
          }, fails);
        });
      }
    };

    return spfFirebase;
  }
]);
