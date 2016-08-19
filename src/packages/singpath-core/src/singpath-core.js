import angular from 'angular';
import 'firebase';
import 'angularfire';
import 'angular-loading-bar';
import 'angular-animate';
import 'angular-messages';
import 'angular-route';
import 'angular-material';

export const spfShared = angular.module('spf.shared', [
  'angular-loading-bar',
  'firebase',
  'ngAnimate',
  'ngMessages',
  'ngRoute',
  'ngMaterial'
]);

// components and their helpers
import spfEditorDirectiveFactory from 'singpath-core/components/ace/ace.js';
import spfAlertFactory from 'singpath-core/components/alert/alert.js';
import {
  SpfSharedMaterialNavBarCtrl,
  spfNavBarServiceFactory,
  initNavBar
} from 'singpath-core/components/navbar/navbar.js';
import {spfSignFormDirectiveFactory, spfUniqPublicIdFactory} from 'singpath-core/components/sign/sign.js';

// filters
import {spfEmptyFilterFactory, spfLengthFilterFactory, spfToArrayFilterFactory} from './filters.js';

// services
import countries from 'singpath-core/services/countries.js';
import {config as configIcons, run as cacheIcon} from 'singpath-core/services/icons/icons.js';
import * as crypto from 'singpath-core/services/crypto.js';
import * as routeServices from 'singpath-core/services/routes.js';
import {spfAuthFactory, spfAuthDataFactory, spfSchoolsFactory} from 'singpath-core/services/datastore.js';
import {spfFirebaseFactory, SpfFirebaseRefProvider} from 'singpath-core/services/firebase.js';

//
// Register directives, services and filters.
//
spfShared.config(configIcons);
spfShared.constant('routes', routeServices.defaults);
spfShared.constant('SPF_COUNTRIES', countries);
spfShared.constant('spfCryptoHashKeySize', crypto.keySize);
spfShared.constant('spfCryptoIteration', crypto.iterations);
spfShared.constant('spfCryptoSaltSize', crypto.saltSize);
spfShared.controller('SpfSharedMaterialNavBarCtrl', SpfSharedMaterialNavBarCtrl);
spfShared.directive('spfEditor', spfEditorDirectiveFactory);
spfShared.directive('spfSignForm', spfSignFormDirectiveFactory);
spfShared.directive('spfUniqPublicId', spfUniqPublicIdFactory);
spfShared.factory('spfAlert', spfAlertFactory);
spfShared.factory('spfAuth', spfAuthFactory);
spfShared.factory('spfAuthData', spfAuthDataFactory);
spfShared.factory('spfFirebase', spfFirebaseFactory);
spfShared.factory('spfNavBarService', spfNavBarServiceFactory);
spfShared.factory('spfSchools', spfSchoolsFactory);
spfShared.factory('urlFor', routeServices.urlForFactory);
spfShared.filter('spfEmpty', spfEmptyFilterFactory);
spfShared.filter('spfLength', spfLengthFilterFactory);
spfShared.filter('spfToArray', spfToArrayFilterFactory);
spfShared.filter('urlFor', routeServices.urlForFilterFactory);
spfShared.provider('spfFirebaseRef', SpfFirebaseRefProvider);
spfShared.run(cacheIcon);
spfShared.run(initNavBar);
spfShared.service('spfCrypto', crypto.Service);

//
// Configure cfpLoadingBar options.
//
spfShared.config([
  'cfpLoadingBarProvider',
  function(cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeSpinner = false;
  }
]);

//
// Configure
//
spfShared.config([
  '$mdThemingProvider',
  function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
      .primaryPalette('brown')
      .accentPalette('amber')
      .warnPalette('deep-orange');
  }
]);

//
// Listen for routing error to alert the user of the error and
// redirect to the default route if not is selected.
//
// No route will be selected if the user reload the page in an invalid state
// for her/his last route. It that case the app should redirect the user
// to the home route.
//
spfShared.run([
  '$rootScope',
  '$location',
  'routes',
  'spfAlert',
  function($rootScope, $location, routes, spfAlert) {
    $rootScope.$on('$routeChangeError', function(e, failedRoute, currentRoute, err) {
      spfAlert.error(err.message || err.toString());

      if (!currentRoute) {
        $location.path(routes.home);
      }
    });
  }
]);

import './shared.css!';

export {spfShared as module};
