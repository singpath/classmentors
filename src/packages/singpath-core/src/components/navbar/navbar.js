'use strict';

import angular from 'angular';
import {spfShared} from '../../module.js';
import tmpl from './navbar-view.html!text';
import './navbar.css!';

spfShared.run([
  '$templateCache',
  function($templateCache) {
    $templateCache.put('shared/navbar-view.html', tmpl);
  }
]);

/**
 * NavBarService
 *
 * Registery to set section name and menu items
 */
spfShared.factory('spfNavBarService', [
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
]);

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
 */
spfShared.controller('SpfSharedMaterialNavBarCtrl', [
  '$q',
  '$mdSidenav',
  'spfAlert',
  'spfAuth',
  'spfNavBarService',
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
]);
