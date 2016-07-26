/**
 * classmentors/components/cohorts/cohorts.js- define cohort component.
 */

import cohortTmpl from './cohorts-view.html!text';
// import './cohorts.css!';

const noop = () => undefined;

export function configRoute($routeProvider, routes) {
    $routeProvider
        .when(routes.cohorts, {
            template: cohortTmpl,
            controller: ClmListCohorts,
            controllerAs: 'ctrl',
            resolve: {
                initialData: classMentorsEventResolver
            }
        });
    console.log("configRoute Executed");
}
configRoute.$inject = ['$routeProvider', 'routes'];

function ClmListCohorts (initialData, spfNavBarService, urlFor) {

    const title = 'Cohorts';
    const parentPages = [];
    const menuItems = [];

    this.currentUser = initialData.currentUser;
    this.profile = initialData.profile;
    this.events = initialData.events;
    this.createdEvents = initialData.createdEvents;
    this.joinedEvents = initialData.joinedEvents;
    this.auth = initialData.auth;

    console.log("Controller executed");

    if (
        this.profile &&
        this.profile.user &&
        this.profile.user.isPremium
    ) {
        menuItems.push({
            title: 'New event',
            url: `#${urlFor('newEvent')}`,
            icon: 'add'
        });
    }

    spfNavBarService.update(title, parentPages, menuItems);
}
ClmListCohorts.$inject = ['initialData', 'spfNavBarService', 'urlFor'];

function classMentorsEventResolver($q, spfAuth, spfAuthData, clmDataStore) {
    return $q.all({
        events: clmDataStore.events.list(),
        auth: spfAuth,
        currentUser: spfAuthData.user().catch(function() {
            return;
        }),
        profile: clmDataStore.currentUserProfile(),
        createdEvents: clmDataStore.events.listCreatedEvents(),
        joinedEvents: clmDataStore.events.listJoinedEvents()
    });
}
classMentorsEventResolver.$inject = ['$q', 'spfAuth', 'spfAuthData', 'clmDataStore'];
