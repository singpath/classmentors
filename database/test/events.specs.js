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
    let participation;

    beforeEach(function() {
      participation = utils.fixtures('classMentors/eventParticipants/alice-event/bob');
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
        user: participation.user,
        services: participation.services,
        joinedAt: utils.timestamp()
      }).path('classMentors/eventParticipants/alice-event/bob');
    });

    it('should not let a user join an event without a timestamp', function() {
      utils.setFirebaseData({classMentors: {eventParticipants: {'alice-event': {bob: undefined}}}});

      expect(auth.bob).cannot.patch({
        user: participation.user,
        services: participation.services
      }).path('classMentors/eventParticipants/alice-event/bob');
    });

    it('should let the owner remove participants', function() {
      utils.setFirebaseData();

      expect(auth.alice).can.write(null)
        .path('classMentors/eventParticipants/alice-event/bob');
    });

  });

  describe('update', function() {

    describe('participants', function() {
      const path = 'classMentors/eventParticipants/alice-event/bob';
      let participation;

      beforeEach(function() {
        participation = utils.fixtures(path);
      });

      it('should allow the owner to update the user data', function() {
        utils.setFirebaseData(
          {classMentors: {userProfiles: {bob: {services: {codeCombat: {details: {id: 'new-cc-id'}}}}}}}
        );
        participation.services.codeCombat.details.id = 'new-cc-id';

        expect(auth.alice).can.patch({
          user: participation.user,
          services: participation.services
        }).path(path);
      });

      it('should disallow the owner to update the user data with out of sync values', function() {
        utils.setFirebaseData(
          {classMentors: {userProfiles: {bob: {services: {codeCombat: {details: {id: 'new-cc-id'}}}}}}}
        );

        expect(auth.alice).cannot.patch({
          user: participation.user,
          services: participation.services
        }).path(path);
      });

      it('should allow participant to update its own user data', function() {
        utils.setFirebaseData(
          {classMentors: {userProfiles: {bob: {services: {codeCombat: {details: {id: 'new-cc-id'}}}}}}}
        );
        participation.services.codeCombat.details.id = 'new-cc-id';

        expect(auth.bob).can.patch({
          user: participation.user,
          services: participation.services
        }).path(path);
      });

      it('should disallow other users to update some participant user data', function() {
        utils.setFirebaseData(
          {classMentors: {userProfiles: {bob: {services: {codeCombat: {details: {id: 'new-cc-id'}}}}}}}
        );
        participation.services.codeCombat.details.id = 'new-cc-id';

        expect(auth.emma).cannot.patch({
          user: participation.user,
          services: participation.services
        }).path(path);
      });

    });


  });

  describe('tasks', function() {
    const tasksPath = 'classMentors/eventTasks/alice-event';

    describe('creating', function() {
      const badgeServiceIds = ['codeSchool', 'codeCombat', 'freeCodeCamp', 'pivotalExpert'];
      const serviceIds = ['singPath'].concat(badgeServiceIds);
      let newTask;

      beforeEach(function() {
        newTask = {
          archived: false,
          showProgress: true,
          badge: null,
          serviceId: 'freeCodeCamp',
          title: 'Join service',
          priority: 2,
          description: 'Register and provide service user name',
          openedAt: {'.sv': 'timestamp'},
          closedAt: null
        };
      });

      serviceIds.forEach(serviceId => {
        it(`should allow the owner create a service task with ${serviceId}`, function() {
          newTask.serviceId = serviceId;
          expect(auth.alice).can.write(newTask).to.path(`${tasksPath}/some-new-task`);
        });
      });

      badgeServiceIds.forEach(serviceId => {

        it(`should allow the owner create a task for a service badge for ${serviceId}`, function() {
          newTask.serviceId = serviceId;
          newTask.badge = {id: 'foo', name: 'foo', iconUrl: '/default-icon'};
          expect(auth.alice).can.write(newTask).to.path(`${tasksPath}/some-new-task`);
        });

      });

      it('should allow the owner create a task for a minimal number of achievements', function() {
        newTask.minTotalAchievements = 1;
        expect(auth.alice).can.write(newTask).to.path(`${tasksPath}/some-new-task`);
      });

      it('should disallow the owner create a badge task with minimal achievements', function() {
        newTask.badge = {id: 'foo', name: 'foo', iconUrl: '/default-icon'};
        newTask.minTotalAchievements = 1;
        expect(auth.alice).cannot.write(newTask).to.path(`${tasksPath}/some-new-task`);
      });

    });

  });

});
