'use strict';

const chai = require('chai');
const expect = chai.expect;
const utils = require('./utils.js');
const auth = utils.auth;

describe('profile', function() {

  beforeEach(function() {
    utils.setFirebaseData();
  });

  describe('service', function() {

    describe('registration', function() {
      const publicId = 'alice';
      const userId = `codeCombat:${publicId}`;
      const detailsPath = `classMentors/userProfiles/${publicId}/services/codeCombat/details`;
      let details;

      beforeEach(function() {
        details = {
          id: userId,
          name: userId,
          registeredBefore: utils.timestamp()
        };
      });

      it('should allow a user to register a service', function() {
        expect(auth.alice).can.write(details).to.path(detailsPath);
      });

      it('should disallow a user to register a service without a user id', function() {
        delete details.id;
        expect(auth.alice).cannot.write(details).to.path(detailsPath);
      });

      it('should disallow a user to register a service without a user name', function() {
        delete details.name;
        expect(auth.alice).cannot.write(details).to.path(detailsPath);
      });

      it('should disallow a user to register a service without an initial timestamp', function() {
        delete details.registeredBefore;
        expect(auth.alice).cannot.write(details).to.path(detailsPath);

        details.registeredBefore = 1;
        expect(auth.alice).cannot.write(details).to.path(detailsPath);
      });

    });

    describe('removal', function() {
      const servicePath = 'classMentors/userProfiles/bob/services/codeCombat';

      it('should allow a user to remove a service', function() {
        expect(auth.bob).can.write(null).to.path(servicePath);
      });

    });

    describe('update request', function() {

      function requestPatch(publicId) {
        var servicePath = `classMentors/userProfiles/${publicId}/services/codeCombat`;

        return {
          'queue/tasks/someRandomTaskId': {id: publicId, service: 'codeCombat'},
          [`${servicePath}/lastUpdateRequest`]: {'.sv': 'timestamp'}
        };
      }

      it('should allow users to request an update', function() {
        const patch = requestPatch('bob');

        expect(auth.bob).can.patch(patch).to.path('/');
      });

      it('should allow admin to request some user service update', function() {
        const patch = requestPatch('bob');

        expect(auth.admin).can.patch(patch).to.path('/');
      });

      it('should disallow users to request other users update', function() {
        const patch = requestPatch('bob');

        expect(auth.alice).cannot.patch(patch).to.path('/');
      });
    });

  });

});
