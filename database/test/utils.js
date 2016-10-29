'use strict';

const fixtures = require('./fixtures.json');
const rules = require('../security-rules.json');
const targaryen = require('targaryen');
const mergeWith = require('lodash.mergewith');

const baseData = mergeWith({}, fixtures);

before(function() {
  targaryen.setDebug(true);
  targaryen.setFirebaseRules(rules);
});

/**
 * Return a Firebase timestamp server value.
 *
 * @return {{'.sv': string}}
 */
exports.timestamp = function() {
  return {'.sv': 'timestamp'};
};

/**
 * Set targaryen's firebase data by merging fixtures.json data
 * with the patch.
 *
 * It makes sure fixtures.json doesn't change between tests.
 *
 * Note with will merge recursively each data node. To remove a node, the patch
 * needs set it to "undefined":
 *
 * @example
 * // remove user from initial data
 * setFirebaseData({
 *   auth : {
 *     publicIds: {chris: undefined},
 *     usedPublicIds: {chris: undefined},
 *     users: {'google:chris': undefined}
 *   }
 * });
 *
 * @param {Object} patch Optional patch to "fixtures.json".
 */
exports.setFirebaseData = function(patch) {
  let data = mergeWith({}, baseData);

  if (patch) {
    data = mergeWith(data, patch, (value, newValue, key, obj) => {
      if (newValue === undefined) {
        delete obj[key];
      }
    });
  }

  targaryen.setFirebaseData(data);
};

/**
 * Return a node in the fixture data.
 *
 * @param  {string} path Path the the node in the fixture data.
 * @return {any}
 */
exports.fixtures = function(path) {
  const parts = path.split('/').filter(p => p && p.length);
  const data = mergeWith({}, baseData);

  return parts.reduce((node, key) => node[key] || {}, data);
};

/**
 * List of read only firebase auth for targaryen's tests.
 *
 * @type {admin: object, alice: object, chris: object, bob: object}
 */
exports.auth = {

  get admin() {
    return {
      uid: 'google:chris',
      id: 'chris',
      provider: 'google'
    };
  },

  get alice() {
    return {
      uid: 'google:alice',
      id: 'alice',
      provider: 'google'
    };
  },

  get chris() {
    return this.admin;
  },

  get bob() {
    return {
      uid: 'google:bob',
      id: 'bob',
      provider: 'google'
    };
  },

  get emma() {
    return {
      uid: 'google:emma',
      id: 'emma',
      provider: 'google'
    };
  }

};
