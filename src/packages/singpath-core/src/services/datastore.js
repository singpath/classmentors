/**
 * singpath-core/services/datastore.js - singpath-core services accessing data
 * share between singpath and classmentors.
 *
 */
/* eslint no-underscore-dangle: ["error", { "allow": ["_user", "_factory"] }]*/

/**
 * Returns an object with `user` (Firebase auth user data) property,
 * and login/logout methods.
 *
 * @param  {function} $q             Angular promise factory service.
 * @param  {object}   $route         Angular router service.
 * @param  {object}   $log           Angular logging service.
 * @param  {object}   $firebaseAuth  Angularfire autentication service.
 * @param  {function} spfFirebaseRef singpath-core firebase reference factory service.
 * @return {{user: object, login: function, logout: function, onAuth: function}}
 */
export function spfAuthFactory($q, $route, $log, $firebaseAuth, spfFirebaseRef) {
  var auth = $firebaseAuth(spfFirebaseRef());
  var options = {scope: 'email'};

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
     * @return {promise}
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
     *
     * @param  {function} fn  cb function for auth change events.
     * @param  {[type]}   ctx cb context.
     * @return {void}
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

spfAuthFactory.$inject = [
  '$q',
  '$route',
  '$log',
  '$firebaseAuth',
  'spfFirebaseRef'
];

/**
 * Service to interact with '/auth/users' singpath firebase db entry
 *
 * @param  {function} $q          Angular promise factory service.
 * @param  {object}   $log        Angular logging service.
 * @param  {object}   spfFirebase singpath-core firebase helpers service.
 * @param  {object}   spfAuth     singpath-core authentication service.
 * @param  {object}   spfCrypto   singpath-core crypto helpers service.
 * @return {{user: function, register: function, publicId: function, isPublicIdAvailable: function}}
 */
export function spfAuthDataFactory($q, $log, spfFirebase, spfAuth, spfCrypto) {
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
     * @return {Promise<object, Error>}
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
     * @param  {object} userDataObj user data to register.
     * @return {Promise<object, Error>}
     */
    register: function(userDataObj) {
      var gravatarBaseUrl = '//www.gravatar.com/avatar/';
      var email, name;

      if (userDataObj == null) {
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
        return $q.reject(new Error(`Wrong provider: ${spfAuth.user.provider}`));
      }

      userDataObj.$value = {
        id: spfAuth.user.uid,
        fullName: name,
        displayName: name,
        email: email,
        gravatar: gravatarBaseUrl + spfCrypto.md5(email),
        createdAt: {'.sv': 'timestamp'}
      };

      return userDataObj.$save().then(function() {
        return userDataObj;
      });
    },

    /**
     * Set the user public id.
     *
     * @param  {object} userSync AngularFire object.
     * @return {Promise<void, Error>}
     */
    publicId: function(userSync) {
      if (!userSync || !userSync.publicId) {
        return $q.reject(new Error('The user has not set a user public id.'));
      }

      var data = {
        [`users/${userSync.$id}/publicId`]: userSync.publicId,
        [`publicIds/${userSync.publicId}`]: userSync.$id,
        [`usedPublicIds/${userSync.publicId}`]: true
      };

      return spfFirebase.patch(['auth'], data).catch(function(err) {
        $log.info(err);
        return $q.reject(new Error('Failed to save public id. It might have already being used by an other user.'));
      });
    },

    /**
     * Test if a public id is available.
     *
     * @param  {string}  publicId id to test
     * @return {Promise<boolean, Error>}
     */
    isPublicIdAvailable: function(publicId) {
      return spfFirebase.loadedObj(['auth/usedPublicIds', publicId]).then(function(publicIdSync) {
        return !publicIdSync.$value;
      });
    }
  };

  return spfAuthData;
}

spfAuthDataFactory.$inject = [
  '$q',
  '$log',
  'spfFirebase',
  'spfAuth',
  'spfCrypto'
];

/**
 * Return the list of schools from Singapore.
 *
 * Load the list as soon as the the service is created. The service will return
 * the same promise over again as a way to cache the result.
 *
 * @param  {function} $q          Angular promise factory service.
 * @param  {object}   spfFirebase singpath-core firebase helpers service.
 * @return {function}
 */
export function spfSchoolsFactory($q, spfFirebase) {
  var promise = spfFirebase.loadedObj(['classMentors/schools']);

  return function spfSchools() {
    return promise;
  };
}

spfSchoolsFactory.$inject = ['$q', 'spfFirebase'];
