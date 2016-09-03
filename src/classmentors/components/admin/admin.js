/**
 * classmentors/components/admin/admin.js - define Admin GUI component.
 */

import template from './admin.html!text';

/**
 * AdminCtrl handle the admin view.
 *
 * TODO: It should provide the list of settings and allow to edit them.
 */
class AdminCtrl {

  constructor($q, $log, spfNavBarService, spfCurrentUser, clmDataStore) {
    this.$log = $log;
    this.$clmDataStore = clmDataStore;

    this.$watchers = [];
    this.errors = {};
    this.loading = true;
    this.loaded = false;

    this.currentUser = spfCurrentUser;
    this.settings = this.$clmDataStore.settings.get();
    this.switches = [];
    this.inputs = [];

    spfNavBarService.update('Application Settings');

    $q.all([
      this.settings.$loaded(),
      this.currentUser.$loaded()
    ]).then(
      () => this.ready()
    ).catch(
      err => this.failed(err)
    );
  }

  ready() {
    this.loading = false;
    this.loaded = true;
    this.checkAccess(this.currentUser);
    this.filterSettings();

    this.$watchers.push(
      this.currentUser.$watch(
        () => this.checkAccess(this.currentUser)
      )
    );

    this.$watchers.push(
      this.settings.$watch(() => this.filterSettings())
    );
  }

  failed(err) {
    this.loading = false;
    this.loaded = false;
    this.errors.loading = true;
    this.$log.error(err);
  }

  checkAccess(user) {
    this.errors.register = false;
    this.errors.admin = false;

    this.errors.login = user.uid === null;
    if (!user.uid) {
      return;
    }

    this.errors.register = user.publicId === null;
    if (!user.publicId) {
      return;
    }

    this.errors.admin = !user.isAdmin;
  }

  filterSettings() {
    this.switches = [];
    this.inputs = [];

    this.settings.forEach(setting => {
      if (setting.type === 'boolean') {
        this.switches.push(setting);
      } else {
        this.inputs.push(setting);
      }
    });
  }

  $onDestroy() {
    this.$watchers.forEach(fn => {
      try {
        fn();
      } catch (e) {
        this.$log.error(e);
      }
    });
  }

}

AdminCtrl.$inject = ['$q', '$log', 'spfNavBarService', 'spfCurrentUser', 'clmDataStore'];

const component = {
  template,
  controller: AdminCtrl
};

/**
 * Route admin requests to the admin component.
 *
 * @param  {object} $routeProvider ngRoute $route service provider.
 * @param  {object} routes         Routes map.
 */
function configRoute($routeProvider, routes) {
  $routeProvider.when(routes.admin, {template: '<clm-admin></clm-admin>'});
}
configRoute.$inject = ['$routeProvider', 'routes'];

/**
 * Default export holds object to register with the Angular API.
 *
 * @type {Object}
 */
const admin = {component, configRoute};

export default admin;
