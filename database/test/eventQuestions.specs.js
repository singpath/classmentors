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
    const questionsPath = `classMentors/eventQuestions/${eventId}/questions`;

    it('should allow the admin to read eventQuestions', function() {
      expect(auth.admin).can.read.path('classMentors/eventQuestions');
    });

    it('should allow the event owner to read eventQuestions', function() {
      expect(auth.alice).can.read.path(questionsPath);
    });

    it('should allow the event participants to read eventQuestions', function() {
      expect(auth.bob).can.read.path(questionsPath);
    });

    it('should disallow other user to read eventQuestions', function() {
      expect(auth.emma).cannot.read.path(questionsPath);
    });

  });

  describe('write rules', function() {
    const eventId = 'alice-event';
    const questionsPath = `classMentors/eventQuestions/${eventId}/questions`;

    function makeQuestion(firebaseAuth) {
      const user = utils.fixtures(`auth/users/${firebaseAuth.uid}`);

      return {
        title: 'Test',
        body: 'Test question please ignore...',
        owner: {
          displayName: user.displayName,
          gravatar: user.gravatar,
          publicId: user.publicId
        },
        createdAt: utils.timestamp()
      };
    }

    function addQuestion(id, firebaseAuth, shouldFail) {
      const path = `${questionsPath}/${id}`;
      const question = makeQuestion(firebaseAuth);

      if (shouldFail) {
        expect(firebaseAuth).cannot.write(question).to.path(path);
      } else {
        expect(firebaseAuth).can.write(question).to.path(path);
      }
    }

    it('should allow the event owner to add a question', function() {
      addQuestion('alice-question-2', auth.alice);
    });

    it('should allow participants to add a question', function() {
      addQuestion('bob-question-2', auth.bob);
    });

    it('should disallow other user to add a question', function() {
      const shouldFail = true;

      addQuestion('admin-question-1', auth.admin, shouldFail);
      addQuestion('emma-question-1', auth.emma, shouldFail);
    });

    it('should disallow to add question on behalf of some other user', function() {
      const path = `${questionsPath}/bob-question-2`;
      const question = makeQuestion(auth.bob);

      expect(auth.alice).cannot.write(question).to.path(path);
    });

    it('should disallow to add question without a title', function() {
      const path = `${questionsPath}/alice-question-2`;
      const question = makeQuestion(auth.alice);

      question.title = undefined;
      expect(auth.alice).cannot.write(question).to.path(path);

      question.title = '';
      expect(auth.alice).cannot.write(question).to.path(path);
    });

    it('should disallow to add question without a body', function() {
      const path = `${questionsPath}/alice-question-2`;
      const question = makeQuestion(auth.alice);

      question.body = undefined;
      expect(auth.alice).cannot.write(question).to.path(path);

      question.body = '';
      expect(auth.alice).cannot.write(question).to.path(path);
    });

    // quesionOwners node should only be readable by the event owner.
    // Event participants can comment on questions and answers
    // Event participants can upVote questions and answers
    // Question owners can select a winning answer.

  });

});
