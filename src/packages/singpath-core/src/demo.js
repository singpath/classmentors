/* global document */

import angular from 'angular';
import {module as spfShared} from 'singpath-core';

import * as demoApp from 'singpath-core/components/demo/demo.js';
import * as iconsDemo from 'singpath-core/services/icons/demo.js';

export const module = angular.module('singpath-core.demo', [spfShared.name]);

module.component('demo', demoApp.component);
module.component('iconsDemo', iconsDemo.component);
module.config(iconsDemo.config);
module.constant('spfProfilesPath', 'classMentors/userProfiles');

module.constant('routes', {
  home: '/icons',
  icons: '/icons'
});

/**
 * Bootstrap demo overwrite default settings.
 *
 * @param {{firebaseId: string}} options demo options
 */
export function bootstrap(options) {
  const bootstrapModule = angular.module('singpath-core.demo.bootstrap', [module.name]);

  options = options || {};

  bootstrapModule.config([
    '$routeProvider',
    'routes',
    'spfFirebaseRefProvider',
    function($routeProvider, routes, spfFirebaseRefProvider) {
      $routeProvider.otherwise({redirectTo: routes.home});

      if (!options.firebaseId) {
        return;
      }

      spfFirebaseRefProvider.setBaseUrl(`https://${options.firebaseId}.firebaseio.com/`);
    }
  ]);

  angular.element(document).ready(function() {
    angular.bootstrap(document, [bootstrapModule.name], {strictDi: true});
  });
}
