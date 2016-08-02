/**
 * classmentors/components/cohorts/cohorts.js- define cohort component.
 */

import cohortTmpl from './cohorts-view.html!text';
import newCohortTmpl from './cohorts-new-cohort.html!text';
import cohortViewTmpl from './cohorts-view-cohort.html!text';
import cohortEditTmpl from './cohorts-edit-cohort.html!text';
import cohortStatsPageTmpl from './cohorts-view-cohort-stats-page.html!text';
import './cohorts.css!';
// import d3 from '../../../jspm_packages/graphing/d3.min.js';
// import '../../../jspm_packages/graphing/c3.min.css';
// import c3 from '../../../jspm_packages/graphing/c3.min.js';
// import './cohorts.css!';

const noop = () => undefined;

export const component = {
    controller: ViewCohortCtrl
};

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
    this.selectedEventsNames = [];
    this.featured = false;

    this.includeCreated = false;
    this.includeJoined = false;

    this.creatingEvent = false;
    this.profileNeedsUpdate = !this.currentUser.$completed();


    spfNavBarService.update(
        'New Cohorts',
        {
            title: 'Cohorts',
            url: `#${urlFor('cohorts')}`
        }, []
    );

    this.toggle = function(item, item2, list, list2) {
        var idx = list.indexOf(item);
        if (idx > -1) {
            list.splice(idx, 1);
        }
        else {
            list.push(item);
            list2.push(item2);
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

    this.save = function(currentUser, newCohort, events, featured) {
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
                events: events,
                featured: featured
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
        events: canviewPromise.then(function (canView) {
            if(canView) {
                return clmDataStore.events.listAll();
            }
        }),
        joinedEvents: canviewPromise.then(function (canView) {
            if(canView) {
                return clmDataStore.events.listJoinedEventsObj();
            }
        })
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
    this.events = initialData.events;
    this.isOwner = false;
    this.joinedEvents = initialData.joinedEvents;

    if (
        self.cohort &&
        self.cohort.owner &&
        self.cohort.owner.publicId &&
        self.currentUser &&
        self.cohort.owner.publicId === self.currentUser.publicId
    ) {
        this.isOwner = true;
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

    this.viewFullAnnouncement = function(content, title) {
        $mdDialog.show({
            clickOutsideToClose: true,
            parent: $document.body,
            template: '<md-dialog aria-label="Announcement dialog" class="announcement-dialog">' +
            '  <md-dialog-content class="sticky-container">'+
            '<md-subheader class="md-sticky-no-effect">{{ctrl.title}}</md-subheader>' +
            '    <div style="white-space: pre-wrap;">{{ctrl.content}}</div>'+
            '  </md-dialog-content>' +
            '  <md-dialog-actions>' +
            '    <md-button ng-click="ctrl.closeDialog()" class="md-primary">' +
            '      Close' +
            '    </md-button>' +
            '  </md-dialog-actions>' +
            '</md-dialog>',
            controller: viewAnnouncementController,
            controllerAs: 'ctrl'
        });

        function viewAnnouncementController() {
            this.content = content;
            this.title = title;
            this.closeDialog = function() {
                $mdDialog.hide();
            };
        }
    };

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

function EditCohortCtrl(initialData, spfNavBarService, urlFor, spfAlert, clmDataStore) {
    var self = this;

    this.currentUser = initialData.currentUser;
    this.cohort = initialData.cohort;
    this.announcements = initialData.announcements;
    // this.tasks = initialData.tasks;
    // this.newPassword = '';
    this.savingCohort = false;
    this.creatingNewAnnouncement = false;
    this.newAnnouncement = {};

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

    this.createNewAnnouncement = function () {
        self.creatingNewAnnouncement = true;
        self.newAnnouncement.featured = false;
        self.newAnnouncement.visible = true;
    };

    this.closeNewAnnouncement = function() {
        self.creatingNewAnnouncement = false;
    };

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
        }).finally(function () {
            self.creatingNewAnnouncement = false;
            self.newAnnouncement = {};
        })
    };

    this.featureAnnouncement = function(cohortId, announcementId) {
        clmDataStore.cohorts.featureAnnouncement(cohortId, announcementId).then(function() {
            spfAlert.success('Announcement featured.');
        }).catch(function() {
            spfAlert.error('Failed to feature announcement');
        });
    };

    this.unfeatureAnnouncement = function(cohortId, announcementId) {
        clmDataStore.cohorts.unfeatureAnnouncement(cohortId, announcementId).then(function() {
            spfAlert.success('Announcement un-featured.');
        }).catch(function() {
            spfAlert.error('Failed to un-feature announcement');
        });
    };

    this.showAnnouncement = function(cohortId, announcementId) {
        clmDataStore.cohorts.showAnnouncement(cohortId, announcementId).then(function() {
            spfAlert.success('Announcement is now visible.');
        }).catch(function() {
            spfAlert.error('Failed to make announcement visible');
        });
    };

    this.hideAnnouncement = function(cohortId, announcementId) {
        clmDataStore.cohorts.hideAnnouncement(cohortId, announcementId).then(function() {
            spfAlert.success('Announcement is now hidden.');
        }).catch(function() {
            spfAlert.error('Failed to hide announcement');
        });
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
        announcements: clmDataStore.cohorts.getAnnouncements(cohortId),
        cohort: cohortPromise
    };

    data.canEdit = $q.all({
        currentUser: spfAuthData.user(),
        announcements: clmDataStore.cohorts.getAnnouncements(cohortId),
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

export function clmCohortsStatsPageFactory() {
    return {
        template: cohortStatsPageTmpl,
        restrict: 'E',
        bindToController: true,
        scope: {
            cohort: '=',
            profile: '='
        },
        controller: ClmCohortStatsPageCtrl,
        controllerAs: 'ctrl'
    };
}

function ClmCohortStatsPageCtrl(
    $scope, $q, $log, $mdDialog, $document,
    urlFor, spfAlert, clmServicesUrl, clmDataStore
) {
    var self = this;
    this.selectedStatistic = null;

    // console.log(this.cohort);
    // console.log(this.profile);
    // console.log(this.selectedStatistic);

    this.renderDashboard = function() {
        if(self.selectedStatistic) {
            var dataString = JSON.parse('{"Sprint 1": [10, 20, 30, 40, 50],"Sprint 2": [2, 4, 6, 8, 10],"Sprint 3": [5, 10, 15, 20, 25]}');
            // var chart = c3.generate({
            //     bindto: "#chart",
            //     data: {
            //         //Test data
            //         // columns: [
            //         // 	['data1', 50, 70, 30, 20, 10],
            //         // 	['data2', 14, 56, 88, 34, 100]
            //         // ],
            //         json: dataString,
            //         type: "spline"
            //     }
            // });
        }
    };

    // this.currentUserParticipant = undefined;
    // this.participantsView = [];
    // this.visibleTasks = [];
    // this.taskCompletion = {};
    //
    // this.orderOptions = {
    //     key: undefined,
    //     reversed: false
    // };
    //
    // this.pagerOptions = clmPagerOption();
    // unwatchers.push(self.pagerOptions.$destroy.bind(self.pagerOptions));
    //
    // /**
    //  * Get current user participant row
    //  */
    // function currentUserParticipant() {
    //     if (
    //         !self.participants ||
    //         !self.participants.$getRecord ||
    //         !self.profile ||
    //         !self.profile.$id
    //     ) {
    //         self.currentUserParticipant = undefined;
    //     }
    //
    //     self.currentUserParticipant = self.participants.$getRecord(self.profile.$id);
    // }
    //
    // /**
    //  * Set list of visible tasks and the % completion.
    //  *
    //  */
    // function visibleTasks() {
    //     if (!self.tasks || !self.tasks.filter) {
    //         self.visibleTasks = [];
    //         return;
    //     }
    //
    //     self.visibleTasks = self.tasks.filter(function(t) {
    //         return !t.hidden && !t.archived;
    //     });
    //
    //     taskCompletion();
    // }
    //
    // /**
    //  * Calculate all visible tasks completion rate.
    //  *
    //  */
    // function taskCompletion() {
    //     self.taskCompletion = self.visibleTasks.reduce(function(all, task) {
    //         all[task.$id] = _taskCompletion(task.$id);
    //         return all;
    //     }, {});
    // }
    //
    // /**
    //  * Return the completion rate of a task.
    //  *
    //  */
    // function _taskCompletion(taskId) {
    //     var participantCount, participantsIds;
    //
    //     if (!self.participants || !self.progress) {
    //         return 0;
    //     }
    //
    //     participantCount = self.participants.length;
    //     participantsIds = self.participants.reduce(function(all, participant) {
    //         if (participant.$id) {
    //             all[participant.$id] = true;
    //         }
    //         return all;
    //     }, {});
    //
    //     if (participantCount < 1) {
    //         return 0;
    //     }
    //
    //     return Object.keys(self.progress).filter(function(publicId) {
    //             return (
    //                 participantsIds[publicId] && // Make sure user is still participating
    //                 // (user progress is kept when they leave)
    //                 self.progress[publicId] &&
    //                 self.progress[publicId][taskId] &&
    //                 self.progress[publicId][taskId].completed
    //             );
    //         }).length / participantCount * 100;
    // }
    //
    // function _completionComparer(options) {
    //     var taskId = options.key;
    //
    //     return function(a, b) {
    //         var aP = (
    //             self.progress &&
    //             self.progress[a.$id] &&
    //             self.progress[a.$id][taskId] &&
    //             self.progress[a.$id][taskId].completed
    //         );
    //         var bP = (
    //             self.progress &&
    //             self.progress[b.$id] &&
    //             self.progress[b.$id][taskId] &&
    //             self.progress[b.$id][taskId].completed
    //         );
    //
    //         if (aP === bP) {
    //             return 0;
    //         } else if (aP) {
    //             return 1;
    //         }
    //
    //         return -1;
    //     };
    // }
    //
    // function _solutionComparer(options) {
    //     var taskId = options.key;
    //     var task = self.tasks.$getRecord(taskId);
    //
    //     if (!task || (!task.textResponse && !task.linkPattern)) {
    //         return noop;
    //     }
    //
    //     return function(a, b) {
    //         var aS = (
    //                 self.solutions &&
    //                 self.solutions[a.$id] &&
    //                 self.solutions[a.$id][taskId]
    //             ) || '';
    //         var bS = (
    //                 self.solutions &&
    //                 self.solutions[b.$id] &&
    //                 self.solutions[b.$id][taskId]
    //             ) || '';
    //
    //         return aS.localeCompare(bS);
    //     };
    // }
    //
    // function _compareName(a, b) {
    //     var aN = (a.user && a.user.displayName) || '';
    //     var bN = (b.user && b.user.displayName) || '';
    //
    //     return aN.localeCompare(bN);
    // }
    //
    // function sortedParticipants(participants, options) {
    //     var rows = participants.filter(function(p) {
    //         return p.$id !== self.profile.$id;
    //     });
    //     var comparer;
    //
    //     if (options.key) {
    //         comparer = chainComparer([_completionComparer(options), _solutionComparer(options), _compareName]);
    //     } else {
    //         comparer = _compareName;
    //     }
    //
    //     rows.sort(reverseComparer(options.reversed, comparer));
    //     return rows;
    // }
    //
    // // Update the pager rowCount
    // // (the pager should trigger a range update which will call participantsView)
    // function updateParticipantRowCount() {
    //     currentUserParticipant();
    //
    //     if (self.currentUserParticipant) {
    //         self.pagerOptions.setRowCount(self.participants.length - 1);
    //     } else {
    //         self.pagerOptions.setRowCount(self.participants.length);
    //     }
    // }
    //
    // /**
    //  * Set the slice of participant to show.
    //  *
    //  */
    // function participantsView() {
    //     var rows = sortedParticipants(self.participants, self.orderOptions);
    //
    //     self.participantsView = rows.slice(self.pagerOptions.range.start, self.pagerOptions.range.end);
    //     self.participantsView.unshift(self.currentUserParticipant);
    // }
    //
    // /**
    //  * Switch ordering key or ordering direction.
    //  *
    //  * If the ordering key is changing, the ordering direction should be
    //  * ascendent.
    //  *
    //  * If the order key is not changing, the direction should be switched.
    //  *
    //  */
    // this.orderBy = function(taskId) {
    //     self.orderOptions.reversed = (
    //         !self.orderOptions.reversed &&
    //         (self.orderOptions.key === taskId)
    //     );
    //     self.orderOptions.key = taskId;
    //     participantsView();
    // };
    //
    // function defaultLinker(task, serviceProfile) {
    //     if (
    //         !serviceProfile ||
    //         !serviceProfile.details ||
    //         !serviceProfile.details.id ||
    //         !task ||
    //         !task.badge ||
    //         !task.badge.url
    //     ) {
    //         return `#${urlFor('editProfile')}`;
    //     }
    //
    //     return task.badge.url;
    // }
    //
    // var linkers = {
    //     codeSchool: defaultLinker,
    //     codeCombat: defaultLinker,
    //
    //     singPath: function(task) {
    //         if (!task || task.serviceId !== 'singPath') {
    //             return '';
    //         }
    //
    //         if (
    //             !task.singPathProblem ||
    //             !task.singPathProblem.path ||
    //             !task.singPathProblem.path.id ||
    //             !task.singPathProblem.level ||
    //             !task.singPathProblem.level.id ||
    //             !task.singPathProblem.problem ||
    //             !task.singPathProblem.problem.id
    //         ) {
    //             return clmServicesUrl.singPath;
    //         }
    //
    //         return (
    //             clmServicesUrl.singPath + '/#' +
    //             '/paths/' + task.singPathProblem.path.id +
    //             '/levels/' + task.singPathProblem.level.id +
    //             '/problems/' + task.singPathProblem.problem.id + '/play'
    //         ).replace(/\/+/, '/');
    //     }
    // };
    //
    // this.startLink = function(task, profile) {
    //     var serviceProfile;
    //
    //     if (
    //         !task ||
    //         !task.serviceId ||
    //         !linkers[task.serviceId]
    //     ) {
    //         return '';
    //     }
    //
    //     serviceProfile = profile && profile.services && profile.services[task.serviceId];
    //     return linkers[task.serviceId](task, serviceProfile);
    // };
    //
    // var trackedServices = {
    //     codeSchool: true,
    //     codeCombat: true
    // };
    //
    // this.mustRegister = function(task, profile) {
    //     return Boolean(
    //         task &&
    //         task.serviceId &&
    //         trackedServices[task.serviceId] && (
    //             !profile ||
    //             !profile.services ||
    //             !profile.services[task.serviceId] ||
    //             !profile.services[task.serviceId].details ||
    //             !profile.services[task.serviceId].details.id
    //         )
    //     );
    // };
    //
    // this.viewLink = function(eventId, taskId, task, participant, userSolution) {
    //     console.log(participant);
    //     $mdDialog.show({
    //         clickOutsideToClose: true,
    //         parent: $document.body,
    //         template: linkTmpl,
    //         controller: DialogController,
    //         controllerAs: 'ctrl'
    //     });
    //
    //     function DialogController() {
    //         this.task = task;
    //         this.review = true;
    //         if (
    //             userSolution &&
    //             userSolution[taskId]
    //         ) {
    //             this.solution = $sce.trustAsResourceUrl(userSolution[taskId]);
    //         }
    //
    //         this.save = function(link) {
    //             clmDataStore.events.submitSolution(eventId, taskId, participant.$id, link).then(function() {
    //                 $mdDialog.hide();
    //                 spfAlert.success('Link is saved.');
    //             }).catch(function(err) {
    //                 $log.error(err);
    //                 spfAlert.error('Failed to save the link.');
    //                 return err;
    //             });
    //         };
    //
    //         this.cancel = function() {
    //             $mdDialog.hide();
    //         };
    //     }
    // };
    //
    // this.viewTextResponse = function(eventId, taskId, task, participant, userSolution) {
    //     $mdDialog.show({
    //         clickOutsideToClose: true,
    //         parent: $document.body,
    //         template: responseTmpl,
    //         controller: DialogController,
    //         controllerAs: 'ctrl'
    //     });
    //
    //     function DialogController() {
    //         this.task = task;
    //         this.viewOnly = true;
    //         if (
    //             userSolution &&
    //             userSolution[taskId]
    //         ) {
    //             this.solution = userSolution[taskId];
    //         }
    //
    //         this.save = function(response) {
    //             clmDataStore.events.submitSolution(eventId, taskId, participant.$id, response).then(function() {
    //                 $mdDialog.hide();
    //                 spfAlert.success('Response is saved.');
    //             }).catch(function(err) {
    //                 $log.error(err);
    //                 spfAlert.error('Failed to save your response.');
    //                 return err;
    //             });
    //         };
    //
    //         this.cancel = function() {
    //             $mdDialog.hide();
    //         };
    //     }
    // };
    //
    // this.viewCodeResponse = function(eventId, taskId, task, participant, userSolution) {
    //     $mdDialog.show({
    //         clickOutsideToClose: true,
    //         parent: angular.element(document.body),
    //         template: codeTmpl,
    //         onComplete: loadEditor,
    //         controller: CodeController,
    //         controllerAs: 'ctrl'
    //     });
    //
    //     this.loadingEditor = true;
    //     var parent = this;
    //
    //     function loadEditor() {
    //         var editor = ace.edit(document.querySelector('#editor'));
    //         editor.setTheme("ace/theme/monokai");
    //         editor.getSession().setMode("ace/mode/"+task.lang.toLowerCase());
    //         editor.getSession().setUseWrapMode(true);
    //         editor.setOptions({
    //             readOnly: true,
    //             highlightActiveLine: false,
    //             highlightGutterLine: false
    //         });
    //         parent.loadingEditor = false;
    //     }
    //
    //     function CodeController() {
    //         this.task = task;
    //         this.viewOnly = true;
    //
    //         this.checkEditor = function() {
    //             return parent.loadingEditor;
    //             console.log(parent.loadingEditor);
    //         };
    //
    //         if (
    //             userSolution &&
    //             userSolution[taskId]
    //         ) {
    //             this.solution = userSolution[taskId];
    //         }
    //
    //         this.save = function() {
    //             var editor = ace.edit(document.querySelector('#editor'));
    //             var response = editor.getValue();
    //             console.log("Function submitted for answer "+response);
    //             clmDataStore.events.submitSolution(eventId, taskId, participant.$id, response).then(function() {
    //                 $mdDialog.hide();
    //                 spfAlert.success('Response is saved.');
    //             }).catch(function(err) {
    //                 $log.error(err);
    //                 spfAlert.error('Failed to save your response.');
    //                 return err;
    //             });
    //         };
    //
    //         this.cancel = function() {
    //             $mdDialog.hide();
    //         };
    //     }
    // };
    //
    // this.saveAllocatedPoints = function(eventId, taskId, task, participant, score) {
    //     clmDataStore.events.saveScore(eventId, participant.$id, taskId, score).then(function () {
    //         spfAlert.success('Score has been saved.');
    //     }).catch(function (err) {
    //         $log.error(err);
    //         spfAlert.error('Failed to save score.');
    //         return err;
    //     });
    // };
    //
    // this.update = function() {};
    // /*
    //  this.update = function(event, tasks, userSolutions, profile) {
    //  return clmDataStore.events.updateCurrentUserProfile(
    //  event, tasks, userSolutions, profile
    //  ).then(function() {
    //  spfAlert.success('Profile updated');
    //  }).catch(function(err) {
    //  $log.error(err);
    //  spfAlert.error('Failed to update profile');
    //  });
    //  };*/
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
    //
    // // load up resources and start firebase watcher
    // this.loading = true;
    // $q.all({
    //     userProgress: clmDataStore.events.getUserProgress(this.event.$id, this.profile.$id).then(function(progress) {
    //         self.currentUserProgress = progress;
    //         unwatchers.push(progress.$destroy.bind(progress));
    //         return progress;
    //     }),
    //     userSolution: clmDataStore.events.getUserSolutions(this.event.$id, this.profile.$id).then(function(solutions) {
    //         self.currentUserSolutions = solutions;
    //         unwatchers.push(solutions.$destroy.bind(solutions));
    //         return solutions;
    //     }),
    //     singpathQueuedSolution: clmDataStore.singPath.queuedSolutions(this.profile.$id).then(function(paths) {
    //         unwatchers.push(paths.$destroy.bind(paths));
    //         return paths;
    //     })
    // }).then(function(results) {
    //     visibleTasks();
    //
    //     // Set the participant view (via the pager range update event)
    //     unwatchers.push(self.pagerOptions.onChange(participantsView));
    //     updateParticipantRowCount();
    //
    //     // Monitor updates on task progress and participants list.
    //     unwatchers.push(self.tasks.$watch(visibleTasks));
    //     unwatchers.push(self.progress.$watch(taskCompletion));
    //     unwatchers.push(self.participants.$watch(taskCompletion));
    //     unwatchers.push(self.participants.$watch(updateParticipantRowCount));
    //
    //     return results;
    // }).finally(function() {
    //     self.loading = false;
    // }).then(function(results) {
    //     var update = function() {
    //         // Removed due to June 2016 profile updating process change.
    //         /*
    //          return clmDataStore.events.updateCurrentUserProfile(
    //          self.event,
    //          self.tasks,
    //          results.userSolution,
    //          self.profile
    //          );
    //          */
    //     };
    //
    //     // Watch for singpath problem getting updated
    //     unwatchers.push(results.singpathQueuedSolution.$watch(update));
    //
    //     return update();
    // }).catch(function(err) {
    //     $log.error(err);
    // });
    //
    // // clean up.
    // $scope.$on('$destroy', function() {
    //     unwatchers.forEach(function(f) {
    //         if (f) {
    //             try {
    //                 f();
    //             } catch (err) {
    //                 $log.error(err);
    //             }
    //         }
    //     });
    // });
}
ClmCohortStatsPageCtrl.$inject = [
    '$scope',
    '$q',
    '$log',
    '$mdDialog',
    '$document',
    'urlFor',
    'spfAlert',
    'clmServicesUrl',
    'clmDataStore'
];