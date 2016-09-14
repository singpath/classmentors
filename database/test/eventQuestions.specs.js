'use strict';

const chai = require('chai');
const expect = chai.expect;
const utils = require('./utils.js');

/*
eventQuestions ->
$eventKey ->
questions -> "auth !== null && root.child('classMentors/events').child($eventId).child('owner/publicId').val() === root.child('auth/users').child(auth.uid).child('publicId').val()"
$questionKey ->
answers ->
$publicId ->
comments ->
$commentKey ->
$commentor$ID -> “My comment”
*/

describe('eventQuestions', function() {

  beforeEach(function() {
    utils.setFirebaseData();
  });

  describe('rules', function() {
    const eventId = 'some-event-id';
    const bobEventId = 'bob-event-id';

    const passwordHash = 'x'.repeat(64);
    let event, bobEvent, admin, bob, init;

    beforeEach(function() {
      bob = utils.bob();
      admin = utils.admin();
      event = {
        createdAt: 1465362866984,
        owner: admin.userWithId,
        title: 'Test event'
      };
      bobEvent = {
        createdAt: 1465362866985,
        owner: bob.userWithId,
        title: 'Bob Event'
      };
      init = {
        auth: bob.auth,
        classMentors: {
          userProfiles: bob.userProfiles,
          events: {[eventId]: event, [bobEventId]: bobEvent},
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

    it('should allow the admin to read and write to eventQuestions', function() {
      expect(admin.firebaseAuth).can.write({'test': 'test'}).path('classMentors/eventQuestions');
      expect(admin.firebaseAuth).can.read.path('classMentors/eventQuestions');
    });

    it('should allow the event owner to read questionOwners', function() {

      // TODO: Find a matching rule and unit test.
      // expect(bob.firebaseAuth).can.read.path('classMentors/eventQuestions/'+bobEventId+'/questionOwners');
    });

    it('should allow the event owner to read and write to eventQuestions', function() {
      expect(bob.firebaseAuth).can.write({'NEW_KEY': 'test'}).path('classMentors/eventQuestions/' + bobEventId + '/questions');
      expect(bob.firebaseAuth).can.read.path('classMentors/eventQuestions/' + bobEventId + '/questions');
    });

    it('should not allow non-event owner to read and write to eventQuestions', function() {

      // expect(bob.firebaseAuth).cannot.write({'test':'test'}).path('classMentors/eventQuestions/'+eventId);
      // expect(bob.firebaseAuth).cannot.read.path('classMentors/eventQuestions/'+eventId);
    });

    // Event participants should be able to read all questions for their event.
    // Non-event participants should not be able to read questions for an event.
    // quesionOwners node should only be readable by the event owner.
    // Event participants should only be able add/edit questions using their publicID.
    // Event participants should only be able to add/edit answers with their publicID.
    // Event participants can comment on questions and answers
    // Event participants can upVote questions and answers
    // Question owners can select a winning answer.

  });

});
