import tmpl from './navbar-view.html!text';
import './navbar.css!';

const noop = () => undefined;

/**
 * Fill the template cache to the navbar template and listen for route change
 * events to reset the navbar.
 *
 * @param  {object} $templateCache   Angular template cache service.
 * @param  {object} $rootScope       Angular rootScope service.
 * @param  {object} spfNavBarService Singpath-core navbar service.
 */
export function initNavBar($templateCache, $rootScope, spfNavBarService) {
  $templateCache.put('shared/navbar-view.html', tmpl);

  $rootScope.$on('$routeChangeSuccess', (e, currentRoute) => {
    const navBar = Object.assign({title: ''}, (
      currentRoute &&
      currentRoute.locals &&
      currentRoute.locals.navBar ||
      currentRoute.locals.navbar

    ));

    spfNavBarService.update(navBar.title, navBar.parent, navBar.section);
  });
}
initNavBar.$inject = ['$templateCache', '$rootScope', 'spfNavBarService'];

/**
 * NavBarService factory.
 *
 * Registery to set title name and menu items
 *
 * @return {function}
 */
export function spfNavBarServiceFactory() {
  return {
    title: undefined,
    parent: [],
    menuItems: [],

    update: function(title, parents, menuItems) {
      this.title = title;
      if (parents) {
        this.parents = Array.isArray(parents) ? parents : [parents];
      } else {
        this.parents = [];
      }
      this.menuItems = (menuItems || []).map(function(item) {
        item.onClick = item.onClick || noop;
        return item;
      });
    }
  };
}
spfNavBarServiceFactory.$inject = [];

/**
 * Controler for the header novigation bar.
 *
 * Set an auth property bound to spfAuth. Its user property can used
 * to display the state of the authentication and the user display name
 * when the user is logged in.
 *
 * The ctrl set a login and logout property to autenticate/unauthenticate
 * the current user.
 *
 * @param {function} $q               Angular promise factory service.
 * @param {function} $mdSidenav       ngMaterial side nav service.
 * @param {object}   spfAlert         singpath-core alert service.
 * @param {object}   spfAuth          singpath-core authentication service.
 * @param {object}   spfNavBarService singpath-core nav bar service.
 */
export function SpfSharedNavBarCtrl($q, $mdSidenav, spfAlert, spfAuth, spfNavBarService) {
  this.auth = spfAuth;
  this.currentPage = spfNavBarService;

  this.login = function() {
    return spfAuth.login().catch(function(e) {
      spfAlert.warning('You failed to authenticate with Google');
      return $q.reject(e);
    });
  };

  this.logout = function() {
    return spfAuth.logout();
  };

  this.openSideMenu = function(name) {
    $mdSidenav(name).toggle();
  };
}
SpfSharedNavBarCtrl.$inject = [
  '$q',
  '$mdSidenav',
  'spfAlert',
  'spfAuth',
  'spfNavBarService'
];
