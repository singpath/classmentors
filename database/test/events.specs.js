'use strict';

const chai = require('chai');
const expect = chai.expect;
const utils = require('./utils.js');
const auth = utils.auth;

describe('events', function() {

  beforeEach(function() {
    utils.setFirebaseData();
  });

  describe('creating', function() {
    const eventPath = 'classMentors/events/new-event-id';
    const eventPasswordPath = 'classMentors/eventPasswords/new-event-id';

    function makeEvent(firebaseAuth) {
      const user = utils.fixtures(`auth/users/${firebaseAuth.uid}`);

      return {
        title: 'some title',
        owner: {
          publicId: user.publicId,
          displayName: user.displayName,
          gravatar: user.gravatar
        },
        createdAt: utils.timestamp()
      };
    }

    function makePassword() {
      return {
        hash: 'x'.repeat(64),
        options: {
          hasher: 'PBKDF2',
          iterations: 1012,
          keySize: 8,
          prf: 'SHA256',
          salt: 'x'.repeat(32)
        }
      };
    }

    function makeProfileCreatedEvent(event) {
      return {
        createdAt: event.createdAt,
        featured: event.featured || false,
        title: event.title
      };
    }

    it('should allow a premium user to create an event', function() {
      const event = makeEvent(auth.alice);

      expect(auth.alice).can.write(event).to.path(eventPath);
    });

    it('should allow an admin to create an event', function() {
      const event = makeEvent(auth.admin);

      expect(auth.admin).can.write(event).to.path(eventPath);
    });

    it('should disallow other users to create an event', function() {
      const event = makeEvent(auth.bob);

      expect(auth.bob).cannot.write(event).to.path(eventPath);
    });

    it('should allow event owner to set the event password', function() {
      const event = makeEvent(auth.alice);
      const password = makePassword();
      const patch = {classMentors: {events: {'new-event-id': event}}};

      utils.setFirebaseData(patch);
      expect(auth.alice).can.write(password).to.path(eventPasswordPath);
    });

    it('should disallow other user to set the event password', function() {
      const event = makeEvent(auth.alice);
      const password = makePassword();
      const patch = {classMentors: {events: {'new-event-id': event}}};

      utils.setFirebaseData(patch);
      expect(auth.admin).cannot.write(password).to.path(eventPasswordPath);
      expect(auth.bob).cannot.write(password).to.path(eventPasswordPath);
    });

    it('should allow event owner to update his profile', function() {
      const profilePath = 'classMentors/userProfiles/alice/createdEvents/new-event-id';
      const event = makeEvent(auth.alice);
      const password = makePassword();
      const patch = {
        classMentors: {
          events: {'new-event-id': event},
          eventPasswords: {'new-event-id': password}
        }
      };
      let profileData;

      event.createdAt = 12345;
      profileData = makeProfileCreatedEvent(event);

      utils.setFirebaseData(patch);
      expect(auth.alice).can.write(profileData).to.path(profilePath);
    });

    it('should disallow event owner to update his profile with wrong title', function() {
      const profilePath = 'classMentors/userProfiles/alice/createdEvents/new-event-id';
      const event = makeEvent(auth.alice);
      const password = makePassword();
      const patch = {
        classMentors: {
          events: {'new-event-id': event},
          eventPasswords: {'new-event-id': password}
        }
      };
      let profileData;

      event.createdAt = 12345;
      profileData = makeProfileCreatedEvent(event);

      utils.setFirebaseData(patch);
      profileData.title += ' (updated)';
      expect(auth.alice).cannot.write(profileData).to.path(profilePath);
    });

    it('should disallow event owner to update his profile with wrong feature flag', function() {
      const profilePath = 'classMentors/userProfiles/alice/createdEvents/new-event-id';
      const event = makeEvent(auth.alice);
      const password = makePassword();
      const patch = {
        classMentors: {
          events: {'new-event-id': event},
          eventPasswords: {'new-event-id': password}
        }
      };
      let profileData;

      event.createdAt = 12345;
      profileData = makeProfileCreatedEvent(event);

      utils.setFirebaseData(patch);
      profileData.featured = true;
      expect(auth.alice).cannot.write(profileData).to.path(profilePath);
    });

    it('should disallow event owner to update his profile with wrong timestamp', function() {
      const profilePath = 'classMentors/userProfiles/alice/createdEvents/new-event-id';
      const event = makeEvent(auth.alice);
      const password = makePassword();
      const patch = {
        classMentors: {
          events: {'new-event-id': event},
          eventPasswords: {'new-event-id': password}
        }
      };
      let profileData;

      event.createdAt = 12345;
      profileData = makeProfileCreatedEvent(event);

      utils.setFirebaseData(patch);
      profileData.createdAt += 1;
      expect(auth.alice).cannot.write(profileData).to.path(profilePath);
    });

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
