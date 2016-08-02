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