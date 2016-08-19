/**
 * Defines the main shared services, directive and filters
 *
 */

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


//
// Configure cfpLoadingBar options.
//
spfShared.config([
  'cfpLoadingBarProvider',
  function(cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeSpinner = false;
  }
]);

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
