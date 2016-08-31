import * as datastore from './datastore.js';
import sinon from 'sinon';
import {expect} from 'chai';

describe('datastore service.', function() {

  describe('currentUser service', function() {
    const spfProfilesPath = 'classMentors/userProfiles';
    let currentUser, $q, $timeout, $log, $rootScope, spfCrypto, spfFirebase, spfAuth, firebaseUser;

    beforeEach(function() {
      $q = (resolve, reject) => new Promise(resolve, reject);
      $q.resolve = Promise.resolve;
      $q.reject = Promise.reject;

      $timeout = sinon.stub();
      $timeout.cancel = sinon.spy();

      $log = {error: sinon.spy()};

      $rootScope = {$emit: sinon.spy(), $on: sinon.stub(), $applyAsync: sinon.spy()};

      spfCrypto = {md5: sinon.stub()};

      spfFirebase = {ref: sinon.stub()};

      spfAuth = {
        user: undefined,
        onAuth: sinon.stub(),
        login: sinon.stub(),
        logout: sinon.stub()
      };

      firebaseUser = {
        uid: 'google:bob',
        provider: 'google',
        google: {
          email: 'bob@example.com',
          displayName: 'bob smith'
        }
      };

      currentUser = new datastore.SpfCurrentUserService(
        $q, $timeout, $log, $rootScope, spfCrypto, spfFirebase, spfAuth, spfProfilesPath
      );
    });

    it('should watch for auth change', function() {
      expect(spfAuth.onAuth).to.have.been.calledOnce();
      expect(spfAuth.onAuth).to.have.been.calledWith(sinon.match.func);
    });

    it('should set user and profile when the current user is logged off', function() {
      expect(currentUser.firebaseUser).to.be.null();
      expect(currentUser.user).to.be.null();
      expect(currentUser.profile).to.be.null();
    });

    describe('authChangedHandler', function() {
      let ref;

      beforeEach(function() {
        ref = {
          on: sinon.spy(),
          off: sinon.spy()
        };
        spfFirebase.ref.withArgs('auth/users/google:bob').returns(ref);
        sinon.stub(currentUser, 'patchUser');
      });

      it('should be called when auth status changes', function() {
        const handler = spfAuth.onAuth.lastCall.args[0];

        sinon.stub(currentUser, 'authChangedHandler');
        handler();

        expect(currentUser.authChangedHandler).to.have.been.calledOnce();

        const status = {};

        handler(status);
        expect(currentUser.authChangedHandler).to.have.been.calledTwice();
        expect(currentUser.authChangedHandler).to.have.been.calledWith(status);
      });

      it('should set uid and firebaseUser property', function() {
        currentUser.authChangedHandler(firebaseUser);
        expect(currentUser.uid).to.equal(firebaseUser.uid);
        expect(currentUser.firebaseUser).to.equal(firebaseUser);

        expect($rootScope.$applyAsync).to.have.been.calledTwice();
        expect($rootScope.$emit).to.have.been.calledTwice();
        expect($rootScope.$emit).to.have.been.calledWith(
          datastore.eventName, sinon.match({firebaseUser: true})
        );
        expect($rootScope.$emit).to.have.been.calledWith(
          datastore.eventName, sinon.match({user: true})
        );
        expect($rootScope.$emit).to.have.been.calledWith(
          datastore.eventName, sinon.match({profile: true})
        );
      });

      it('should save the user data when he logs in', function() {
        spfCrypto.md5.withArgs('bob@example.com').returns('some-hash');

        currentUser.authChangedHandler(null);
        expect(currentUser.patchUser).to.not.have.been.called();

        currentUser.authChangedHandler(firebaseUser);
        expect(currentUser.patchUser).to.have.been.calledOnce();

        currentUser.authChangedHandler(firebaseUser);
        expect(currentUser.patchUser).to.have.been.calledTwice();

        currentUser.authChangedHandler(null);
        expect(currentUser.patchUser).to.have.been.calledTwice();
      });

      it('should watch user auth data record if the user is logged on', function() {
        currentUser.authChangedHandler(firebaseUser);

        expect(ref.on).to.have.been.calledOnce();
        expect(ref.on).to.have.been.calledWith('value', sinon.match.func, sinon.match.func);

        currentUser.authChangedHandler(firebaseUser);
        expect(ref.on).to.have.been.calledOnce();
      });

      it('should set $watchers.user', function() {
        currentUser.authChangedHandler(firebaseUser);
        expect(currentUser.$watchers.user).to.be.a('function');

        const handler = ref.on.lastCall.args[1];

        currentUser.$watchers.user();
        expect(ref.off).to.have.been.calledOnce();
        expect(ref.off).to.have.been.calledWith('value', handler);
      });

      it('should only start watching if the user was logged off', function() {
        currentUser.authChangedHandler(firebaseUser);
        currentUser.authChangedHandler(firebaseUser);
        expect(ref.on).to.have.been.calledOnce();
      });

      it('should reset user and profile when the user logs off', function() {
        const userOff = sinon.spy();
        const profileOff = sinon.spy();

        currentUser.user = {uid: 'google:bob', publicId: 'bob'};
        currentUser.profile = {};
        currentUser.$watchers.user = userOff;
        currentUser.$watchers.profile = profileOff;

        currentUser.authChangedHandler();

        expect(currentUser.user).to.be.null();
        expect(currentUser.profile).to.be.null();
        expect(userOff).to.have.been.called();
        expect(profileOff).to.have.been.called();
      });

      it('should reset user and profile when the user data watch fails', function() {
        currentUser.authChangedHandler(firebaseUser);

        const errorHandler = ref.on.lastCall.args[2];
        const userOff = sinon.spy();
        const profileOff = sinon.spy();

        currentUser.user = {uid: 'google:bob', publicId: 'bob'};
        currentUser.profile = {};
        currentUser.$watchers.user = userOff;
        currentUser.$watchers.profile = profileOff;

        errorHandler(new Error());

        expect(currentUser.user).to.be.null();
        expect(currentUser.profile).to.be.null();
        expect(userOff).to.have.been.called();
        expect(profileOff).to.have.been.called();
      });

    });

    describe('patchUser', function() {
      let userRef;

      beforeEach(function() {
        currentUser.firebaseUser = firebaseUser;
        userRef = {once: sinon.stub(), transaction: sinon.stub()};
        spfFirebase.ref.withArgs('auth/users/google:bob').returns(userRef);
        userRef.once.withArgs('value').returns(Promise.resolve());
        userRef.transaction.withArgs(sinon.match.func).returns(Promise.resolve());
      });

      it('should fetch the user data first', function() {
        return currentUser.patchUser().then(() => {
          expect(userRef.once).to.have.been.calledOnce();
          expect(userRef.once).to.have.been.calledWith('value');
          expect(userRef.once).to.have.been.calledBefore(userRef.transaction);
        });
      });

      describe('update', function() {
        let handler;

        beforeEach(function() {
          spfCrypto.md5.withArgs('bob@example.com').returns('some-hash');
          spfCrypto.md5.withArgs('other@example.com').returns('some-other-hash');

          return currentUser.patchUser().then(() => {
            expect(userRef.transaction).to.have.been.calledOnce();
            expect(userRef.transaction).to.have.been.calledWith(sinon.match.func);
            handler = userRef.transaction.lastCall.args[0];
          });
        });

        it('should create the auth data record if it does not exist', function() {
          expect(handler(null)).to.eql({
            id: 'google:bob',
            fullName: 'bob smith',
            displayName: 'bob smith',
            email: 'bob@example.com',
            gravatar: '//www.gravatar.com/avatar/some-hash',
            createdAt: {'.sv': 'timestamp'}
          });
        });

        it('should only update the record if the user is still logged in', function() {
          currentUser.firebaseUser = null;
          expect(handler(null)).to.be.undefined();
        });

        it('should not update the record if it is unchanged', function() {
          const user = {
            id: 'google:bob',
            fullName: 'bob smith',
            displayName: 'bob smith',
            email: 'bob@example.com',
            gravatar: '//www.gravatar.com/avatar/some-hash',
            createdAt: 1234567
          };

          expect(handler(user)).to.be.undefined();
        });

        it('should update the user data when he logs with a new email', function() {
          const user = {
            id: 'google:bob',
            fullName: 'bob smith',
            displayName: 'bob smith',
            email: 'bob@example.com',
            gravatar: '//www.gravatar.com/avatar/some-hash',
            createdAt: 1234567
          };

          currentUser.firebaseUser.google.email = 'other@example.com';

          expect(handler(user)).to.eql({
            id: 'google:bob',
            fullName: 'bob smith',
            displayName: 'bob smith',
            email: 'other@example.com',
            gravatar: '//www.gravatar.com/avatar/some-other-hash',
            createdAt: 1234567
          });
        });

        it('should update the user data when he logs in (2/2)', function() {
          const user = {
            id: 'google:bob',
            fullName: 'bob smith',
            displayName: 'bob smith',
            email: 'bob@example.com',
            gravatar: '//www.gravatar.com/avatar/some-hash',
            createdAt: {'.sv': 'timestamp'}
          };

          currentUser.firebaseUser.google.displayName += ' First of His Name';

          expect(handler(user)).to.eql({
            id: 'google:bob',
            fullName: 'bob smith First of His Name',
            displayName: 'bob smith',
            email: 'bob@example.com',
            gravatar: '//www.gravatar.com/avatar/some-hash',
            createdAt: {'.sv': 'timestamp'}
          });
        });

      });

    });

    describe('userChangedHandler', function() {
      const publicId = 'bob';
      let user, profileRef, profileDetailsRef;

      beforeEach(function() {
        currentUser.user = undefined;
        currentUser.profile = undefined;
        sinon.stub(currentUser, 'patchProfile');

        user = {
          id: 'google:bob',
          fullName: 'bob smith',
          displayName: 'bob smith',
          email: 'bob@example.com',
          gravatar: '//www.gravatar.com/avatar/some-hash',
          createdAt: {'.sv': 'timestamp'}
        };

        profileRef = {child: sinon.stub()};
        profileDetailsRef = {
          on: sinon.spy(),
          off: sinon.spy()
        };
        spfFirebase.ref.withArgs('classMentors/userProfiles/bob').returns(profileRef);
        profileRef.child.withArgs('user').returns(profileDetailsRef);
      });

      it('should be used to monitor user data changes', function() {
        const userRef = {
          on: sinon.spy(),
          off: sinon.spy()
        };

        spfFirebase.ref.withArgs('auth/users/google:bob').returns(userRef);
        sinon.stub(currentUser, 'patchUser');
        sinon.stub(currentUser, 'userChangedHandler');

        currentUser.authChangedHandler(firebaseUser);

        const handler = userRef.on.lastCall.args[1];
        const snapshot = {val: sinon.stub()};

        snapshot.val.returns(null);
        handler(snapshot);

        expect(currentUser.userChangedHandler).to.have.been.calledOnce();
        expect(currentUser.userChangedHandler).to.have.been.calledWith(null);

        const val = {};

        snapshot.val.returns(val);
        handler(snapshot);

        expect(currentUser.userChangedHandler).to.have.been.calledTwice();
        expect(currentUser.userChangedHandler).to.have.been.calledWith(val);
      });

      it('should update publicId and user properties', function() {
        currentUser.userChangedHandler(null);
        expect(currentUser.user).to.be.null();
        expect(currentUser.publicId).to.be.null();
        expect($rootScope.$applyAsync).to.have.been.calledOnce();
        expect($rootScope.$emit).to.have.been.calledTwice();
        expect($rootScope.$emit).to.have.been.calledWith(
          datastore.eventName, sinon.match({user: true})
        );
        expect($rootScope.$emit).to.have.been.calledWith(
          datastore.eventName, sinon.match({profile: true})
        );

        $rootScope.$applyAsync.reset();
        $rootScope.$emit.reset();
        currentUser.userChangedHandler(user);
        expect(currentUser.publicId).to.be.null();
        expect(currentUser.user).to.equal(user);
        expect($rootScope.$applyAsync).to.have.been.calledOnce();
        expect($rootScope.$emit).to.have.been.calledTwice();
        expect($rootScope.$emit).to.have.been.calledWith(
          datastore.eventName, sinon.match({user: true})
        );
        expect($rootScope.$emit).to.have.been.calledWith(
          datastore.eventName, sinon.match({profile: true})
        );

        $rootScope.$applyAsync.reset();
        $rootScope.$emit.reset();
        user.publicId = 'bob';
        currentUser.userChangedHandler(user);
        expect(currentUser.publicId).to.equal('bob');
        expect($rootScope.$applyAsync).to.have.been.calledTwice();
        expect($rootScope.$emit).to.have.been.calledTwice();
        expect($rootScope.$emit).to.have.been.calledWith(
          datastore.eventName, sinon.match({user: true})
        );
        expect($rootScope.$emit).to.have.been.calledWith(
          datastore.eventName, sinon.match({profile: true})
        );

        $rootScope.$applyAsync.reset();
        $rootScope.$emit.reset();
        currentUser.userChangedHandler(user);
        expect($rootScope.$applyAsync).to.have.been.calledOnce();
        expect($rootScope.$emit).to.have.been.calledOnce();
        expect($rootScope.$emit).to.have.been.calledWith(
          datastore.eventName, sinon.match({user: true})
        );
        expect($rootScope.$emit).to.not.have.been.calledWith(
          datastore.eventName, sinon.match({profile: true})
        );
      });

      it('should set profile property to null (not loading) when the user are not saved yet', function() {
        currentUser.userChangedHandler(null);
        expect(currentUser.profile).to.be.null();
      });

      it('should set profile property to null when the user is not registered (no public id)', function() {
        delete user.publicId;

        currentUser.userChangedHandler(user);
        expect(currentUser.profile).to.be.null();
      });

      it('should patch the profile if the user is registered', function() {
        currentUser.userChangedHandler(user);
        expect(currentUser.patchProfile).to.not.have.been.called();

        user.publicId = 'bob';
        currentUser.userChangedHandler(user);
        expect(currentUser.patchProfile).to.have.been.calledOnce();
      });

      it('should watch profile changes if the user is registered', function() {
        user.publicId = publicId;
        currentUser.userChangedHandler(user);

        expect(profileDetailsRef.on).to.have.been.calledOnce();
      });

      it('should only start the watch if the user just logged in', function() {
        user.publicId = publicId;
        currentUser.userChangedHandler(user);
        expect(profileDetailsRef.on).to.have.been.calledOnce();

        user.displayName = 'bob';
        currentUser.userChangedHandler(user);
        expect(profileDetailsRef.on).to.have.been.calledOnce();
      });

      it('should set $watchers.profile', function() {
        user.publicId = publicId;
        currentUser.userChangedHandler(user);
        expect(currentUser.$watchers.profile).to.be.a('function');

        const handler = profileDetailsRef.on.lastCall.args[1];

        currentUser.$watchers.profile();
        expect(profileDetailsRef.off).to.have.been.calledOnce();
        expect(profileDetailsRef.off).to.have.been.calledWith('value', handler);
      });

      it('should reset profile when the profile details watch fails', function() {
        user.publicId = publicId;
        currentUser.userChangedHandler(user);

        const errorHandler = profileDetailsRef.on.lastCall.args[2];
        const userOff = sinon.spy();
        const profileOff = sinon.spy();
        const userDetails = {uid: 'google:bob', publicId: 'bob'};

        currentUser.user = userDetails;
        currentUser.profile = {};
        currentUser.$watchers.user = userOff;
        currentUser.$watchers.profile = profileOff;

        errorHandler(new Error());

        expect(currentUser.user).to.equal(userDetails);
        expect(currentUser.profile).to.be.null();
        expect(userOff).to.not.have.been.called();
        expect(profileOff).to.have.been.called();
      });

    });

    describe('patchProfile', function() {
      let detailsRef;

      beforeEach(function() {
        const profileRef = {child: sinon.stub()};

        detailsRef = {once: sinon.stub(), transaction: sinon.stub()};
        profileRef.child.withArgs('user').returns(detailsRef);
        spfFirebase.ref.withArgs('classMentors/userProfiles/bob').returns(profileRef);
        detailsRef.once.withArgs('value').returns(Promise.resolve());
        detailsRef.transaction.withArgs(sinon.match.func).returns(Promise.resolve());

        currentUser.publicId = 'bob';
        currentUser.user = {
          id: 'google:bob',
          publicId: 'bob',
          fullName: 'bob smith',
          displayName: 'bob smith',
          email: 'bob@example.com',
          gravatar: '//www.gravatar.com/avatar/some-hash',
          createdAt: {'.sv': 'timestamp'}
        };
      });

      it('should fetch the user data first', function() {
        return currentUser.patchProfile().then(() => {
          expect(detailsRef.once).to.have.been.calledOnce();
          expect(detailsRef.once).to.have.been.calledWith('value');
          expect(detailsRef.once).to.have.been.calledBefore(detailsRef.transaction);
        });
      });

      describe('update', function() {
        let handler;

        beforeEach(function() {
          return currentUser.patchProfile().then(() => {
            expect(detailsRef.transaction).to.have.been.calledOnce();
            expect(detailsRef.transaction).to.have.been.calledWith(sinon.match.func);
            handler = detailsRef.transaction.lastCall.args[0];
          });
        });

        it('should create the user profile if he user has just registered', function() {
          expect(handler(null)).to.eql({
            displayName: 'bob smith',
            gravatar: '//www.gravatar.com/avatar/some-hash',
            yearOfBirth: null,
            school: null,
            country: null
          });
        });

        it('should update the user profile if he user has new auth data (1/3)', function() {
          const profile = {
            displayName: 'bob smith',
            gravatar: '//www.gravatar.com/avatar/some-hash'
          };

          currentUser.user.country = {name: 'United Kingdom', code: 'GB'};

          expect(handler(profile)).to.eql({
            displayName: 'bob smith',
            gravatar: '//www.gravatar.com/avatar/some-hash',
            yearOfBirth: null,
            school: null,
            country: {name: 'United Kingdom', code: 'GB'}
          });
        });

        it('should update the user profile if he user has new auth data (2/3)', function() {
          const profile = {
            displayName: 'bob smith',
            gravatar: '//www.gravatar.com/avatar/some-hash',
            country: {name: 'United Kingdom', code: 'GB'}
          };

          currentUser.user.country = {name: 'France', code: 'FR'};

          expect(handler(profile)).to.eql({
            displayName: 'bob smith',
            gravatar: '//www.gravatar.com/avatar/some-hash',
            yearOfBirth: null,
            school: null,
            country: {name: 'France', code: 'FR'}
          });
        });

        it('should update the user profile if he user has new auth data (3/3)', function() {
          const profile = {
            displayName: 'bob smith',
            gravatar: '//www.gravatar.com/avatar/some-hash',
            school: {
              iconUrl: '/assets/crests/tempbadge.png',
              id: 'Admiralty Secondary School',
              name: 'Admiralty Secondary School',
              type: 'Secondary'
            }
          };

          currentUser.user.school = {
            id: 'Admiralty Secondary School',
            name: 'Admiralty Secondary School',
            type: 'Secondary'
          };

          expect(handler(profile)).to.eql({
            displayName: 'bob smith',
            gravatar: '//www.gravatar.com/avatar/some-hash',
            yearOfBirth: null,
            school: {
              id: 'Admiralty Secondary School',
              name: 'Admiralty Secondary School',
              type: 'Secondary'
            },
            country: null
          });
        });

        it('should not update the user profile if the auth data are unchanged', function() {
          const profile = {
            displayName: 'bob smith',
            gravatar: '//www.gravatar.com/avatar/some-hash'
          };

          expect(handler(profile)).to.be.undefined();
        });

        it('should not update the user profile if auth data get lost', function() {
          const profile = {
            displayName: 'bob smith',
            gravatar: '//www.gravatar.com/avatar/some-hash'
          };

          currentUser.user = null;
          expect(handler(profile)).to.be.undefined();
        });

      });
    });

    describe('profileChangedHandler', function() {

      it('should be used to monitor profile changes', function() {
        const user = {
          id: 'google:bob',
          publicId: 'bob',
          fullName: 'bob smith',
          displayName: 'bob smith',
          email: 'bob@example.com',
          gravatar: '//www.gravatar.com/avatar/some-hash',
          createdAt: {'.sv': 'timestamp'}
        };
        const profileRef = {child: sinon.stub()};
        const profileDetailsRef = {
          on: sinon.spy(),
          once: sinon.stub(),
          transaction: sinon.spy()
        };

        spfFirebase.ref.withArgs('classMentors/userProfiles/bob').returns(profileRef);
        profileDetailsRef.once.withArgs('value').returns(Promise.resolve());
        profileRef.child.withArgs('user').returns(profileDetailsRef);
        sinon.stub(currentUser, 'profileChangedHandler');

        currentUser.userChangedHandler(user);

        const snapshot = {val: sinon.stub()};
        const handler = profileDetailsRef.on.lastCall.args[1];

        snapshot.val.returns(null);
        handler(snapshot);
        expect(currentUser.profileChangedHandler).to.have.been.calledOnce();
        expect(currentUser.profileChangedHandler).to.have.been.calledWith(null);

        const profile = {};

        snapshot.val.returns(profile);
        handler(snapshot);
        expect(currentUser.profileChangedHandler).to.have.been.calledTwice();
        expect(currentUser.profileChangedHandler).to.have.been.calledWith(profile);
      });

      it('should update isAdmin, isPremium && profile properties', function() {
        currentUser.profile = undefined;
        currentUser.profileChangedHandler(null);
        expect(currentUser.isAdmin).to.be.false();
        expect(currentUser.isPremium).to.be.false();
        expect(currentUser.profile).to.be.null();

        const profile = {};

        currentUser.profileChangedHandler(profile);
        expect(currentUser.profile).to.equal(profile);
        expect(currentUser.isAdmin).to.be.false();
        expect(currentUser.isPremium).to.be.false();

        profile.isAdmin = true;
        profile.isPremium = true;
        currentUser.profileChangedHandler(profile);
        expect(currentUser.profile).to.equal(profile);
        expect(currentUser.isAdmin).to.be.true();
        expect(currentUser.isPremium).to.be.true();
      });

    });

    describe('userRef', function() {
      let ref;

      beforeEach(function() {
        spfFirebase.ref.returns(ref);
      });

      it('should return a firebase reference to a user auth data', function() {
        expect(currentUser.userRef('google:bob')).to.equal(ref);
        expect(spfFirebase.ref).to.have.been.calledWith('auth/users/google:bob');

        expect(currentUser.userRef('google:alice')).to.equal(ref);
        expect(spfFirebase.ref).to.have.been.calledWith('auth/users/google:alice');
      });

      it('should throw if uid is not provided', function() {
        expect(() => currentUser.userRef('')).to.throw();
        expect(() => currentUser.userRef()).to.throw();
      });

    });

    describe('profileRef', function() {
      let ref;

      beforeEach(function() {
        spfFirebase.ref.returns(ref);
      });

      it('should return a firebase reference to a user auth data', function() {
        expect(currentUser.profileRef('bob')).to.equal(ref);
        expect(spfFirebase.ref).to.have.been.calledWith('classMentors/userProfiles/bob');

        expect(currentUser.profileRef('alice')).to.equal(ref);
        expect(spfFirebase.ref).to.have.been.calledWith('classMentors/userProfiles/alice');
      });

      it('should throw if uid is not provided', function() {
        expect(() => currentUser.profileRef('')).to.throw();
        expect(() => currentUser.profileRef()).to.throw();
      });

    });

    describe('watchUser', function() {
      let ref;

      beforeEach(function() {
        ref = {on: sinon.stub(), off: sinon.spy()};

        currentUser.firebaseUser = {uid: 'bob'};
        spfFirebase.ref.returns(ref);
        currentUser.watchUser();

        ref.on.reset();
        ref.off.reset();
      });

      it('should reset user if the user is not logged in', function() {
        currentUser.firebaseUser = null;
        currentUser.user = undefined;
        currentUser.watchUser();
        expect(currentUser.user).to.be.null();
        expect(ref.on).to.not.have.been.called();
      });

    });

    describe('watchProfile', function() {
      let ref;

      beforeEach(function() {
        ref = {on: sinon.stub(), off: sinon.spy(), child: sinon.stub().returnsThis()};

        currentUser.user = {uid: 'google:bob', publicId: 'bob'};
        spfFirebase.ref.returns(ref);
        currentUser.watchProfile();

        ref.on.reset();
        ref.off.reset();
      });

      it('should reset user if the user data are not saved', function() {
        currentUser.user = null;
        currentUser.profile = undefined;
        currentUser.watchProfile();
        expect(currentUser.user).to.be.null();
        expect(ref.on).to.not.have.been.called();
      });

    });

    describe('info', function() {

      beforeEach(function() {
        currentUser.firebaseUser = {
          uid: 'google:bob',
          provider: 'google',
          google: {
            displayName: 'bob smith',
            email: 'bob@example.com'
          }
        };
      });

      it('should return name and email if user logged on with google provider', function() {
        expect(currentUser.info()).to.eql({
          name: 'bob smith',
          email: 'bob@example.com'
        });
      });

      it('should mock name and email with custom provider', function() {
        delete currentUser.firebaseUser.google;
        currentUser.firebaseUser.provider = 'custom';
        expect(currentUser.info()).to.have.property('email');
        expect(currentUser.info()).to.have.property('name');
      });

      it('should throw if the user is logned in with an unknown provider', function() {
        delete currentUser.firebaseUser.google;
        currentUser.firebaseUser.provider = 'facebook';
        expect(() => currentUser.info()).to.throw();
      });
    });

    describe('$watch', function() {
      let deregister;

      beforeEach(function() {
        deregister = sinon.spy();
        $rootScope.$on.withArgs(datastore.eventName, sinon.match.func).returns(deregister);
      });

      it('should register', function() {
        const handler = () => undefined;

        currentUser.$watch(handler);
        expect($rootScope.$on).to.have.been.calledOnce();
        expect($rootScope.$on).to.have.been.calledWith(datastore.eventName, handler);
      });

      it('should return a deregistered function', function() {
        expect(currentUser.$watch(()=> undefined)).to.equal(deregister);
      });

    });

    describe('login', function() {

      it('should login current user', function() {
        currentUser.login();
        expect(spfAuth.login).to.have.been.calledOnce();
      });

    });

    describe('logout', function() {

      it('should logout current user', function() {
        currentUser.logout();
        expect(spfAuth.logout).to.have.been.calledOnce();
      });

    });

    describe('register', function() {
      const publicId = 'bob';
      const displayName = 'bobby';
      let ref;

      beforeEach(function() {
        ref = {update: sinon.stub()};
        ref.update.returns(Promise.resolve());
        spfFirebase.ref.withArgs('auth').returns(ref);

        currentUser.firebaseUser = firebaseUser;
        currentUser.uid = firebaseUser.uid;
        currentUser.user = {};
      });

      it('should reject if the user is not logged in', function() {
        currentUser.firebaseUser = null;
        currentUser.uid = null;

        return currentUser.register({publicId, displayName}).then(
          () => new Error('unexpected'),
          () => undefined
        );
      });

      it('should reject if the user is already registered', function() {
        currentUser.user.publicId = publicId;
        currentUser.publicId = publicId;

        return currentUser.register({publicId, displayName}).then(
          () => new Error('unexpected'),
          () => undefined
        );
      });

      it('should reject if public id is not provided', function() {
        return currentUser.register({displayName}).then(
          () => new Error('unexpected'),
          () => undefined
        );
      });

      it('should patch auth with public id', function() {
        return currentUser.register({publicId: 'bob'}).then(() => {
          expect(ref.update).to.have.been.calledOnce();
          expect(ref.update).to.have.been.calledWith(sinon.match({
            'publicIds/bob': firebaseUser.uid,
            'usedPublicIds/bob': true,
            'users/google:bob/publicId': 'bob'
          }));
        });
      });

      it('should patch auth with public id and display name', function() {
        return currentUser.register({publicId: 'bob', displayName: 'bobby'}).then(() => {
          expect(ref.update).to.have.been.calledOnce();
          expect(ref.update).to.have.been.calledWith(sinon.match({
            'publicIds/bob': firebaseUser.uid,
            'usedPublicIds/bob': true,
            'users/google:bob/publicId': 'bob',
            'users/google:bob/displayName': 'bobby'
          }));
        });
      });

    });

    describe('$loaded', function() {
      let stop, timer;

      beforeEach(function() {
        stop = sinon.spy();
        timer = sinon.spy();
        $rootScope.$on.returns(stop);
        $timeout.returns(timer);

        currentUser.user = undefined;
        currentUser.profile = undefined;
      });

      it('should resolve immediatly if the currentUser state is stable', function() {
        currentUser.user = null;
        currentUser.profile = null;

        return currentUser.$loaded();
      });

      it('should reject when timing out', function() {
        const promise = currentUser.$loaded();

        expect($timeout).to.have.been.calledOnce();
        expect($timeout).to.have.been.calledWith(sinon.match.func, 2000);

        const timerHandler = $timeout.lastCall.args[0];

        timerHandler();

        return promise.then(
          () => Promise.reject(new Error('unexpected')),
          () => expect(stop).to.have.been.calledOnce()
        );
      });

      it('should accept the timing out delay', function() {
        currentUser.$loaded(10);

        expect($timeout).to.have.been.calledOnce();
        expect($timeout).to.have.been.calledWith(sinon.match.func, 10);

        const timerHandler = $timeout.lastCall.args[0];

        timerHandler();
      });

      it('should resolve when the state stabilise', function() {
        const promise = currentUser.$loaded();

        expect($rootScope.$on).to.have.been.calledOnce();
        expect($rootScope.$on).to.have.been.calledWith(datastore.eventName, sinon.match.func);

        const updateHandler = $rootScope.$on.lastCall.args[1];

        updateHandler();
        currentUser.user = null;
        currentUser.profile = null;
        updateHandler();

        return promise.then(() => {
          expect(stop).to.have.been.calledOnce();
          expect($timeout.cancel).to.have.been.calledOnce();
          expect($timeout.cancel).to.have.been.calledWith(timer);
        });
      });

    });

  });

  describe('run', function() {
    let $log;

    beforeEach(function() {
      $log = {info: sinon.spy()};
    });

    it('should throw if spfProfilesPath is not set', function() {
      expect(() => datastore.run($log, null)).to.throw();
    });

    it('should not throw if spfProfilesPath is set', function() {
      expect(() => datastore.run($log, 'some/path')).to.not.throw();
    });

    it('should log spfProfilesPath', function() {
      datastore.run($log, 'some/path');
      expect($log.info).to.have.been.calledOnce();
      expect($log.info).to.have.been.calledWith(sinon.match(/some\/path/));
    });

  });

});
