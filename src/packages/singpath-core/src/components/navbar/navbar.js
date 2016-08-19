import angular from 'angular';
import {spfShared} from 'singpath-core/module.js';
import tmpl from './navbar-view.html!text';
import './navbar.css!';

spfShared.factory('spfNavBarService', spfNavBarServiceFactory);
spfShared.controller('SpfSharedMaterialNavBarCtrl', SpfSharedMaterialNavBarCtrl);
spfShared.run(fillCache);

/**
 * Fill the template cache to the navbar template.
 *
 * @param  {object} $templateCache Angular template cache service.
 */
function fillCache($templateCache) {
  $templateCache.put('shared/navbar-view.html', tmpl);
}
fillCache.$inject = ['$templateCache'];

/**
 * NavBarService factory.
 *
 * Registery to set section name and menu items
 *
 * @return {function}
 */
function spfNavBarServiceFactory() {
  return {
    title: 'Singpath',
    section: undefined,
    parent: [],
    menuItems: [],

    update: function(section, parents, menuItems) {
      this.section = section;
      if (parents) {
        this.parents = Array.isArray(parents) ? parents : [parents];
      } else {
        this.parents = [];
      }
      this.menuItems = (menuItems || []).map(function(item) {
        item.onClick = item.onClick || angular.noop;
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
function SpfSharedMaterialNavBarCtrl($q, $mdSidenav, spfAlert, spfAuth, spfNavBarService) {
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
SpfSharedMaterialNavBarCtrl.$inject = [
  '$q',
  '$mdSidenav',
  'spfAlert',
  'spfAuth',
  'spfNavBarService'
];
