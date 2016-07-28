/**
 * classmentors/components/cohorts/cohorts.js- define cohort component.
 */

import cohortTmpl from './cohorts-view.html!text';
import newCohortTmpl from './cohorts-new-cohort.html!text';
import cohortViewTmpl from './cohorts-view-cohort.html!text';
import cohortEditTmpl from './cohorts-edit-cohort.html!text';
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
        })
        .when(routes.viewCohort, {
            template: cohortViewTmpl,
            controller: ViewCohortCtrl,
            controllerAs: 'ctrl',
            resolve: {
                initialData: viewCohortCtrlInitialData
            }
        })
        .when(routes.editCohort, {
            template: cohortEditTmpl,
            controller: EditCohortCtrl,
            controllerAs: 'ctrl',
            resolve: {
                initialData: editCohortCtrlInitialData
            }
        });
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

/**
 * Used to resolve `initialData` of `ViewEventCtrl`.
 *
 */
function viewCohortCtrlInitialData($q, $route, spfAuth, spfAuthData, clmDataStore) {
    var errNoCohort = new Error('Cohort not found');
    var cohortId = $route.current.params.cohortId;

    var profilePromise = clmDataStore.currentUserProfile().catch(noop);

    var cohortPromise = clmDataStore.cohorts.get(cohortId).then(function(cohort) {
        if (cohort.$value === null) {
            return $q.reject(errNoCohort);
        }
        return cohort;
    });

    var canviewPromise = $q.all({
        cohort: cohortPromise,
        profile: profilePromise
    }).then(function(data) {
        return $q.when(data.profile && data.profile.canView(data.cohort));
    });

    return $q.all({
        currentUser: spfAuthData.user().catch(noop),
        profile: profilePromise,
        cohort: cohortPromise,
        canView: canviewPromise,
        announcements: canviewPromise.then(function (canView) {
            if(canView) {
                return clmDataStore.cohorts.getAnnouncements(cohortId);
            }
        }),
        // events: canviewPromise.then(function (canView) {
        //     if(canView) {
        //         return clmDataStore.cohorts.
        //     }
        // })
        // events: canviewPromise.then(function(canView) {
        //     if(canView) {
        //         return clmDataStore.cohorts.getEvents(cohortId);
        //     }
        // }),
        // tasks: canviewPromise.then(function(canView) {
        //     if (canView) {
        //         return clmDataStore.events.getTasks(eventId);
        //     }
        // }),
        // participants: canviewPromise.then(function(canView) {
        //     if (canView) {
        //         return clmDataStore.events.participants(eventId);
        //     }
        // }),
        // progress: canviewPromise.then(function(canView) {
        //     if (canView) {
        //         return clmDataStore.events.getProgress(eventId);
        //     }
        // }),
        // solutions: canviewPromise.then(function(canView) {
        //     if (canView) {
        //         return clmDataStore.events.getSolutions(eventId);
        //     }
        // }),
        // scores: canviewPromise.then(function(canView) {
        //     if (canView) {
        //         return clmDataStore.events.getScores(eventId);
        //     }
        // })
    });
}
viewCohortCtrlInitialData.$inject = [
    '$q',
    '$route',
    'spfAuth',
    'spfAuthData',
    'clmDataStore'
];

