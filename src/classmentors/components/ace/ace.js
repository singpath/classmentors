/**
 * classmentors/components/ace/ace.js - Define the ace component.
 */
import template from './ace-view.html!text';


/**
 * ace component.
 *
 * @type {Object}
 */
export const component = {
  template,
  bindings: {

    // binds $ctrl.stats to the value of the stats attribute.
    stats: '<'
  }
};

export const ACE_STATS_URL = 'https://singpath.firebaseio.com/classMentors/userProfiles/cboesch/user/displayName.json';//https://dl.dropboxusercontent.com/u/4972572/ace_of_coders_2016_stats.json';

/**
 * Route resolver helper.
 *
 * This is not a service; this is not generating a singleton. If used in a route
 * configuration "resolve" map, the function will be run on each resolution of
 * that route.
 *
 * @param  {Object}  $http       $http service.
 * @param  {string}  aceStatsUrl URL to fetch stats from
 * @return {Promise}
 */
export function getStats($http, aceStatsUrl) {
  return $http.get(aceStatsUrl).then(
    response => response.data
  );
}
getStats.$inject = ['$http', 'aceStatsUrl'];

/**
 * Config route for ace of coders views.
 *
 * @param  {object} $routeProvider ngRoute $route service provider.
 * @param  {object} routes         classmentors route map.
 */
export function configRoute($routeProvider, routes) {
  $routeProvider
    .when(routes.aceOfCoders, {
      template: '<ace stats="$resolve.stats"></ace>',
      resolve: {
        stats: getStats,
        //navBar: () => ({title: 'Ace of Coders'})
        navBar: () => ({title: '2017 National Coding Championships'})
      }
    })
    .otherwise(routes.home);
}

configRoute.$inject = ['$routeProvider', 'routes'];
