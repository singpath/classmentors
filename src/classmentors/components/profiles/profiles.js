/**
 * classmentors/components/profiles/profiles.js - define "clm-profile" componenent
 * and helpers.
 *
 * Handle a new service:
 *
 * 1. Register a new service in `configServices`:
 *     e.g. `clmServices.register('My New Service');`
 *
 * 2. Edit ./profiles-view-edit.html to show the service card for the new
 *    service; e.g. ad the "clm-service-card" alonside the one:
 *
 *        <clm-service-card service-id="myNewService" public-id="ctrl.profile.$id"
 *          profile-template="https://www.example.com/profiles/{{name}}"
 *        >
 *          <clm-description>
 *            <a href="https://www.example.com" target="_blank">My New Service</a>
 *            is new service.
 *          </clm-description>
 *        </clm-service-card>
 *
 * 3. Edit ./profiles-view-show.html similary.
 *
 * @todo Have only one template.
 *
 */

import {cleanObj} from 'singpath-core/services/firebase.js';

import editTmpl from './profiles-view-edit.html!text';
import showTmpl from './profiles-view-show.html!text';
import './profiles.css!';

const noop = () => undefined;

export function configServices(clmServices) {
  clmServices.register('Code Combat');
  clmServices.register('Free Code Camp');
  clmServices.register('Pivotal Expert');
}

configServices.$inject = ['clmServices'];

export function configRoute($routeProvider, routes) {

  $routeProvider.when(routes.editProfile, {
    template: editTmpl,
    controller: ClmProfileCtrl,
    controllerAs: 'ctrl',
    resolve: {initialData: clmEditProfileInitialDataResolver}
  })

  .when(routes.profile, {
    template: showTmpl,
    controller: ClmProfileCtrl,
    controllerAs: 'ctrl',
    resolve: {initialData: clmShowProfileInitialDataResolver}
  });
}

configRoute.$inject = ['$routeProvider', 'routes'];

/**
 * Used to resolve `initialData` of `ClmProfileCtrl` the logged in user profile.
 *
 */
function clmEditProfileInitialDataResolver($q, spfAuth, spfAuthData, clmDataStore) {
  var profilePromise;
  var loggedIn = spfAuth.requireLoggedIn().catch(function() {
    return $q.reject(new Error('You need to be logged to edit her/his profile.'));
  });

  profilePromise = loggedIn.then(function() {
    return clmDataStore.currentUserProfile();
  }).then(function(profile) {
    if (profile && profile.$value === null) {
      return clmDataStore.initProfile();
    }

    return profile;
  });

  return $q.all({
    auth: spfAuth.$loaded(),
    currentUser: spfAuthData.user(),
    profile: profilePromise,
    currentUserProfile: profilePromise,
    settings: clmDataStore.settings.getObj()
  });
}
clmEditProfileInitialDataResolver.$inject = ['$q', 'spfAuth', 'spfAuthData', 'clmDataStore'];

/**
 * Used to resolve `initialData` of `ClmProfileCtrl` for a public profile.
 *
 */
function clmShowProfileInitialDataResolver($q, $route, spfAuth, spfAuthData, clmDataStore) {
  var publicId = $route.current.params.publicId;
  var profilePromise;
  var errNoPublicId = new Error('Unexpected error: the public id is missing');
  var errNoProfile = new Error(`Could not found the profile for ${publicId}`);

  if (!publicId) {
    return $q.reject(errNoPublicId);
  }

  profilePromise = clmDataStore.profile(publicId).then(function(profile) {
    if (profile.$value === null) {
      return $q.reject(errNoProfile);
    }
    return profile;
  });

  return $q.all({
    auth: spfAuth.$loaded(),
    currentUser: spfAuthData.user().catch(noop),
    currentUserProfile: clmDataStore.currentUserProfile(),
    profile: profilePromise,
    settings: clmDataStore.settings.getObj()
  });
}
clmShowProfileInitialDataResolver.$inject = ['$q', '$route', 'spfAuth', 'spfAuthData', 'clmDataStore'];

/**
 * ClmProfileCtrl
 *
 */
function ClmProfileCtrl(
  $log, $q, $timeout, $route, spfAuthData, spfNavBarService, initialData, clmDataStore, spfAlert
) {
  const refreshLabel = 'Refresh Achievements';
  const waitingLabel = 'Waiting...';
  var self = this;
  var menu = [];
  var refreshButton = {
    title: refreshLabel,
    onClick: () => this.refreshAllService(),
    icon: 'loop',
    disabled: false
  };

  this.auth = initialData.auth;
  this.currentUser = initialData.currentUser;
  this.currentUserProfile = initialData.currentUserProfile;
  this.profile = initialData.profile;
  this.settings = initialData.settings;

  if (
    this.profile &&
    this.profile.$id &&
    this.currentUser &&
    this.currentUser.publicId === this.profile.$id
  ) {
    menu = [refreshButton, {
      title: 'Edit',
      onClick: () => (this.profileNeedsUpdate = true),
      icon: 'create'
    }];
  }

  spfNavBarService.update('Profile', undefined, menu);

  this.settingPublicId = false;

  // this.profileNeedsUpdate = this.currentUser && !this.currentUser.$completed();
  this.profileNeedsUpdate = false;

  function cleanProfile(currentUser) {
    currentUser.country = cleanObj(currentUser.country);
    currentUser.school = cleanObj(currentUser.school);
  }

  this.goBack = function() {
    self.profileNeedsUpdate = false;
  };

  this.setPublicId = function(currentUser) {
    var saved;

    this.settingPublicId = true;
    cleanProfile(currentUser);

    if (!self.profile) {
      saved = spfAuthData.publicId(currentUser).then(function() {
        spfAlert.success('Public id and display name saved');
        return clmDataStore.initProfile();
      });
    } else {
      saved = currentUser.$save().then(function() {
        return clmDataStore.updateProfile(currentUser);
      });
    }

    return saved.then(function() {
      spfAlert.success('Profile setup.');
      return $route.reload();
    }).catch(function(err) {
      spfAlert.error('Failed to ');
      return $q.reject(err);
    }).finally(function() {
      self.settingPublicId = false;
    });
  };

  this.refreshAllService = () => {
    clmDataStore.services.refresh(this.profile).catch(err => {
      $log.error(err);
      spfAlert.error('Failed to refresh achievements.');
    });
  };

  this.disableRefresh = () => {
    refreshButton.title = waitingLabel;
    refreshButton.disabled = true;

    clmDataStore.services.canRefresh(this.profile).catch(
      err => $log.error(err)
    ).then(() => {
      refreshButton.title = refreshLabel;
      refreshButton.disabled = false;
    });
  };

  const servicesRef = clmDataStore.services.ref(this.profile.$id);
  const serviceUpdatehandler = servicesRef.on('value', () => this.disableRefresh());

  this.$onDestroy = () => servicesRef.off('value', serviceUpdatehandler);
}

ClmProfileCtrl.$inject = [
  '$log', '$q', '$timeout', '$route',
  'spfAuthData', 'spfNavBarService',
  'initialData', 'clmDataStore', 'spfAlert'
];
