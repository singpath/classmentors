'use strict';

var exportData = require('./singpath-play-export.json');
var rules = require('../security-rules.json');
var targaryen = require('@dinoboff/targaryen');
var deepAssign = require('deep-assign');

const timestamp = () => ({'.sv': 'timestamp'});

before(function() {
  targaryen.setDebug(true);
  targaryen.setFirebaseRules(rules);
});

exports.timestamp = timestamp;

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

exports.bob = function(opts) {
  opts = Object.assign({
    isAdmin: false,
    isPremium: false
  }, opts);

  const uid = 'github:808';
  const publicId = 'bob';
  const firebaseAuth = {
    uid,
    id: 808,
    provider: 'github'
  };
  const user = {
    displayName: 'bob',
    gravatar: '//www.gravatar.com/avatar/some-hash'
  };
  const userData = {
    displayName: user.displayName,
    email: 'bob@example.com',
    fullName: 'Bob Smith',
    gravatar: user.gravatar,
    id: uid,
    publicId: publicId,
    yearOfBirth: 1990,
    createdAt: timestamp()
  };
  const auth = {
    publicIds: {[publicId]: uid},
    usedPublicIds: {[publicId]: true},
    users: {[uid]: userData}
  };
  const profile = {
    user: {
      displayName: user.displayName,
      gravatar: user.gravatar,
      isAdmin: opts.isAdmin,
      isPremium: opts.isPremium,
      yearOfBirth: userData.yearOfBirth
    }
  };
  const userProfiles = {[publicId]: profile};
  const premiumUsers = {[uid]: opts.isPremium};
  const admins = {[uid]: opts.isAdmin};

  return {
    admins,
    auth,
    firebaseAuth,
    premiumUsers,
    profile,
    publicId,
    uid,
    user,
    userData,
    userProfiles
  };
};
