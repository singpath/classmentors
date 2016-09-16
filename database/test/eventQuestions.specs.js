'use strict';

const chai = require('chai');
const expect = chai.expect;
const utils = require('./utils.js');
const auth = utils.auth;


describe('eventQuestions', function() {

  beforeEach(function() {
    utils.setFirebaseData();
  });

  describe('read rules', function() {
    const eventId = 'alice-event';
    const questionPath = `classMentors/eventQuestions/${eventId}/questions`;

    it('should allow the admin to read eventQuestions', function() {
      expect(auth.admin).can.read.path('classMentors/eventQuestions');
    });

    it('should allow the event owner to read eventQuestions', function() {
      expect(auth.alice).can.read.path(questionPath);
    });

    it('should allow the event participants to read eventQuestions', function() {
      expect(auth.bob).can.read.path(questionPath);
    });

    it('should disallow other user to read eventQuestions', function() {
      expect(auth.emma).cannot.read.path(questionPath);
    });

    // it('should allow the event owner to read questionOwners', function() {

    //   // TODO: Find a matching rule and unit test.
    //   // expect(auth.bob).can.read.path('classMentors/eventQuestions/'+bobEventId+'/questionOwners');
    // });

    // it('should allow the event owner to read and write to eventQuestions', function() {

    //   // expect(auth.bob).can.write({'NEW_KEY':'test'}).path('classMentors/eventQuestions/'+bobEventId+"/questions");
    //   // expect(auth.bob).can.read.path('classMentors/eventQuestions/'+bobEventId+"/questions");
    // });

    // it('should not allow non-event owner to read and write to eventQuestions', function() {

    //   // expect(auth.bob).cannot.write({'test':'test'}).path('classMentors/eventQuestions/'+eventId);
    //   // expect(auth.bob).cannot.read.path('classMentors/eventQuestions/'+eventId);
    // });

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
