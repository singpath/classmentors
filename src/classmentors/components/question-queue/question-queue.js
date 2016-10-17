/**
 * Created by limshiquan on 13/10/16.
 */
import qqHome from './question-queue.html!text';
import eventQ from './event-queue.html!text';
import oneQn from './view-question.html!text';
import askQnTmpl from './askQuestion.html!text';
import ansQnTmpl from './answerQuestion.html!text';

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
function qqController(initialData, spfNavBarService, urlFor, firebaseApp, spfAlert, $firebaseObject, clmDataStore, $q) {
    var self = this;
    var db = firebaseApp.database();

    this.currentUser = initialData.currentUser;
    this.profile = initialData.profile;
    this.createdEvents = initialData.createdEvents;
    this.joinedEvents = initialData.joinedEvents;
    this.asstEvents = [];

    clmDataStore.events.getAssistingEvents(self.currentUser.publicId)
        .then(function (events) {
            // console.log(events);
            self.asstEvents = events;
        })
        .then(function () {
            for(let index in self.asstEvents) {
                let eventId = self.asstEvents[index].$id;
                if(eventId) {
                    resolveEventQuestions('asst', eventId);
                }
            }
        });

    for(let index in self.joinedEvents) {
        let eventId = self.joinedEvents[index].$id;
        if(eventId) {
            resolveEventQuestions('joined', eventId);
        }
    }

    for(let index in self.createdEvents) {
        let eventId = self.createdEvents[index].$id;
        if(eventId) {
            resolveEventQuestions('created', eventId);
        }
    }

    function resolveEventQuestions(type, eventId) {
        clmDataStore.events.questions.allRef(eventId).then(function (questions) {
            if(type=='joined') {
                self.joinedEvents.find(e => e.$id == eventId).questions = questions;
            }
            if(type=='created') {
                self.createdEvents.find(e => e.$id == eventId).questions = questions;
            }
            if(type=='asst') {
                self.asstEvents.find(e => e.$id == eventId).questions = questions;
            }
        });
        clmDataStore.events.getForumStatus(eventId).then(function (status) {
            // console.log(status.$value);
            if(type=='joined') {
                self.joinedEvents.find(e => e.$id == eventId).closedForum = status.$value;
            }
            if(type=='created') {
                self.createdEvents.find(e => e.$id == eventId).closedForum = status.$value;
            }
            if(type=='asst') {
                self.asstEvents.find(e => e.$id == eventId).closedForum = status.$value;
            }
        })
    }

    spfNavBarService.update('Question Queues');

}

qqController.$inject = ['initialData', 'spfNavBarService', 'urlFor', 'firebaseApp', 'spfAlert', '$firebaseObject', 'clmDataStore', '$q'];

