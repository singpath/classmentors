/**
 * TODO: Spread tests in files by features.
 * TODO: secure log writes and queue reads to queue-worker and admin.
 */
'use strict';

var chai = require('chai');
var expect = chai.expect;
var targaryen = require('@dinoboff/targaryen');
var utils = require('./utils.js');

describe('With current security rules', function() {

  beforeEach(function() {
    utils.setFirebaseData();
  });

  it('cannot write userActions', function() {
    expect(targaryen.users.unauthenticated)
      .cannot.write.path('classMentors/userActions');
  });

  describe('Unauthorized users', function() {
    var chris = {uid: 'google:110893970871115341770'};

    it.skip('can not write bad data to classMentors/userActions/$userActions', function() {
      expect(chris)
        .cannot.write({action: 'button'}).path('classMentors/userActions/someAction');
    });

    var goodAction = {
      publicId: 'cboesch',
      action: 'button',
      misc: 'misc',
      timestamp: {'.sv': 'timestamp'}
    };

    it('can write to classMentors/userActions/$userActions', function() {
      expect(chris)
        .can.write(goodAction).path('classMentors/userActions/someAction');
    });

    it('cannot write to someone else action classMentors/userActions/$userActions', function() {
      expect({uid: 'google:12345'})
        .cannot.write(goodAction).path('classMentors/userActions/someAction');
    });

    it.skip('cannot read classMentors/userActions', function() {
      expect(chris).cannot.read.path('classMentors/userActions');
    });

    it('can read classMentors/userAchievements', function() {
      expect(targaryen.users.unauthenticated)
        .can.read.path('classMentors/userAchievements');
    });

    it('can read classMentors/userProfiles', function() {
      expect(targaryen.users.unauthenticated)
        .can.read.path('classMentors/userProfiles');
    });

    it('can not read logs', function() {
      expect(targaryen.users.unauthenticated)
        .cannot.read.path('logs');
    });

    it('cannot read queue/tasks', function() {
      expect(targaryen.users.unauthenticated)
        .cannot.read.path('queue/tasks');
    });

    it('cannot write logs', function() {
      expect(targaryen.users.unauthenticated)
        .cannot.write.path('logs');
    });

  });

  describe('Authorized users', function() {
    var theUser = {uid: 'github:1234'};
    var goodTask = {service: 's1', id: 'chris'};

    it('can write to queue/tasks', function() {
      expect(theUser).can.write(goodTask).path('queue/tasks');
    });

    it('can read logs', function() {
      expect(theUser).can.read.path('logs');
    });

  });

  describe('Datastore changing authorized users', function() {

    //  New user creation order.
    //  Write to auth/users/auth.id with publicId
    //  Write auth/publicIds/$publicId = auth.id
    //  Write auth/usedPublicIds/$publicId = true

    var theUser = {uid: 'github:1234'};

    beforeEach(function() {
      utils.setFirebaseData({
        auth: {
          publicIds: {awesome: 'github:1234'},
          usedPublicIds: {awesome: true},
          users: {
            'github:1234': {
              displayName: 'Test User',
              email: 'someone@smu.edu.sg',
              pic: 'https://avatars.githubusercontent.com/u/116418?v=3',
              publicId: 'awesome',
              username: 'awesome'
            }
          }
        }
      });
    });

    it('cannot overwrite existing publicIDs entry at auth/publicIds/$publicId', function() {
      expect(theUser).cannot.write('github:1234').path('auth/publicIds/awesome');
    });

    it('can uppdate public ID as taken by writing to auth/usedPublicIds/$publicId', function() {
      expect(theUser).can.write(true).path('auth/usedPublicIds/awesome');
    });

  });

  describe('Queue-workers', function() {
    var customAuth = {uid: 'queue-worker'};

    it('can write to classMentors/userProfiles', function() {
      expect(customAuth).can.write(null).path('classMentors/userProfiles');
    });

    it('can write to classMentors/userAchievements', function() {
      expect(customAuth).can.write(null).path('classMentors/userAchievements');
    });

  });

});
