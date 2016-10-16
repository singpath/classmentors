/**
 * Created by limshiquan on 13/10/16.
 */
import qqHome from './question-queue.html!text';
import eventQ from './event-queue.html!text';
import askQnTmpl from './askQuestion.html!text';

import './question-queue.css!';

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

function eventQController(initialData, spfNavBarService, urlFor, firebaseApp, spfAlert, $firebaseObject, $mdDialog, $document, clmDataStore) {
    var self = this;
    var db = firebaseApp.database();

    this.currentUser = initialData.currentUser;
    this.profile = initialData.profile;
    this.event = initialData.event;
    this.questions = initialData.questions;
    this.myQuestions = [];
    this.myQnLimit = 3;
    this.voteQnLimit = 3;

    this.expandMyQns = function() {
      self.myQnLimit += 3;
    };

    this.expandVoteQns = function() {
        self.voteQnLimit += 3;
    };

    spfNavBarService.update(
        self.event.title,
    {
        title: 'Question Queues',
        url: `#${urlFor('questionQueue')}`
    });

    this.toggleVote = function (question, questionId) {
        var ref = db.ref(`classMentors/eventQuestions/${self.event.$id}/questions/${questionId}/upVotes/${self.currentUser.publicId}`);
        if(question.owner.publicId == self.currentUser.publicId) {
            spfAlert.error("You cannot upvote your own question.");
        } else {
            if(question.upVotes && question.upVotes[self.currentUser.publicId]) {
                ref.remove()
            } else {
                return ref.set(Date.now());
            }
        }
    };

    this.askNewQuestion = function (event, currentUser) {
        $mdDialog.show({
            clickOutsideToClose: true,
            parent: $document.body,
            template: askQnTmpl,
            controller: askQnController,
            controllerAs: 'ctrl'
        });

        function askQnController() {
            var self = this;
            this.event = event;
            this.user = {
                publicId: currentUser.publicId,
                displayName: currentUser.displayName,
                gravatar: currentUser.gravatar
            };
            this.question = {};
            this.postQn = function () {
                self.question.owner = self.user;
                self.question.createdAt = Date.now();
                clmDataStore.events.questions.create(self.question, self.event.$id).then(
                    spfAlert.success('You have successfully posted a new question')
                ).then($mdDialog.hide()).catch(function () {
                    spfAlert.error('You failed to post your question. Please ensure that title and questions are at least 3 characters long')
                });
                clmDataStore.logging.inputLog({
                    action: "askQuestion",
                    publicId: self.currentUser.publicId,
                    eventId: self.event.$id,
                    timestamp: self.question.createdAt
                });
            };
            this.closeDialog = function() {
                $mdDialog.hide();
            };
        }
    }

}

eventQController.$inject = ['initialData', 'spfNavBarService', 'urlFor', 'firebaseApp', 'spfAlert', '$firebaseObject', '$mdDialog', '$document', 'clmDataStore'];

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
        event: clmDataStore.events.get(eventId),
        questions: clmDataStore.events.questions.allRef(eventId)
    });
}
eventQResolver.$inject = ['$q', 'spfAuth', 'spfAuthData', 'clmDataStore', '$route'];