function ViewCohortCtrl(
    $scope, initialData, $document, $mdDialog, $route,
    spfAlert, urlFor, spfFirebase, spfAuthData, spfNavBarService, clmDataStore
) {
    var self = this;
    var monitorHandler;

    this.currentUser = initialData.currentUser;
    this.cohort = initialData.cohort;
    this.participants = initialData.participants;
    this.profile = initialData.profile;
    this.announcements = initialData.announcements;
    // this.tasks = initialData.tasks;
    // this.progress = initialData.progress;
    // this.solutions = initialData.solutions;
    // this.scores = initialData.scores;
    // this.canView = initialData.canView;
    // this.viewArchived = false;
    // this.selected = null;
    this.isOwner = false;

    if (
        self.event &&
        self.event.owner &&
        self.event.owner.publicId &&
        self.currentUser &&
        self.event.owner.publicId === self.currentUser.publicId
    ) {
        monitorHandler = clmDataStore.events.monitorEvent(
            this.event, this.tasks, this.participants, this.solutions, this.progress
        );
        this.isOwner = true;
    } else {
        monitorHandler = {
            update: noop,
            unwatch: noop
        };
    }

    $scope.$on('$destroy', function() {
        /* eslint no-unused-expressions: 0 */
        monitorHandler.unwatch();
        self.event && self.event.$destroy && self.event.$destroy();
        self.participants && self.participants.$destroy && self.participants.$destroy();
        self.profile && self.profile.$destroy && self.profile.$destroy();
        self.progress && self.progress.$destroy && self.progress.$destroy();
        self.solutions && self.solutions.$destroy && self.solutions.$destroy();
    });

    updateNavbar();

    function updateNavbar() {
        spfNavBarService.update(
            self.cohort.title, {
                title: 'Cohorts',
                url: `#${urlFor('cohorts')}`
            }, getOptions()
        );
    }

    function getOptions() {
        var options = [];

        if (!self.currentUser || !self.currentUser.publicId) {
            return options;
        }

        // add join/leave button
        // if (
        //     self.participants &&
        //     self.participants.$indexFor(self.currentUser.publicId) > -1
        // ) {
        //     options.push({
        //         title: 'Leave',
        //         onClick: function() {
        //             clmDataStore.events.leave(self.event.$id).then(function() {
        //                 $route.reload();
        //             });
        //         },
        //         icon: 'clear'
        //     });
        // } else {
        //     options.push({
        //         title: 'Join',
        //         onClick: promptPassword,
        //         icon: 'add'
        //     });
        // }

        // Add edit button
        if (self.cohort.owner.publicId === self.currentUser.publicId) {
            options.push({
                title: 'Edit',
                url: `#${urlFor('editCohort', {cohortId: self.cohort.$id})}`,
                icon: 'create'
            });
            // Add update button (May not be necessary for cohorts)
            // options.push({
            //     title: 'Update',
            //     onClick: function() {
            //         monitorHandler.update();
            //     },
            //     icon: 'loop'
            // });
        }

        return options;
    }

    //
    // function promptPassword() {
    //     if (
    //         self.event.schoolEvent && (
    //             !self.profile ||
    //             !self.profile.user ||
    //             !self.profile.user.school
    //         )
    //     ) {
    //         spfAlert.warning(
    //             'Only Students from Singapore can join this event. ' +
    //             'Maybe you profile needs to be updated.');
    //         return;
    //     }
    //     $mdDialog.show({
    //         parent: $document.body,
    //         template: passwordTmpl,
    //         controller: DialogController,
    //         controllerAs: 'ctrl'
    //     });
    //
    //     function DialogController() {
    //         this.pw = '';
    //
    //         this.join = function(pw) {
    //             clmDataStore.events.join(self.event, pw).then(function() {
    //                 spfAlert.success('You joined this event');
    //                 $mdDialog.hide();
    //                 $route.reload();
    //             }).catch(function(err) {
    //                 spfAlert.error(`Failed to add you: ${err}`);
    //             });
    //         };
    //
    //         this.closeDialog = function() {
    //             $mdDialog.hide();
    //         };
    //     }
    // }
    //
    // function cleanProfile(currentUser) {
    //     currentUser.country = spfFirebase.cleanObj(currentUser.country);
    //     currentUser.school = spfFirebase.cleanObj(currentUser.school);
    // }
    //
    // this.register = function(currentUser) {
    //     cleanProfile(currentUser);
    //     spfAuthData.publicId(currentUser).then(function() {
    //         spfAlert.success('Public id and display name saved');
    //         return clmDataStore.initProfile();
    //     }).then(function() {
    //         $route.reload();
    //     }).catch(function(err) {
    //         spfAlert.error('Failed to save public id');
    //         return err;
    //     });
    // };
    //
    // this.removeParticipant = function(e, event, participant) {
    //     var confirm = $mdDialog.confirm()
    //         .parent($document.body)
    //         .title(`Would you like to remove ${participant.user.displayName}?`)
    //         .content('The participant progress will be kept but he/she will not show as participant')
    //         .ariaLabel('Remove participant')
    //         .ok('Remove')
    //         .cancel('Cancel')
    //         .targetEvent(e);
    //
    //     $mdDialog.show(confirm).then(function() {
    //         clmDataStore.events.removeParticpants(event.$id, participant.$id);
    //     });
    // };
}
ViewCohortCtrl.$inject = [
    '$scope',
    'initialData',
    '$document',
    '$mdDialog',
    '$route',
    'spfAlert',
    'urlFor',
    'spfFirebase',
    'spfAuthData',
    'spfNavBarService',
    'clmDataStore'
];

/**
 * Used to resolve `initialData` for `EditCtrl`
 *
 */
function editCohortCtrlInitialData($q, $route, spfAuthData, clmDataStore) {
    var data = baseEditCtrlInitialData($q, $route, spfAuthData, clmDataStore);

    // data.tasks = data.event.then(function(event) {
    //     return clmDataStore.events.getTasks(event.$id);
    // });

    return $q.all(data);
}
editCohortCtrlInitialData.$inject = ['$q', '$route', 'spfAuthData', 'clmDataStore'];

