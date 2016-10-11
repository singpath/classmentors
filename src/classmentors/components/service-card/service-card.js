import formTemplate from './service-card-form.html!text';
import template from './service-card.html!text';

const noop = () => undefined;

/**
 * Controller for "clm-service-card" component.
 *
 * Expect "publicId" and "serviceId" bindings;
 */
export class ServiceCardCtrl {

  /**
   * clm-service-card controller constructor
   *
   * @param {$compile.directive.Attributes} $attrs Controllers normalized DOM element attributes .
   * @param {jqLite}   $document       JqLite wrapper for the window document.
   * @param {function} $firebaseObject AngularFire sync. object factory
   * @param {function} $interpolate    Angular template compiler.
   * @param {object}   $log            Angular logging service.
   * @param {object}   $mdDialog       Angular Material dialog service.
   * @param {function} $q              Angular promise service.
   * @param {function} $timeout        Angular timeout service.
   * @param {object}   clmServices     List 3rd party services.
   * @param {object}   spfAlert        singpath-core alert service.
   * @param {object}   spfCurrentUser  currentUser data.
   */
  constructor(
    $attrs, $document, $firebaseObject, $interpolate, $log, $mdDialog, $q, $timeout,
    clmServices, spfAlert, spfCurrentUser, clmRefreshTimout
  ) {

    /**
     * singpath-core alert service.
     * @type {object}
     * @private
     */
    this.$alert = spfAlert;

    /**
     * Angular Material dialog service.
     * @type {object}
     * @private
     */
    this.$dialog = $mdDialog;

    /**
     * jqLite reference to the `document`.
     * @type {array}
     * @private
     */
    this.$document = $document;

    /**
     * AngularFire synchronized object service.
     * @type {function(ref: firebase.database.Reference)}
     * @private
     */
    this.$firebaseObject = $firebaseObject;

    /**
     * Angular logger service.
     * @type {object}
     * @private
     */
    this.$log = $log;

    /**
     * Angular promise service.
     * @type {function}
     * @private
     */
    this.$q = $q;

    /**
     * List of 3rd party service manager.
     * @type {Map<string,Service>}
     * @private
     */
    this.$services = clmServices;

    /**
     * Angular timeout service.
     * @type {function}
     */
    this.$timeout = $timeout;

    /**
     * Current user service
     * @type {{publicId: string, $watch: function(handler: function): function(): void}}
     */
    this.currentUser = spfCurrentUser;

    /**
     * The ctrl will stop watching for user changes when this function is called.
     *
     * Should be called when the component is destroyed.
     *
     * @type {function}
     * @private
     */
    this.$unwatchUser = this.currentUser.$watch(() => this.watchData());

    /**
     * Third party service "service" - used to interact with the user data for
     * that service.
     *
     * @type {?{
     *         dataRef: function(publicId: string): firebase.database.Reference,
     *         requestUpdate: function(publicId: string): Promise<void, Error>,
     *         saveDetails: function(publicId: string, data: {id: string, name: string}): Promise<void, Error>
     *       }}
     */
    this.service = undefined;

    /**
     * The user service data.
     *
     * @type {?{
     *         lastUpdate: number,
     *         lastUpdateRequest: number,
     *         details: {id: string, name: string, registeredBefore: string},
     *         totalAchievements: number
     *       }}
     */
    this.data = undefined;

    /**
     * The ctrl will stop watching for data when this function is called.
     *
     * Should be called on a publicId or serviceId changes
     * @type {function}
     * @private
     */
    this.$unwatchData = noop;

    /**
     * URL to the user profile for that service
     * @type {?string}
     */
    this.profileUrl = undefined;

    /**
     * Build a profile url using the user service details.
     *
     * We retrieve the URL template from the component "profile-template" html
     * attribute before Angular interpolate it. We need to interpolate it
     * ourself and provide the user service details.
     *
     * @type {function(scope: object): string}
     */
    this.$profileUrlTemplate = $interpolate($attrs.profileTemplate, false, undefined, true);

    // flags

    /**
     * Should set true while the controller is loading resources.
     * @type {Boolean}
     */
    this.loading = false;

    /**
     * Should set the true if the profile owner is the current user.
     *
     * @todo should admin or premium users be allowed to edit
     * @type {Boolean}
     */
    this.canEdit = false;

    /**
     * Should be set to true during a pending refresh request.
     * @type {Boolean}
     */
    this.updating = false;

    /**
     * Should be set false while the last refresh request is too recent.
     * @type {Boolean}
     */
    this.canRefresh = false;

    /**
     * Timer for the resfresh button
     * @type {?Promise<void,Error>}
     */
    this.$disableRefresh = undefined;

    /**
     * Timer delay
     * @type {number}
     */
    this.$timoutDelay = clmRefreshTimout;

  }

  /* Angular Controller hooks */
  /* see https://docs.angularjs.org/api/ng/service/$compile#life-cycle-hooks */

  /**
   * Called by angular when component bindings changes.
   *
   * Should reset flags, `service` and `data` related properties.
   *
   * @param {object} changes list of changes.
   */
  $onChanges(changes) {
    if (changes.publicId || changes.serviceId) {
      this.watchData();
    }

    if (changes.disableRefresh) {
      this.setCanRefresh();
    }
  }

