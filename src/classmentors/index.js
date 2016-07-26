/* globals document: true */

import angular from 'angular';
import module from 'classmentors/module.js';

import * as services from 'classmentors/services.js';
import * as filters from 'classmentors/filters.js';
import * as directives from 'classmentors/directives.js';

import * as app from 'classmentors/components/classmentors/classmentors.js';
import * as ace from 'classmentors/components/ace/ace.js';
import * as events from 'classmentors/components/events/events.js';
import * as profiles from 'classmentors/components/profiles/profiles.js';
import * as cohorts from 'classmentors/components/cohorts/cohorts.js';
import * as challenges from 'classmentors/components/challenges/challenges.js';
// import * as mcq from 'classmentors/components/challenges/mcq/mcq.js';


module.factory('clmService', services.clmServiceFactory);
module.factory('clmDataStore', services.clmDataStoreFactory);
module.factory('eventService', events.eventServiceFactory);
module.factory('challengeService', challenges.challengeServiceFactory);

module.filter('cmTruncate', filters.cmTruncateFilterFactory);

module.directive('cmContains', directives.cmContainsFactory);

module.component('classmentors', app.component);

module.component('ace', ace.component);
module.constant('aceStatsUrl', ace.ACE_STATS_URL);
module.factory('aceStats', ace.factory);

module.component('cohorts', cohorts.component);
// module.component('challenges'. challenges.component);

module.directive('clmProfile', profiles.clmProfileFactory);
module.directive('clmSpfProfile', profiles.clmSpfProfileFactory);
module.directive('clmServiceUserIdExists', profiles.clmServiceUserIdExistsFactory);

module.directive('clmEventTable', events.clmEventTableFactory);
module.directive('clmEventRankTable', events.clmEventRankTableFactory);
module.directive('clmEventResultsTable', events.clmEventResultsTableFactory);
module.directive('clmPager', events.clmPagerFactory);
module.factory('clmRowPerPage', events.clmRowPerPageFactory);
module.factory('clmPagerOption', events.clmPagerOptionFactory);

//added new survey factory for tryout purpose
module.factory('clmSurvey',events.clmSurveyTaskFactory);
/**
 * Label route paths.
 *
 * Required for singpath-core/services/routes.js and its "urlFor" service and
 * filter.
 *
 * Should be used to configure $routeProvider.
 *
 */
module.constant('routes', {
  home: '/profile/',
  aceOfCoders: '/ace-of-coders',
  events: '/events',
  newEvent: '/new-event',
  oneEvent: '/events/:eventId',
  editEvent: '/events/:eventId/edit',
  editEventTask: '/events/:eventId/task/:taskId',
  addEventTask: '/events/:eventId/new-task',
  profile: '/profile/:publicId',
  editProfile: '/profile/',
  setProfileCodeCombatId: '/profile/codeCombat',
  cohorts: '/cohorts',
  viewMcq: '/challenges/mcq',
  viewSurvey: '/challenges/survey'
});

module.config([
  '$routeProvider',
  'routes',
  function($routeProvider, routes) {
    $routeProvider
      .when(routes.aceOfCoders, {
        template: '<ace stats="$resolve.stats"></ace>',
        resolve: {
          stats: ace.getStats
        }
      })
      .when(routes.cohorts, {
        template: '<cohorts></cohorts>'
      })
      .otherwise(routes.home);
  }
]);

// TODO: convert those view controller/template to component and move them above
module.config(events.configRoute);
module.config(profiles.configRoute);
module.config(challenges.configRoute);

export {module};

/**
 * Bootstrap classmentors Angular app and overwrite default settings.
 *
 * @param {{firebaseId: string, singpathUrl: string, backendUrl: string}} options
 */
export function bootstrap(options) {
  const bootstrapModule = angular.module('classmentors.bootstrap', [module.name]);

  options = options || {};

  bootstrapModule.config([
    '$routeProvider',
    'routes',
    'spfFirebaseRefProvider',
    function($routeProvider, routes, spfFirebaseRefProvider) {
      $routeProvider.otherwise({
        redirectTo: routes.home
      });

      if (!options.firebaseId) {
        return;
      }

      spfFirebaseRefProvider.setBaseUrl(`https://${options.firebaseId}.firebaseio.com/`);
    }
  ]);

  bootstrapModule.run([
    '$window',
    'clmServicesUrl',
    function($window, clmServicesUrl) {
      if (options.singpathURL) {
        clmServicesUrl.singPath = options.singpathURL.replace(/\/$/, '');
      }

      if (options.backendURL) {
        clmServicesUrl.backend = options.backendURL.replace(/\/$/, '');
      }
    }
  ]);

  angular.element(document).ready(function() {
    angular.bootstrap(document, [bootstrapModule.name], {strictDi: true});
  });
}
