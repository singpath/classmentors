'use strict';

var exportData = require('./singpath-play-export.json');
var rules = require('../security-rules.json');
var targaryen = require('@dinoboff/targaryen');
var deepAssign = require('deep-assign');

/**
 * Set targaryen's firebase data by complining singpath-play-export data
 * with the patch.
 *
 * Note with will merge each data node. To remove a node, the patch needs set it
 * to null:
 *
 * @example
 * // remove user from initial data
 * setFirebaseData({
 *   auth : {
 *     publicIds: {cboesch: null},
 *     usedPublicIds: {cboesch: null},
 *     users: {'google:110893970871115341770': null}
 *   }
 * });
 *
 * @param {Object} patch optional patch to singpath-play-export.json
 */
exports.setFirebaseData = function(patch) {
  var data = exportData;

  if (patch) {
    data = deepAssign({}, exportData, patch);
  }

  targaryen.setFirebaseData(data);
};

before(function() {
  targaryen.setDebug(true);
  targaryen.setFirebaseRules(rules);
});