  /**
   * Called when the componet is getting removed from the DOM.
   *
   * Should stop watching for current user or profile user service data changes,
   * and release the data synchronized object.
   */
  $onDestroy() {
    this.$unwatchData();
    this.$unwatchUser();

    if (this.data && this.data.$destroy) {
      this.data.$destroy();
    }

    if (this.$disableRefresh) {
      this.$timeout.cancel(this.$disableRefresh);
      this.$disableRefresh = undefined;
    }
  }

  /* private methodes */

  /**
   * Create the service profile synchronized object and listen for changes.
   *
   * Changes should update flag properties.
   *
   * @private
   */
  watchData() {
    this.service = this.$services[this.serviceId];
    this.loading = true;
    this.updating = false;
    this.profileUrl = undefined;

    this.canEdit = Boolean(
      this.currentUser.publicId
      && (this.publicId === this.currentUser.publicId)
    );

    this.$unwatchData();
    if (this.data && this.data.$destroy) {
      this.data.$destroy();
    }

    const ref = this.service.dataRef(this.publicId);

    this.data = this.$firebaseObject(ref);
    this.$unwatchData = this.data.$watch(() => this.onDataChanged());
  }

  /**
   * Service data change (details, lastUpdate or lastUpdateRequest) handler.
   *
   * @private
   */
  onDataChanged() {
    this.loading = false;

    if (!this.data || this.data.$value === null || !this.data.details) {
      this.updating = false;
      this.profileUrl = undefined;

      return;
    }

    this.setProfileUrl();
    this.setUpdating();
  }

  /**
   * Update `canRefresh` propety.
   *
   * @private
   * @return {Promise<void>}
   */
  setCanRefresh() {
    const timers = [this.disableRefresh, this.$disableRefresh].filter(
      t => t && t.then !== undefined
    );

    this.canRefresh = false;

    return this.$q.all(timers).then(() => {
      this.canRefresh = true;
      this.$disableRefresh = undefined;
    });
  }

  /**
   * Update 'updating' property.
   *
   * Service data are updating they have no lastUpdate property of it's lower
   * than the lastUpdateRequest.
   *
   * @private
   */
  setUpdating() {
    const lastUpdateRequest = this.data.lastUpdateRequest || 0;
    const lastUpdate = this.data.lastUpdate || 0;

    this.updating = (lastUpdate < lastUpdateRequest);
  }

  /**
   * Update profileUrl property.
   *
   * @private
   */
  setProfileUrl() {
    this.profileUrl = this.$profileUrlTemplate(this.data && this.data.details);
  }

  /* public methodes */

  /**
   * Show the form to add a user's service user name.
   *
   * @param  {Object} $event   Click event.
   * @param  {string} selector Selector to find the the dialog form.
   * @return {Promise<void, any>}
   */
  showAddDialog($event, selector) {
    return this.$dialog.show({
      targetEvent: $event,
      contentElement: selector,
      parent: this.$document.find('body'),
      clickOutsideToClose: true
    });
  }

  /**
   * Request a service profile update.
   *
   * @return {Promise<void>}
   */
  refresh() {
    if (!this.canRefresh) {
      return Promise.reject(new Error('Refresh is currently disable.'));
    }

    this.canRefresh = false;

    return this.service.requestUpdate(this.publicId).then(() => {
      this.$disableRefresh = this.$timeout(this.$timoutDelay);
      this.setCanRefresh();
    }).catch(err => {
      this.canRefresh = true;
      this.$log.error(err);
      this.$alert.error(`Failed to request a ${this.service.name} profile update.`);
    });
  }

  /**
   * Removed the user service profile.
   *
   * @return {Promise<void>}
   */
  remove() {
    return this.service.removeDetails(this.publicId).then(
      () => this.$alert.success(`Unliked ${this.service.name} profile.`)
    ).catch(err => {
      this.$log.error(err);
      this.$alert.error(`Failed to unlink your ${this.service.name} profile.`);
    });
  }

}

ServiceCardCtrl.$inject = [
  '$attrs',
  '$document',
  '$firebaseObject',
  '$interpolate',
  '$log',
  '$mdDialog',
  '$q',
  '$timeout',
  'clmServices',
  'spfAlert',
  'spfCurrentUser',
  'clmRefreshTimout'
];

