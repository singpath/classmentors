'use strict';

const chai = require('chai');
const expect = chai.expect;
const utils = require('./utils.js');

describe('registration', function() {
  const bobPublicId = 'bob';
  let bob, alice, bobData;

  beforeEach(function() {
    bob = {
      uid: 'github:12345',
      id: 12345,
      provider: 'github'
    };
    alice = {
      uid: 'github:12346',
      id: 12346,
      provider: 'github'
    };
    bobData = {
      displayName: 'bob',
      email: 'bob@example.com',
      fullName: 'Bob Smith',
      gravatar: '//www.gravatar.com/avatar/some-hash',
      id: bob.uid,
      yearOfBirth: 1990,
      createdAt: {'.sv': 'timestamp'}
    };
    utils.setFirebaseData({auth: {users: {[bob.uid]: null}}});
  });

  it('should allow authenticated user to register', function() {
    expect(bob).can.write(bobData).path(`auth/users/${bob.uid}`);

    utils.setFirebaseData({auth: {users: {[bob.uid]: bobData}}});
    expect(bob).can.patch({
      [`publicIds/${bobPublicId}`]: bob.uid,
      [`usedPublicIds/${bobPublicId}`]: true,
      [`users/${bob.uid}/publicId`]: bobPublicId
    }).path('auth');
  });

  it('should fail is the publicId is already claimed', function() {
    utils.setFirebaseData({
      auth: {
        publicIds: {[`${bobPublicId}`]: bob.uid},
        usedPublicIds: {[`${bobPublicId}`]: true},
        users: {
          [bobData.uid]: bobData,
          [alice.uid]: {
            displayName: 'alice',
            email: 'alice@example.com',
            fullName: 'Alice Smith',
            gravatar: '//www.gravatar.com/avatar/some-hash',
            id: alice.uid,
            yearOfBirth: 1990,
            createdAt: {'.sv': 'timestamp'}
          }
        }
      }
    });

    expect(bob).cannot.patch({
      [`publicIds/${bobPublicId}`]: alice.uid,
      [`usedPublicIds/${bobPublicId}`]: true,
      [`users/${alice.uid}/publicId`]: bobPublicId
    }).path('auth');
  });

  describe('auth', function() {

    describe('publicIds', function() {
      const path = 'auth/publicIds';

      it('should not be searcheable', function() {
        expect(bob).cannot.read.path(path);
      });

      describe('$publicId', function() {
        const bobClaim = `${path}/${bobPublicId}`;
        let patch;

        beforeEach(function() {
          bobData.publicId = bobPublicId;
          patch = {
            auth: {
              publicIds: {[`${bobPublicId}`]: bob.uid},
              usedPublicIds: {[`${bobPublicId}`]: true},
              users: {[bob.uid]: bobData}
            }
          };
          utils.setFirebaseData(patch);
        });

        it('should not be readeable', function() {
          expect(null).cannot.read.path(bobClaim);
        });

        it('should not be deleteable', function() {
          expect(bob).cannot.write(null).path(bobClaim);
        });

      });

    });

    describe('usedPublicIds', function() {
      const path = 'auth/usedPublicIds';

      it('should be searcheable', function() {
        expect(bob).can.read.path(path);
      });

      describe('$publicId', function() {
        const bobIsClaimed = `${path}/${bobPublicId}`;
        let patch;

        beforeEach(function() {
          bobData.publicId = bobPublicId;
          patch = {
            auth: {
              publicIds: {[`${bobPublicId}`]: bob.uid},
              usedPublicIds: {[`${bobPublicId}`]: true},
              users: {[bob.uid]: bobData}
            }
          };
          utils.setFirebaseData(patch);
        });

        it('should not be editable', function() {
          expect(bob).cannot.write(false).path(bobIsClaimed);
        });

      });

    });

    describe('users', function() {
      const path = 'auth/users';

      it('should not be searcheable', function() {
        expect(bob).cannot.read.path(path);
      });

      describe('$userId', () => {
        let userPath, patch;

        beforeEach(function() {
          userPath = `${path}/${bob.uid}`;
          bobData.publicId = bobPublicId;
          patch = {
            auth: {
              publicIds: {[`${bobPublicId}`]: bob.uid},
              usedPublicIds: {[`${bobPublicId}`]: true},
              users: {[bob.uid]: bobData}
            }
          };
          utils.setFirebaseData(patch);
        });

        it('should be readeable by the user', function() {
          expect(bob).can.read.path(userPath);
        });

        it('should not be readeable by other user', function() {
          expect(alice).cannot.read.path(userPath);
        });

        it('should only be writable by user', function() {
          expect(bob).can.write(1991).path(`${userPath}/yearOfBirth`);
          expect(alice).cannot.write(1991).path(`${userPath}/yearOfBirth`);
        });

        it('can include a country', function() {
          const country = {
            name: 'Singapore',
            code: 'SG'
          };

          expect(bob).can.write(country).path(`${userPath}/country`);
        });

        it('can include school', function() {
          const school = {
            iconUrl: '/assets/crests/NUS_HS.jpeg',
            id: 'NUS High School',
            name: 'NUS High School',
            type: 'Junior College'
          };

          expect(bob).can.write(school).path(`${userPath}/school`);
        });

        it('can include school with no icon', function() {
          const school = {
            id: 'NUS High School',
            name: 'NUS High School',
            type: 'Junior College'
          };

          expect(bob).can.write(school).path(`${userPath}/school`);
        });

        it('can include a secret key', function() {
          const keyPatch = {
            secretKey: 's'.repeat(16),
            secretKeyValidUntil: Date.now() + 3600
          };

          expect(bob).can.patch(keyPatch).path(userPath);
        });

      });

    });

  });

});
