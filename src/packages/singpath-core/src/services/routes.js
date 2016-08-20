export const defaults = {home: '/'};

export function urlForFactory(routes) {
  var routeFns = Object.keys(routes).reduce(function(fns, name) {
    var parts = routes[name].split('/');

    fns[name] = function(keys) {
      keys = keys || {};
      return parts.map(function(part) {
        return part[0] === ':' ? keys[part.slice(1)] : part;
      }).join('/');
    };

    return fns;
  }, {});

  return function(name, params) {
    var fn = routeFns[name] || routeFns.home;

    return fn(params);
  };
}

urlForFactory.$inject = ['routes'];

export function urlForFilterFactory(urlFor) {
  return function urlForFilter(name, params) {
    var url = urlFor(name, params);

    return url;
  };
}

urlForFilterFactory.$inject = ['urlFor'];

/**
 * Listen for routing error to alert the user of the error and
 * redirect to the default route if not is selected.
 *
 * No route will be selected if the user reload the page in an invalid state
 * for her/his last route. It that case the app should redirect the user
 * to the home route.
 *
 * @param  {object} $rootScope Angular root scope service.
 * @param  {object} $location  Angular location service.
 * @param  {object} routes     Route dictionary.
 * @param  {object} spfAlert   singpath-core alert service
 */
export function run($rootScope, $location, routes, spfAlert) {
  $rootScope.$on('$routeChangeError', function(e, failedRoute, currentRoute, err) {
    spfAlert.error(err.message || err.toString());

    if (!currentRoute) {
      $location.path(routes.home);
    }
  });
}

run.$inject = [
  '$rootScope',
  '$location',
  'routes',
  'spfAlert'
];
