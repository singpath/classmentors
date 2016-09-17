'use strict';

const chai = require('chai');
const expect = chai.expect;
const utils = require('./utils.js');
const auth = utils.auth;

describe('auth', function() {

  describe('#registration', function() {

    it('should allow authenticated user to save his data', function() {
      utils.setFirebaseData({
        auth: {
          users: {'google:bob': undefined},
          publicIds: {bob: undefined},
          usedPublicIds: {bob: undefined}
        }
      });

      const bobData = utils.fixtures('auth/users/google:bob');

      delete bobData.publicId;
      bobData.createdAt = {'.sv': 'timestamp'};

      expect(auth.bob).can.write(bobData).path('auth/users/google:bob');
    });

    it('should let the user the claim a user name', function() {
      utils.setFirebaseData({
        auth: {
          users: {'google:bob': {publicId: undefined}},
          publicIds: {bob: undefined},
          usedPublicIds: {bob: undefined}
        }
      });
      expect(auth.bob).can.patch({
        'publicIds/bob': 'google:bob',
        'usedPublicIds/bob': true,
        'users/google:bob/publicId': 'bob'
      }).path('auth');

    });

    it('should fail is the publicId is already claimed', function() {
      utils.setFirebaseData({
        auth: {
          users: {'google:bob': {publicId: undefined}},
          publicIds: {bob: undefined},
          usedPublicIds: {bob: undefined}
        }
      });

      expect(auth.bob).cannot.patch({
        'publicIds/alice': 'google:bob',
        'usedPublicIds/alice': true,
        'users/google:bob/publicId': 'alice'
      }).path('auth');
    });

  });

  describe('publicIds', function() {
    const path = 'auth/publicIds';

    it('should not be searcheable', function() {
      expect(auth.bob).cannot.read.path(path);
    });

    describe('$publicId', function() {
      const bobClaim = `${path}/bob`;

      beforeEach(function() {
        utils.setFirebaseData();
      });

      it('should not be readeable', function() {
        expect(null).cannot.read.path(bobClaim);
      });

      it('should not be deleteable', function() {
        expect(auth.bob).cannot.write(null).path(bobClaim);
      });

    });

  });

  describe('usedPublicIds', function() {
    const path = 'auth/usedPublicIds';

    it('should be searcheable', function() {
      expect(auth.bob).can.read.path(path);
    });

    describe('$publicId', function() {
      const bobIsClaimed = `${path}/bob`;

      beforeEach(function() {
        utils.setFirebaseData();
      });

      it('should not be editable', function() {
        expect(auth.bob).cannot.write(false).path(bobIsClaimed);
      });

    });

  });

  describe('users', function() {
    const path = 'auth/users';

    it('should not be searcheable', function() {
      expect(auth.bob).cannot.read.path(path);
    });

    describe('$userId', () => {
      const userPath = `${path}/google:bob`;

      beforeEach(function() {
        utils.setFirebaseData();
      });

      it('should be readeable by the user', function() {
        expect(auth.bob).can.read.path(userPath);
      });

      it('should not be readeable by other user', function() {
        expect(auth.alice).cannot.read.path(userPath);
      });

      it('should only be writable by user', function() {
        expect(auth.bob).can.write(1991).path(`${userPath}/yearOfBirth`);
        expect(auth.alice).cannot.write(1991).path(`${userPath}/yearOfBirth`);
      });

      it('can include a country', function() {
        const country = {
          name: 'Singapore',
          code: 'SG'
        };

        expect(auth.bob).can.write(country).path(`${userPath}/country`);
      });

      it('can include school', function() {
        const school = {
          iconUrl: '/assets/crests/NUS_HS.jpeg',
          id: 'NUS High School',
          name: 'NUS High School',
          type: 'Junior College'
        };

        expect(auth.bob).can.write(school).path(`${userPath}/school`);
      });

      it('can include school with no icon', function() {
        const school = {
          id: 'NUS High School',
          name: 'NUS High School',
          type: 'Junior College'
        };

        expect(auth.bob).can.write(school).path(`${userPath}/school`);
      });

      it('can include a secret key', function() {
        const keyPatch = {
          secretKey: 's'.repeat(16),
          secretKeyValidUntil: Date.now() + 3600
        };

        expect(auth.bob).can.patch(keyPatch).path(userPath);
      });

    });

  });

});
