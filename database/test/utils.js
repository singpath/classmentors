'use strict';

var exportData = require('./singpath-play-export.json');
var rules = require('../security-rules.json');
var targaryen = require('@dinoboff/targaryen');
var merge = require('lodash.merge');

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
 * to "undefined":
 *
 * @example
 * // remove user from initial data
 * setFirebaseData({
 *   auth : {
 *     publicIds: {cboesch: undefined},
 *     usedPublicIds: {cboesch: undefined},
 *     users: {'google:123456': undefined}
 *   }
 * });
 *
 * @param {Object} patch optional patch to singpath-play-export.json
 */
exports.setFirebaseData = function(patch) {
  var data = merge({}, exportData);

  if (patch) {
    data = merge(data, patch);
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

exports.admin = function(opts) {
  opts = Object.assign({
    isAdmin: true,
    isPremium: true
  }, opts);

  const uid = 'google:123456';
  const publicId = 'cboesch';
  const firebaseAuth = {
    uid,
    id: 123456,
    provider: 'google'
  };
  const user = {
    displayName: 'Chris Boesch',
    gravatar: '//www.gravatar.com/avatar/somehashsomehashsomehashsomehash'
  };
  const userWithId = Object.assign({publicId}, user);

  return {
    firebaseAuth,
    publicId,
    uid,
    user,
    userWithId
  };
};
