'use strict';

var chai = require('chai');
var expect = chai.expect;
var targaryen = require('targaryen');

var exportData = require('./singpath-play-export.json'); // with path

var rules = require('../security-rules.json'); // with path

chai.use(targaryen.chai);


// TODO: secure log writes and queue reads to queue-worker and admin.
describe('With current security rules', function() {

  before(function() {
    targaryen.setFirebaseData(exportData);
    targaryen.setFirebaseRules(rules);
  });

  it('cannot write userActions', function() {
    expect(targaryen.users.unauthenticated)
      .cannot.write.path('classMentors/userActions');
  });

  describe('Unauthorized users', function() {
    var theUser = {uid: 'github:1234'};

    it('can not write bad data to classMentors/userActions', function() {
      expect(theUser)
        .cannot.write({action: 'button'}).path('classMentors/userActions');
    });

    // var goodAction = {publicId: 'abc', action: 'button', misc: 'misc'};

    // it('can write to classMentors/userActions', function() {
    //   expect(theUser)
    //     .can.write(goodAction).path("classMentors/userActions");
    // });

    it('cannot read classMentors/userActions', function() {
      expect(theUser).cannot.read.path('classMentors/userActions');
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

    it('cannot read auth', function() {
      expect(targaryen.users.unauthenticated)
        .cannot.read.path('auth');
    });

    it('cannot write logs', function() {
      expect(targaryen.users.unauthenticated)
        .cannot.write.path('logs');
    });

  });

  describe('Authorized users', function() {
    var theUser = {uid: 'github:1234'};
    var userData = {
      id: '123',
      fullName: 'Chris',
      displayName: 'Chris',
      email: 'chris@home.com',
      gravatar: 'http:\\home.com',
      createdAt: 12345678
    };
    var goodTask = {service: 's1', id: 'chris'};

    it('can write to queue/tasks', function() {
      expect(theUser).can.write(goodTask).path('queue/tasks');
    });

    it('cannot read auth/publicIds', function() {
      expect(theUser).cannot.read.path('auth/publicIds');
    });

    it('cannot read auth/publicIds/$publicId', function() {
      expect(theUser).cannot.read.path('auth/publicIds/chris');
    });

    it('cannot write overwrite and existing entry at auth/publicIds/$publicId', function() {
      var data = 'github:1234';

      expect(theUser).cannot.write(data).path('auth/publicIds/chris');
    });

    it('cannot write a new entry without the value being auth.uid at auth/publicIds/$publicId', function() {
      expect(theUser).cannot.write('github:9999').path('auth/publicIds/aces');
    });

    it.skip('can write a new entry with the value being auth.uid at auth/publicIds/$publicId', function() {
      expect(theUser).can.write('github:1234').path('auth/publicIds/aces');
    });

    it.skip('can not alter an existing auth/usedPublicIds/$publicId', function() {
      expect(theUser).cannot.write(false).path('auth/usedPublicIds/chris');
    });

    it.skip('can read their auth/users/$auth.uid', function() {
      expect(theUser).can.read.path('auth/users/github:1234');
    });

    it.skip('cannot read another users\' auth/users/$auth.uid', function() {
      expect(theUser).cannot.read.path('auth/users/github:5678');
    });

    it.skip('can write their auth/users/$auth.uid', function() {
      expect(theUser).can.write(userData).path('auth/users/github:1234');
    });

    it('cannot write another users\' auth/users/$auth.uid', function() {
      expect(theUser).cannot.write(userData).path('auth/users/github:5678');
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

    before(function() {

      // add user to users
      exportData.auth.users['github:1234'] = {
        displayName: 'Test User',
        email: 'someone@smu.edu.sg', pic: 'https://avatars.githubusercontent.com/u/116418?v=3',
        publicId: 'awesome', username: 'awesome'
      };

            // allow user to claim public id.
      exportData.auth.publicIds.awesome = 'github:1234';
      targaryen.setFirebaseData(exportData);
    });

    var theUser = {uid: 'github:1234'};

    it('cannot overwrite existing publicIDs entry at auth/publicIds/$publicId', function() {
      expect(theUser).cannot.write('github:1234').path('auth/publicIds/awesome');
    });

    it('can uppdate public ID as taken by writing to auth/usedPublicIds/$publicId', function() {
      expect(theUser).can.write(true).path('auth/usedPublicIds/awesome');
    });
  });

  describe('Specific ClassMentors users', function() {
    var theUser = {uid: 'github:1234'};
    var data = {
      id: '123',
      fullName: 'Chris',
      displayName: 'Chris',
      email: 'chris@home.com',
      gravatar: 'http:\\home.com',
      createdAt: 12345678
    };
    var chrisUser = {uid: 'google:110893970871115341770'}; // cboesch
    var serviceData = {
      freeCodeCamp: {
        details: {
          id: 'singaporeclouds',
          name: 'chris',
          registeredBefore: 1465207026228
        }
      }
    };

    it('cannot write to another users\' classMentors/userProfiles/$publicId', function() {
      expect(theUser).cannot.write(data).path('classMentors/userProfiles/chris');
    });

    it('can write to their own classMentors/userProfiles/$publicId', function() {
      expect(chrisUser).can.write(data).path('classMentors/userProfiles/cboesch');
    });

    it('can write to their own classMentors/userProfiles/$publicId/services', function() {
      expect(chrisUser).can.write(serviceData).path('classMentors/userProfiles/cboesch/services');
    });

  });

  describe('Queue-workers', function() {
    var customAuth = {uid: 'queue-worker'};
    var data = {};

    it('can write to classMentors/userProfiles', function() {
      expect(customAuth).can.write(data).path('classMentors/userProfiles');
    });

    it('can write to classMentors/userAchievements', function() {
      expect(customAuth).can.write(data).path('classMentors/userAchievements');
    });

  });

});
