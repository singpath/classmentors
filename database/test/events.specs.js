'use strict';

const chai = require('chai');
const expect = chai.expect;
const utils = require('./utils.js');
const auth = utils.auth;

describe('events', function() {

  beforeEach(function() {
    utils.setFirebaseData();
  });

  describe('joining', function() {
    const passwordHash = utils.fixtures('classMentors/eventPasswords/alice-event/hash');
    let user;

    beforeEach(function() {
      user = utils.fixtures('classMentors/eventParticipants/alice-event/bob/user');
    });

    it('should let a user join an event if has the password', function() {
      utils.setFirebaseData({
        classMentors: {
          eventApplications: {'alice-event': {'google:bob': undefined}},
          eventParticipants: {'alice-event': {bob: undefined}}
        }
      });
      expect(auth.bob).can.write(passwordHash).path('classMentors/eventApplications/alice-event/google:bob');

      utils.setFirebaseData({classMentors: {eventParticipants: {'alice-event': {bob: undefined}}}});
      expect(auth.bob).can.patch({
        user: user,
        joinedAt: utils.timestamp()
      }).path('classMentors/eventParticipants/alice-event/bob');
    });

    it('should not let a user join an event without a timestamp', function() {
      utils.setFirebaseData({classMentors: {eventParticipants: {'alice-event': {bob: undefined}}}});

      expect(auth.bob).cannot.patch({user})
        .path('classMentors/eventParticipants/alice-event/bob');
    });

    it('should let a user edit details its details', function() {
      utils.setFirebaseData({auth: {users: {'google:bob': {displayName: 'Just Bob'}}}});

      expect(auth.bob).can.write(
        'Just Bob'
      ).path('classMentors/eventParticipants/alice-event/bob/user/displayName');
    });

    it.skip('should let a owner edit user details', function() {
      utils.setFirebaseData({auth: {users: {'google:bob': {displayName: 'Just Bob'}}}});

      expect(auth.alice).can.write(
        'Just Bob'
      ).path('classMentors/eventParticipants/alice-event/bob/user/displayName');
    });

    it('should let the owner remove participants', function() {
      utils.setFirebaseData();

      expect(auth.alice).can.write(null)
        .path('classMentors/eventParticipants/alice-event/bob');
    });

  });

});
