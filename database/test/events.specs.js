'use strict';

const chai = require('chai');
const expect = chai.expect;
const utils = require('./utils.js');

describe('events', function() {

  beforeEach(function() {
    utils.setFirebaseData();
  });

  describe('joining', function() {
    const eventId = 'some-event-id';
    const passwordHash = 'x'.repeat(64);
    let event, admin, bob, init;

    beforeEach(function() {
      bob = utils.bob();
      admin = utils.admin();
      event = {
        createdAt: 1465362866984,
        owner: admin.userWithId,
        title: 'Test event'
      };
      init = {
        auth: bob.auth,
        classMentors: {
          userProfiles: bob.userProfiles,
          events: {[eventId]: event},
          eventPasswords: {
            [eventId]: {
              hash: passwordHash,
              options: {
                hasher: 'PBKDF2',
                iterations: 1012,
                keySize: 8,
                prf: 'SHA256',
                salt: 'x'.repeat(32)
              }
            }
          }
        }
      };
      utils.setFirebaseData(init);
    });

    it('should let a user join an event if has the password', function() {
      expect(bob.firebaseAuth).can.write(passwordHash).path(`classMentors/eventApplications/${eventId}/${bob.uid}`);

      init.classMentors.eventApplications = {[eventId]: {[bob.uid]: passwordHash}};
      utils.setFirebaseData(init);
      expect(bob.firebaseAuth).can.patch({
        user: bob.user,
        joinedAt: utils.timestamp()
      }).path(`classMentors/eventParticipants/${eventId}/${bob.publicId}`);
    });

    it('should not let a user join an event without a timestamp', function() {
      init.classMentors.eventApplications = {[eventId]: {[bob.uid]: passwordHash}};
      utils.setFirebaseData(init);

      expect(bob.firebaseAuth).cannot.patch({user: bob.user})
        .path(`classMentors/eventParticipants/${eventId}/${bob.publicId}`);
    });

    it('should let a user edit details its details without a timestamp (old records)', function() {
      init.classMentors.eventApplications = {[eventId]: {[bob.uid]: passwordHash}};
      init.classMentors.eventParticipants = {[eventId]: {[bob.publicId]: {user: bob.user}}};
      init.auth.users[bob.uid].displayName += ' 2';
      utils.setFirebaseData(init);

      expect(bob.firebaseAuth).can.write(
        init.auth.users[bob.uid].displayName
      ).path(`classMentors/eventParticipants/${eventId}/${bob.publicId}/user/displayName`);
    });

    it('should let the owner remove participants', function() {
      init.classMentors.eventApplications = {[eventId]: {[bob.uid]: passwordHash}};
      init.classMentors.eventParticipants = {
        [eventId]: {
          [bob.publicId]: {
            user: bob.user,
            joinedAt: 1234567890
          }
        }
      };
      utils.setFirebaseData(init);

      expect(admin.firebaseAuth).can.write(null)
        .path(`classMentors/eventParticipants/${eventId}/${bob.publicId}`);
    });

  });

});