/**
 * EditEventCtrl
 *
 */
function EditCohortCtrl(initialData, spfNavBarService, urlFor, spfAlert, clmDataStore) {
    var self = this;

    this.currentUser = initialData.currentUser;
    this.cohort = initialData.cohort;
    // this.tasks = initialData.tasks;
    // this.newPassword = '';
    this.savingCohort = false;

    spfNavBarService.update(
        'Edit', [{
            title: 'Cohorts',
            url: `#${urlFor('cohorts')}`
        }, {
            title: this.cohort.title,
            url: `#${urlFor('viewCohort', {cohortId: this.cohort.$id})}`
        }]
        // [{
        //     title: 'New Challenge',
        //     url: `#${urlFor('addEventTask', {eventId: this.event.$id})}`,
        //     icon: 'create'
        // }]
    );

    this.save = function(currentUser, cohort, editCohortForm) {
        self.savingCohort = true;
        cohort.owner.publicId = currentUser.publicId;
        cohort.owner.displayName = currentUser.displayName;
        cohort.owner.gravatar = currentUser.gravatar;
        return clmDataStore.cohorts.updateCohort(cohort).then(function() {
            spfAlert.success('Cohort saved.');
            editCohortForm.$setPristine(true);
        }).catch(function() {
            spfAlert.error('Failed to save cohort.');
        }).finally(function() {
            self.savingCohort = false;
        });
    };

    this.saveAnnouncement = function(cohortId) {
        clmDataStore.cohorts.addAnnouncement(cohortId, this.currentUser, this.newAnnouncement, false).then(function() {
            spfAlert.success('Announcement created');
        }).catch(function () {
            spfAlert.error('Failed to create announcement');
        })
    };

    // this.openTask = function(eventId, taskId) {
    //     clmDataStore.events.openTask(eventId, taskId).then(function() {
    //         spfAlert.success('Task opened.');
    //     }).catch(function() {
    //         spfAlert.error('Failed to open task');
    //     });
    // };
    //
    // this.closeTask = function(eventId, taskId) {
    //     clmDataStore.events.closeTask(eventId, taskId).then(function() {
    //         spfAlert.success('Task closed.');
    //     }).catch(function() {
    //         spfAlert.error('Failed to close task.');
    //     });
    // };
    //
    // this.showTask = function(eventId, taskId) {
    //     clmDataStore.events.showTask(eventId, taskId).then(function() {
    //         spfAlert.success('Task visible.');
    //     }).catch(function() {
    //         spfAlert.error('Failed to make task visible.');
    //     });
    // };
    //
    // this.hideTask = function(eventId, taskId) {
    //     clmDataStore.events.hideTask(eventId, taskId).then(function() {
    //         spfAlert.success('Task hidden.');
    //     }).catch(function() {
    //         spfAlert.error('Failed to make task hidden.');
    //     });
    // };
    //
    // this.archiveTask = function(eventId, taskId) {
    //     clmDataStore.events.archiveTask(eventId, taskId).then(function() {
    //         spfAlert.success('Task archived.');
    //     }).catch(function() {
    //         spfAlert.error('Failed to archive task.');
    //     });
    // };
}
EditCohortCtrl.$inject = ['initialData', 'spfNavBarService', 'urlFor', 'spfAlert', 'clmDataStore'];

/**
 * Minimal resolver for `EditCtrl` and `AddEventTaskCtrl`.
 *
 * Load the event data and the current user data.
 *
 * The promise will resolved to an error if the the current user
 * is not the owner of the event.
 *
 */
function baseEditCtrlInitialData($q, $route, spfAuthData, clmDataStore) {
    var errNoCohort = new Error('Cohort not found');
    var errNotAuthorized = new Error('You cannot edit this cohort');
    var cohortId = $route.current.params.cohortId;

    var cohortPromise = clmDataStore.cohorts.get(cohortId).then(function(cohort) {
        if (cohort.$value === null) {
            return $q.reject(errNoCohort);
        }
        return cohort;
    });

    var data = {
        currentUser: spfAuthData.user(),
        cohort: cohortPromise
    };

    data.canEdit = $q.all({
        currentUser: spfAuthData.user(),
        cohort: cohortPromise
    }).then(function(result) {
        if (
            !result.currentUser.publicId ||
            !result.cohort.owner ||
            !result.cohort.owner.publicId ||
            result.cohort.owner.publicId !== result.currentUser.publicId
        ) {
            return $q.reject(errNotAuthorized);
        }

        return result;
    });

    return data;
}