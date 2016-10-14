/**
 * Created by limshiquan on 13/10/16.
 */
import qqHome from './question-queue.html!text';
import eventQ from './event-queue.html!text';

/**
 * Update navBar with a title and no action.
 * @param {spfNavBarService} spfNavBarService
 * Load data required for executing controller functions
 * @param {initialData} initialData
 * Route routing directive
 * @param {urlFor} urlFor
 * Database reference
 * @param {firebaseApp} firebaseApp
 * Alert for success and errors
 * @param {spfAlert} spfAlert
 * Firebase reference for objects. Returns promises
 * @param {$firebaseObject} $firebaseObject
 */
function qqController(initialData, spfNavBarService, urlFor, firebaseApp, spfAlert, $firebaseObject) {
    var self = this;
    var db = firebaseApp.database();

    this.currentUser = initialData.currentUser;
    this.profile = initialData.profile;
    this.createdEvents = initialData.createdEvents;
    this.joinedEvents = initialData.joinedEvents;

    spfNavBarService.update('Question Queues', getOptions());

    function getOptions() {
        var options = [];

        // options.push({
        //     title: 'Add New Challenge',
        //     url: `#${urlFor('events')}`,
        //     icon: 'add-circle-outline'
        // });

        return options;
    }

}

qqController.$inject = ['initialData', 'spfNavBarService', 'urlFor', 'firebaseApp', 'spfAlert', '$firebaseObject'];

function eventQController(initialData, spfNavBarService, urlFor, firebaseApp, spfAlert, $firebaseObject) {
    var self = this;
    var db = firebaseApp.database();

    this.currentUser = initialData.currentUser;
    this.profile = initialData.profile;
    this.createdEvents = initialData.createdEvents;
    this.joinedEvents = initialData.joinedEvents;

    spfNavBarService.update('Question Queues', getOptions());

    function getOptions() {
        var options = [];

        // options.push({
        //     title: 'Add New Challenge',
        //     url: `#${urlFor('events')}`,
        //     icon: 'add-circle-outline'
        // });

        return options;
    }

}

eventQController.$inject = ['initialData', 'spfNavBarService', 'urlFor', 'firebaseApp', 'spfAlert', '$firebaseObject'];

// export const component = {
//     qqHome,
//     // controller: qqController,
//     eventQ
// };

/**
 * Config route for ace of coders views.
 *
 * @param  {object} $routeProvider ngRoute $route service provider.
 * @param  {object} routes         classmentors route map.
 */
export function configRoute($routeProvider, routes) {
    $routeProvider
        .when(routes.questionQueue, {
            template: qqHome,
            controller: qqController,
            controllerAs: 'ctrl',
            resolve: {initialData: clmQQResolver}
        })
        .when(routes.eventQueue, {
            template: eventQ,
            controller: eventQController,
            controllerAs: 'ctrl',
            resolve: {initialData: eventQResolver}
        })
        .otherwise(routes.home);
}

configRoute.$inject = ['$routeProvider', 'routes'];

function clmQQResolver($q, spfAuth, spfAuthData, clmDataStore) {
    return $q.all({
        auth: spfAuth.$loaded(),
        currentUser: spfAuthData.user().catch(function(error) {
            return error;
        }),
        profile: clmDataStore.currentUserProfile(),
        joinedEvents: clmDataStore.events.listJoinedEvents(),
        createdEvents: clmDataStore.events.listCreatedEvents()
    });
}
clmQQResolver.$inject = ['$q', 'spfAuth', 'spfAuthData', 'clmDataStore'];

function eventQResolver($q, spfAuth, spfAuthData, clmDataStore, $route) {
    var eventId = $route.current.params.eventId;
    return $q.all({
        auth: spfAuth.$loaded(),
        currentUser: spfAuthData.user().catch(function(error) {
            return error;
        }),
        profile: clmDataStore.currentUserProfile(),
        joinedEvents: clmDataStore.events.listJoinedEvents(),
        createdEvents: clmDataStore.events.listCreatedEvents()
    });
}
eventQResolver.$inject = ['$q', 'spfAuth', 'spfAuthData', 'clmDataStore', '$route'];
