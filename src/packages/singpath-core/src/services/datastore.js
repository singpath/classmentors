'use strict';

import angular from 'angular';
import {spfShared} from '../module.js';

/**
 * Returns an object with `user` (Firebase auth user data) property,
 * and login/logout methods.
 */
spfShared.factory('spfAuth', [
  '$q',
  '$route',
  '$log',
  '$firebaseAuth',
  'spfFirebaseRef',
  function($q, $route, $log, $firebaseAuth, spfFirebaseRef) {
    var auth = $firebaseAuth(spfFirebaseRef());
    var options = {
      scope: 'email'
    };

    var spfAuth = {
      // The current user auth data (null is not authenticated).
      user: auth.$getAuth(),

      /**
       * Start Oauth authentication dance against google oauth2 service.
       *
       * It will attempt the process using a pop up and fails back on
       * redirect.
       *
       * Updates spfAuth.user and return a promise resolving to the
       * current user auth data.
       *
       */
      login: function() {
        var self = this;

        return auth.$authWithOAuthPopup('google', options).then(function(user) {
          self.user = user;
          return user;
        }, function(error) {
          // spfAlert.warning('You failed to authenticate with Google');
          if (error.code === 'TRANSPORT_UNAVAILABLE') {
            return auth.$authWithOAuthRedirect('google', options);
          }
          return $q.reject(error);
        });
      },

      /**
       * Unauthenticate user and reset spfAuth.user.
       *
       */
      logout: function() {
        auth.$unauth();
      },

      /**
       * Register a callback for the authentication event.
       */
      onAuth: function(fn, ctx) {
        return auth.$onAuth(fn, ctx);
      }
    };

    spfAuth.onAuth(function(currentAuth) {
      $log.debug('reloading');
      $route.reload();

      if (!currentAuth) {
        spfAuth.user = undefined;
      }
    });

    return spfAuth;
  }
]);

/**
 * Service to interact with '/auth/users' singpath firebase db entry
 *
 */
spfShared.factory('spfAuthData', [
  '$q',
  '$log',
  'spfFirebase',
  'spfAuth',
  'spfCrypto',
  function spfAuthDataFactory($q, $log, spfFirebase, spfAuth, spfCrypto) {
    var userData, userDataPromise, spfAuthData;

    spfAuth.onAuth(function(auth) {
      if (!auth) {
        userData = userDataPromise = undefined;
      }
    });

    spfAuthData = {
      _factory: spfFirebase.objFactory({
        $completed: function() {
          return Boolean(
            this.publicId &&
            this.country && (
              this.yearOfBirth ||
              this.country.code !== 'SG'
            ) && (
              this.school || (
                !this.yearOfBirth ||
                this.yearOfBirth < 1996 ||
                this.yearOfBirth > 2004
            ))
          );
        }
      }),

      _user: function() {
        return spfAuthData._factory(['auth/users', spfAuth.user.uid]).$loaded();
      },

      /**
       * Returns a promise resolving to an angularFire $firebaseObject
       * for the current user data.
       *
       * The promise will be rejected if the is not authenticated.
       *
       */
      user: function() {
        if (!spfAuth.user || !spfAuth.user.uid) {
          return $q.reject(new Error('Your did not login or your session expired.'));
        }

        if (userData) {
          return $q.when(userData);
        }

        if (userDataPromise) {
          return $q.when(userDataPromise);
        }

        userDataPromise = spfAuthData._user().then(
          spfAuthData.register
        ).then(function(data) {
          userData = data;
          userDataPromise = null;
          return data;
        });

        return userDataPromise;
      },

      /**
       * Setup initial data for the current user.
       *
       * Should run if 'auth.user().$value is `null`.
       *
       * Returns a promise resolving to the user data when
       * they become available.
       *
       */
      register: function(userDataObj) {
        var gravatarBaseUrl = '//www.gravatar.com/avatar/';
        var email, name;

        if (angular.isUndefined(userDataObj)) {
          return $q.reject(new Error('A user should be logged in to register'));
        }

        // $value will be undefined and not null when the userDataObj object
        // is set.
        if (userDataObj.$value !== null) {
          return $q.when(userDataObj);
        }

        if (spfAuth.user.provider === 'google') {
          email = spfAuth.user.google.email;
          name = spfAuth.user.google.displayName;
        } else if (spfAuth.user.provider === 'custom') {
          email = 'custom@example.com';
          name = 'Custom User';
        } else {
          return $q.reject(new Error('Wrong provider: ' + spfAuth.user.provider));
        }

        userDataObj.$value = {
          id: spfAuth.user.uid,
          fullName: name,
          displayName: name,
          email: email,
          gravatar: gravatarBaseUrl + spfCrypto.md5(email),
          createdAt: {
            '.sv': 'timestamp'
          }
        };

        return userDataObj.$save().then(function() {
          return userDataObj;
        });
      },

      publicId: function(userSync) {
        if (!userSync || !userSync.publicId) {
          return $q.reject(new Error('The user has not set a user public id.'));
        }

        var data = {};

        data['users/' + userSync.$id + '/publicId'] = userSync.publicId;
        data['publicIds/' + userSync.publicId] = userSync.$id;
        data['usedPublicIds/' + userSync.publicId] = true;

        return spfFirebase.patch(['auth'], data).catch(function(err) {
          $log.info(err);
          return $q.reject(new Error('Failed to save public id. It might have already being used by an other user.'));
        });
      },

      isPublicIdAvailable: function(publicId) {
        return spfFirebase.loadedObj(['auth/usedPublicIds', publicId]).then(function(publicIdSync) {
          return !publicIdSync.$value;
        });
      }
    };

    return spfAuthData;
  }
]);

spfShared.factory('spfSchools', [
  '$q',
  'spfFirebase',
  function spfSchoolsFactory($q, spfFirebase) {
    var promise = spfFirebase.loadedObj(['classMentors/schools']);

    return function spfSchools() {
      return promise;
    };
  }
]);