/**
 * "clm-service-card" component settings.
 *
 * @example
 * <!-- using default form -->
 * <clm-service-card public-id="$ctrl.publicId" service-id="myService" disable-refresh="$ctrl.refreshTimeout">
 *   <clm-description>myService let you gain achievements...</clm-description>
 * </clm-service-card>
 *
 * @example
 *  <!-- using custom dialog form -->
 *  <clm-service-card public-id="$ctrl.publicId" service-id="myService" disable-refresh="$ctrl.refreshTimeout">
 *    <clm-description>myService let you gain achievements...</clm-description>
 *    <clm-service-form>
 *      <md-dialog aria-label="Link service profile" layout-padding style="min-width: 50%">
 *        <md-dialog-content>
 *          <form name="service-dialog-form" ng-submit="$ctrl.save($ctrl.newName)">
 *            <md-input-container flex>
 *              <label>
 *                Your username
 *              </label>
 *              <input name="userName" ng-model="$ctrl.newName" required">
 *            </md-input-container>
 *          </form>
 *        </md-dialog-content>
 *        <md-dialog-actions>
 *          <md-button ng-click="$ctrl.createService($ctrl.newName)" class="md-primary">Save</md-button>
 *          <md-button ng-click="$ctrl.closeDialog()">Close</md-button>
 *        </md-dialog-actions>
 *      </md-dialog>
 *    </clm-service-form>
 *  </clm-service-card>
 *
 * @type {Object}
 */
export const component = {
  template,

  // `transclude` allows to pass some HTML content which the component can
  // include in its internal DOM. Note that the  HTML content will be
  // interpolated using the outer scope, not the component scope.
  transclude: {

    // angular will clone the child "clm-description" element to insert
    // it inside the component (using
    // `<div ng-transclude-slot="description"></div>` in the service-card
    // template).
    description: 'clmDescription',

    // angular will clone the child "clm-service-form" element to insert
    // it inside the component (using
    // `<div ng-transclude-slot="serviceForm"></div>` in the service-card
    // template).
    serviceForm: '?clmServiceForm'
  },

  // component attributes (`public-id` and `service-id`) bound and synchronized
  // to the component controller instance as (`publicId` and `serviceId`
  // properties).
  bindings: {
    publicId: '<',
    serviceId: '@',
    disableRefresh: '<'
  },

  // controller which an instance will accessible as `$ctrl` in the component
  // template.
  controller: ServiceCardCtrl
};

/**
 * clm-service-form controller.
 */
export class GenericServiceFormCtrl {

  /**
   * clm-service-form controller contructor.
   *
   * Expect a $card property referencing the parent "clm-service-card"
   * controller instance.
   *
   * @param  {object} $log       Angular logging service.
   * @param  {object} $mdDialog  Angular Material dialog service.
   * @param  {object} spfAlert   singpath-core alert service.
   */
  constructor($log, $mdDialog, spfAlert) {

    /**
     * Angular logging service.
     * @type {{error: function(msg: string): void}}
     * @private
     */
    this.$log = $log;

    /**
     * Angular Material dialog service.
     * @type {{hide: function(result: any): Promise}, cancel: function(result: any): Promise}}
     * @private
     */
    this.$dialog = $mdDialog;

    /**
     * Singpath Core alert service
     * @type {{sucess: function(msg: string): void, error: function(msg: string): void}}
     * @private
     */
    this.$alert = spfAlert;

    /**
     * The user name for that service
     * @type {?string}
     */
    this.name = undefined;

    /**
     * The URL to that profile
     * @type {string}
     */
    this.profileUrl = undefined;
  }

  /* Angular Controller hook(s) */
  /* see https://docs.angularjs.org/api/ng/service/$compile#life-cycle-hooks */

  /**
   * Called once bindings are setup.
   *
   * Should set the default profileUrl.
   */
  $onInit() {
    this.setProfileUrl();
  }

  /* private method(s) */

  setProfileUrl() {
    this.profileUrl = this.$card.$profileUrlTemplate({
      id: this.name || '<user-name>',
      name: this.name || '<user-name>'
    });
  }

  /* public methods */

  /**
   * Update the ctrl state after changes to the name property.
   *
   * Should update the default profileUrl.
   */
  onNameChanged() {
    this.setProfileUrl();
  }

  /**
   * Save the user details for that service.
   *
   * @param  {string} name The user name for that service.
   * @return {Promise<void, Error>}
   */
  save(name) {
    return this.$card.service.saveDetails(this.$card.publicId, {id: name, name: name}).then(
      () => {
        this.$alert.success(`${this.$card.service.name} profile linked.`);

        return this.$dialog.hide();
      },
      err => {
        this.$alert.error(`Failed to link your ${this.$card.service.name} profile.`);

        return Promise.reject(err);
      }
    ).catch(err => {
      this.$log.error(err);

      return Promise.reject(err);
    });
  }

  /**
   * Close the dialog without saving the details.
   *
   * @return {Promise<void>}
   */
  close() {
    return this.$dialog.cancel();
  }

}

GenericServiceFormCtrl.$inject = ['$log', '$mdDialog', 'spfAlert'];

/**
 * "clm-service-form" component definition.
 *
 * Used for the default service name form dialog. Can be used as an example
 * or a base for more advance linking process.
 *
 * @type {Object}
 */
export const serviceForm = {
  template: formTemplate,

  // The parent clm-service-card controller will be added as a "$card" property
  // to this component controller.
  require: {$card: '^^clmServiceCard'},

  controller: GenericServiceFormCtrl
};

/**
 * "clm-service-card" component and related directive, service and filters.
 *
 * @type {{component: object, serviceForm: {component: object}}}
 */
const serviceCard = {
  component,
  serviceForm: {component: serviceForm}
};

export default serviceCard;
