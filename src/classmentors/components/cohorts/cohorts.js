/**
 * classmentors/components/cohorts/cohorts.js- define cohort component.
 */

import cohortTmpl from './cohorts-view.html!text';
import newCohortTmpl from './cohorts-new-cohort.html!text';
import './cohorts.css!';
// import './cohorts.css!';

const noop = () => undefined;

export function configRoute($routeProvider, routes) {
    $routeProvider
        .when(routes.cohorts, {
            template: cohortTmpl,
            controller: ClmListCohorts,
            controllerAs: 'ctrl',
            resolve: {
                initialData: classMentorsCohortResolver
            }
        })
        .when(routes.newCohort, {
            template: newCohortTmpl,
            controller: NewCohortCtrl,
            controllerAs: 'ctrl',
            resolve: {
                initialData: newCohortCtrlInitialData
            }
        });
    console.log("configRoute Executed");
}
configRoute.$inject = ['$routeProvider', 'routes'];

function ClmListCohorts (initialData, spfNavBarService, urlFor, spfFirebase, spfAuthData) {

    const title = 'Cohorts';
    const parentPages = [];
    const menuItems = [];

    this.currentUser = initialData.currentUser;
    this.profile = initialData.profile;
    this.allCohorts = initialData.allCohorts;
    this.featuredCohorts = initialData.featuredCohorts;
    this.createdCohorts = initialData.createdCohorts;
    this.joinedEvents = initialData.joinedEvents;
    this.auth = initialData.auth;

    // *** Populate joined cohorts out-of-DB

    this.joinedCohorts = [];

    for(var i=0; i<this.allCohorts.length; i++) {
        var cohort = this.allCohorts[i];
        var cohortEvents = cohort.events;
        for(var j=0; j<this.joinedEvents.length; j++) {
            var eventId = this.joinedEvents[j].$id;
            if(cohortEvents.indexOf(eventId) > -1) {
                this.joinedCohorts.push(cohort);
                break;
            }
        }
    }

    // ***


    if (
        this.profile &&
        this.profile.user &&
        this.profile.user.isPremium
    ) {
        menuItems.push({
            title: 'New Cohort',
            url: `#${urlFor('newCohort')}`,
            icon: 'add'
        });
    }

    spfNavBarService.update('Cohorts', undefined, menuItems);
}
ClmListCohorts.$inject = ['initialData', 'spfNavBarService', 'urlFor', 'spfFirebase', 'spfAuthData'];

function classMentorsCohortResolver($q, spfAuth, spfAuthData, clmDataStore) {
    return $q.all({
        featuredCohorts: clmDataStore.cohorts.listFeaturedCohorts(),
        auth: spfAuth,
        currentUser: spfAuthData.user().catch(function() {
            return;
        }),
        profile: clmDataStore.currentUserProfile(),
        createdCohorts: clmDataStore.cohorts.listCreatedCohorts(),
        joinedEvents: clmDataStore.events.listJoinedEvents(),
        allCohorts: clmDataStore.cohorts.listAllCohorts()
    });
}
classMentorsCohortResolver.$inject = ['$q', 'spfAuth', 'spfAuthData', 'clmDataStore'];

/**
 * NewCohortCtrl
 *
 */
function NewCohortCtrl(
    $q, $location, initialData, urlFor, spfFirebase, spfAuthData, spfAlert, spfNavBarService, clmDataStore
) {
    var self = this;

    this.auth = initialData.auth;
    this.currentUser = initialData.currentUser;
    this.profile = initialData.profile;
    this.events = initialData.events;
    this.createdEvents = initialData.createdEvents;
    this.joinedEvents = initialData.joinedEvents;
    this.selectedEvents = [];
    this.includeCreated = false;
    this.includeJoined = false;
    this.populatedEvents = this.events;

    this.creatingEvent = false;
    this.profileNeedsUpdate = !this.currentUser.$completed();

    // console.log(this.populatedEvents);

    spfNavBarService.update(
        'New Cohorts',
        {
            title: 'Cohorts',
            url: `#${urlFor('cohorts')}`
        }, []
    );

    this.toggle = function(item, list) {
        var idx = list.indexOf(item);
        if (idx > -1) {
            list.splice(idx, 1);
        }
        else {
            list.push(item);
        }
    };

    this.exists = function(item, list) {
        return list.indexOf(item) > -1;
    };

    function cleanProfile() {
        self.currentUser.country = spfFirebase.cleanObj(self.currentUser.country);
        self.currentUser.school = spfFirebase.cleanObj(self.currentUser.school);
    }

    function updateProfile(profile) {
        spfAlert.success('Profile setup.');
        self.profile = profile;
        self.profileNeedsUpdate = !self.currentUser.$completed();
    }
    this.save = function(currentUser, newCohort, events) {
        var next;

        self.creatingCohort = true;

        if (!self.profile) {
            cleanProfile();
            next = spfAuthData.publicId(currentUser).then(function() {
                spfAlert.success('Public id and display name saved');
                return clmDataStore.initProfile();
            }).then(updateProfile);
        } else if (self.profileNeedsUpdate) {
            cleanProfile();
            next = self.currentUser.$save().then(function() {
                return clmDataStore.currentUserProfile();
            }).then(updateProfile);
        } else {
            next = $q.when();
        }

        next.then(function() {
            var data = Object.assign({
                owner: {
                    publicId: currentUser.publicId,
                    displayName: currentUser.displayName,
                    gravatar: currentUser.gravatar
                },
                createdAt: {
                    '.sv': 'timestamp'
                },
                events: events
            }, newCohort);

            console.log(data);

            return clmDataStore.cohorts.create(data);
        }).then(function() {
            spfAlert.success('New cohort created.');
            $location.path(urlFor('cohorts'));
        }).catch(function(e) {
            spfAlert.error(e.toString());
        }).finally(function() {
            self.creatingCohort = false;
        });
    };

    this.reset = function(cohortForm) {
        this.newCohort = {
            data: {}
        };

        if (cohortForm && cohortForm.$setPristine) {
            cohortForm.$setPristine();
        }
    };

    this.reset();
}
NewCohortCtrl.$inject = [
    '$q',
    '$location',
    'initialData',
    'urlFor',
    'spfFirebase',
    'spfAuthData',
    'spfAlert',
    'spfNavBarService',
    'clmDataStore'
];

/**
 * Used to resolve `initialData` of `NewEventCtrl`.
 *
 */
function newCohortCtrlInitialData($q, spfAuth, spfAuthData, clmDataStore) {
    var profilePromise;
    var errLoggedOff = new Error('The user should be logged in to create an event.');
    var errNotPremium = new Error('Only premium users can create events.');

    if (!spfAuth.user || !spfAuth.user.uid) {
        return $q.reject(errLoggedOff);
    }

    profilePromise = clmDataStore.currentUserProfile().then(function(profile) {
        if (profile && profile.$value === null) {
            return clmDataStore.initProfile();
        }

        return profile;
    }).then(function(profile) {
        if (
            !profile ||
            !profile.user ||
            !profile.user.isPremium
        ) {
            return $q.reject(errNotPremium);
        }

        return profile;
    });

    return $q.all({
        auth: spfAuth,
        currentUser: spfAuthData.user(),
        profile: profilePromise,
        events: clmDataStore.events.list(),
        createdEvents: clmDataStore.events.listCreatedEvents(),
        joinedEvents: clmDataStore.events.listJoinedEvents()
    });
}
newCohortCtrlInitialData.$inject = ['$q', 'spfAuth', 'spfAuthData', 'clmDataStore'];