function eventQController(initialData, spfNavBarService, urlFor, firebaseApp, spfAlert, $firebaseObject, $mdDialog, $document, clmDataStore) {
    var self = this;
    var db = firebaseApp.database();

    this.currentUser = initialData.currentUser;
    this.profile = initialData.profile;
    this.event = initialData.event;
    this.questions = initialData.questions;
    this.myQnLimit = 3;
    this.voteQnLimit = 3;

    this.expandMyQns = function() {
        if(self.myQnLimit+3 > self.questions.filter(function (qn) {
                return qn.owner.publicId == self.currentUser.publicId;
            }).length) {
            self.myQnLimit = self.questions.filter(function (qn) {
                return qn.owner.publicId == self.currentUser.publicId;
            }).length;
        } else {
            self.myQnLimit += 3;
        }
    };
    this.collapseMyQns = function() {
        if(self.myQnLimit-3 < 0) {
            self.myQnLimit = 0;
        } else {
            self.myQnLimit -= 3;
        }
    };


    this.expandVoteQns = function() {
        if(self.voteQnLimit+3 > self.questions.length) {
            self.voteQnLimit = self.questions.length;
        } else {
            self.voteQnLimit += 3;
        }
    };
    this.collapseVoteQns = function() {
        if(self.voteQnLimit-3 < 0) {
            self.voteQnLimit = 0;
        } else {
            self.voteQnLimit -= 3;
        }
    };

    clmDataStore.events.getForumStatus(self.event.$id).then(function (status) {
       self.event.closedForum = status.$value;
    });

    this.toggleForumStatus = function () {
        if(self.event.closedForum) {
            console.log('forum is now closed');
            db.ref(`classMentors/events/${self.event.$id}/closedForum`).set(true);
            db.ref(`classMentors/eventQuestions/${self.event.$id}/closedForum`).set(true);
        } else {
            console.log('forum is now open');
            db.ref(`classMentors/events/${self.event.$id}/closedForum`).remove();
            db.ref(`classMentors/eventQuestions/${self.event.$id}/closedForum`).remove();
        }
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

    this.toggleQnFlag = function (question) {
        if(question.flagged) {
            db.ref(`classMentors/eventQuestions/${self.event.$id}/questions/${question.$id}/flagged`).remove();
        } else {
            if(question.answeredBy) {
                spfAlert.error('You cannot flag a question that has already been resolved!');
            } else {
                db.ref(`classMentors/eventQuestions/${self.event.$id}/questions/${question.$id}/flagged`).set(true);
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
                    spfAlert.error('You failed to post your question.')
                });
                clmDataStore.logging.inputLog({
                    action: "askQuestion",
                    publicId: currentUser.publicId,
                    eventId: event.$id,
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

function oneQnController(initialData, spfNavBarService, urlFor, firebaseApp, spfAlert, $firebaseObject, $document, clmDataStore, $mdDialog) {
    var self = this;
    var db = firebaseApp.database();

    this.event = initialData.event;
    this.currentUser = initialData.currentUser;
    this.question = initialData.question;
    this.answers = initialData.answers;

    spfNavBarService.update(
        'View Question', [{
            title: 'Question Queues',
            url: `#${urlFor('questionQueue')}`
        }, {
            title: self.event.title,
            url: `#${urlFor('eventQueue', {eventId: this.event.$id})}`
        }], [{
            title: 'View Other Questions',
            url: `#${urlFor('eventQueue', {eventId: this.event.$id})}`,
            icon: 'arrow-back'
        }]
    );

    this.toggleQnVote = function (question, questionId) {
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

    this.toggleAnsVote = function (questionId, answer) {
        var ref = db.ref(`classMentors/eventQuestions/${self.event.$id}/answers/${questionId}/${answer.$id}/upVotes/${self.currentUser.publicId}`);
        if(answer.owner.publicId == self.currentUser.publicId) {
            spfAlert.error("You cannot upvote your own answer.");
        } else {
            if(answer.upVotes && answer.upVotes[self.currentUser.publicId]) {
                ref.remove()
            } else {
                return ref.set(Date.now());
            }
        }
    };

    this.toggleQnFlag = function () {
        if(self.question.flagged) {
            db.ref(`classMentors/eventQuestions/${self.event.$id}/questions/${self.question.$id}/flagged`).remove();
        } else {
            if(self.question.answeredBy) {
                spfAlert.error('You cannot flag a question that has already been resolved!');
            } else {
                db.ref(`classMentors/eventQuestions/${self.event.$id}/questions/${self.question.$id}/flagged`).set(true);
            }
        }
    };

    this.toggleAskerChoice = function (answerId, accepted, answer) {
        var ref1 = db.ref(`classMentors/eventQuestions/${self.event.$id}/answers/${self.question.$id}/${answerId}/acceptedAt`);
        var ref2 = db.ref(`classMentors/eventQuestions/${self.event.$id}/questions/${self.question.$id}/answeredBy`);
        if(accepted) {
            ref1.remove();
            ref2.remove();
            spfAlert.success('You have re-opened this question');
        } else {
            if(self.question.answeredBy) {
                let oldAns = self.question.answeredBy;
                console.log(oldAns);
                var ref3 = db.ref(`classMentors/eventQuestions/${self.event.$id}/answers/${self.question.$id}/${oldAns}/acceptedAt`);
                ref3.remove();
            }
            ref1.set(Date.now());
            ref2.set(answer.$id);
            db.ref(`classMentors/eventQuestions/${self.event.$id}/questions/${self.question.$id}/flagged`).remove();
            spfAlert.success('You have marked this question as resolved');
        }
    };

    this.answerQuestion = function (eventId, questionId, currentUser) {
        $mdDialog.show({
            clickOutsideToClose: true,
            parent: $document.body,
            template: ansQnTmpl,
            controller: ansQnController,
            controllerAs: 'ctrl'
        });

        function ansQnController() {
            var self = this;
            this.answer = {};
            this.answerQn = function () {
                self.answer.createdAt = Date.now();
                self.answer.owner = {
                  publicId: currentUser.publicId,
                  gravatar: currentUser.gravatar,
                  displayName: currentUser.displayName
                };
                clmDataStore.events.questions.answers.postAnswer(eventId, questionId, self.answer)
                    .then(function (answer) {
                        var ref = db.ref(`classMentors/eventQuestions/${eventId}/questions/${questionId}/respondedBy/${answer.key}`);
                        ref.set(self.answer.createdAt);
                    })
                    .then(spfAlert.success("Successfully posted your response"))
                    .then($mdDialog.hide())
                    .catch(function () {
                        spfAlert.error("Failed to post your response");
                    });
                clmDataStore.logging.inputLog({
                    action: "respondToQuestion",
                    questionId: questionId,
                    publicId: currentUser.publicId,
                    eventId: eventId,
                    timestamp: self.answer.createdAt
                });
            };
            this.closeDialog = function() {
                $mdDialog.hide();
            };
        }
    }
}

oneQnController.$inject = ['initialData', 'spfNavBarService', 'urlFor', 'firebaseApp', 'spfAlert', '$firebaseObject', '$document', 'clmDataStore', '$mdDialog'];

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
        .when(routes.oneQuestion, {
            template: oneQn,
            controller: oneQnController,
            controllerAs: 'ctrl',
            resolve: {initialData: oneQnResolver}
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

function oneQnResolver($q, spfAuth, spfAuthData, clmDataStore, $route) {
    var eventId = $route.current.params.eventId;
    var questionId = $route.current.params.questionId;
    return $q.all({
        auth: spfAuth.$loaded(),
        currentUser: spfAuthData.user().catch(function(error) {
            return error;
        }),
        event: clmDataStore.events.get(eventId),
        question: clmDataStore.events.questions.getQuestion(eventId, questionId),
        answers: clmDataStore.events.questions.answers.allRef(eventId, questionId)
    });
}
oneQnResolver.$inject = ['$q', 'spfAuth', 'spfAuthData', 'clmDataStore', '$route'];
