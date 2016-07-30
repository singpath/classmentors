/**
 * Created by AMOS on 10/7/16.
 */


//TODO: Add various imports for challenge(s)
import * as mcq from './mcq/mcq.js';
import * as survey from './survey/survey.js';

//TODO: Add config for routing to various challenges
export function configRoute($routeProvider, routes){
    $routeProvider
        .when(routes.viewMcq, {
            template: mcq.showTmpl,
            controllerAs: 'ctrl',
            template: mcq.newMcqTmpl,
            controller: mcq.newMcqController,
            controllerAs: 'ctrl'
        })

        .when(routes.editMcq, {
            template: mcq.editMcqTmpl,
            controller: editCtrl,
            controllerAs: 'ctrl'


        })

        .when(routes.viewSurvey, {
            template: survey.showSurveyTmpl,
            controller: surveyFormEvent,
            controllerAs: 'ctrl',
            resolve: {
                initialData: getTaskSurveyValues
            }
        });

}
configRoute.$inject = ['$routeProvider', 'routes'];

//TODO: Generic save function
export function challengeServiceFactory
  ($q, $route, spfAuthData, clmDataStore, spfFirebase, $log, spfAlert, $location, urlFor){
  return {
    save : function(event, _, task, taskType, isOpen) {
      var copy = spfFirebase.cleanObj(task);
      if (taskType === 'linkPattern') {
        delete copy.badge;
        delete copy.serviceId;
        delete copy.singPathProblem;
      } else if (copy.serviceId === 'singPath') {
        delete copy.badge;
        if (copy.singPathProblem) {
          copy.singPathProblem.path = spfFirebase.cleanObj(task.singPathProblem.path);
          copy.singPathProblem.level = spfFirebase.cleanObj(task.singPathProblem.level);
          copy.singPathProblem.problem = spfFirebase.cleanObj(task.singPathProblem.problem);
        }
      }else if (taskType === 'multipleChoice'){
        delete copy.singPathProblem;
        delete copy.badge;
        copy.mcqQuestions = 'test';
      } else {
        delete copy.singPathProblem;
        copy.badge = spfFirebase.cleanObj(task.badge);
      }

      if (!copy.link) {
        // delete empty link. Can't be empty string
        delete copy.link;
      }

      self.creatingTask = true;
      clmDataStore.events.addTask(event.$id, copy, isOpen)
        .then(function() {
          console.log('FAILS!');
          spfAlert.success('Task created');
          $location.path(urlFor('editEvent', {eventId: event.$id}));
        }).catch(function(err) {
            $log.error(err);
            spfAlert.error('Failed to created new task');
        }).finally(function() {
            self.creatingTask = false;
        });
    }
  }
}
challengeServiceFactory.$inject =
    ['$q', '$route', 'spfAuthData', 'clmDataStore', 'spfFirebase', '$log', 'spfAlert', '$location', 'urlFor'];

// export const component = {
//
// }


// this function controls the view behaviours
function viewCtrl ($mdDialog,$location,urlFor, $scope){
    this.isSingleAnswer = false;

    //this function double checks with user if he wishes to go back and discard all changes thus far
    this.discardChanges = function (ev,task){
        var confirm = $mdDialog.confirm()
            .title('Would you like to discard your changes?')
            .textContent('All of the information input will be discarded. Are you sure you want to continue?')
            .ariaLabel('Discard changes')
            .targetEvent(ev)
            .ok('Discard All')
            .cancel('Do Not Discard');
        $mdDialog.show(confirm).then(function() {
            // decided to discard data, bring user to previous page

            //todo: link back to previous page
            //$location.path(urlFor('editEvent', {eventId: self.event.$id}));

        }), function() {
            //go back to the current page
            //todo: preserve the data that was keyed into form. (data should not be saved into the db yet)
            //eg. this.task.title = task.title

        };
    }

    // to add/delete questions and options

    //options
    var count_o_id = 1;

    //questions
    var count_q_id = 1;

    $scope.questions =[{
        id: count_q_id++,
        text: '',
        isSingleAnswer: false,
        options: [{
            id: count_o_id++,
            text: ''
        }]
    }]

    $scope.addQuestion = function(){
        $scope.questions.push({
            id: count_q_id++,
            text: '',
            isSingleAnswer: false,
            options: [{
                id: count_o_id++,
                text: ''
            }]
        });
    }

    $scope.removeQuestion = function(index){
        $scope.questions.splice(index,1);
    }

    $scope.addOption = function(question){
        question.options.push({
            id:count_o_id++,
            text: ''
        });
    }

    $scope.removeOption = function(question,index){
        question.options.splice(index,1);
    }

}


//inject viewctrl
viewCtrl.$inject = [
    '$mdDialog',
    '$location',
    'urlFor',
    '$scope'
];

function editCtrl (){
    console.log("hello. this is edit ctl");
};

function surveyFormEvent($scope, clmSurvey, spfFirebase, clmDataStore, $log, spfAlert, $location, urlFor) {

    this.surveys = [
        {id: 1, name: 'Education vs Dissatisfaction with learning'},
        {id: 2, name: 'Motivated strategies for learning'},
        {id: 3, name: 'School engagement scale'}

    ];
    //TODO: retrieve selected value, add task into firebase
    var sharedData = clmSurvey.get();
    //console.log("surveyFormEvent eventId : " + sharedData.taskType);
    var getTask = sharedData.task;
    var self = this;
    /////////
    this.saveSurveyTask = function (surveyType) {
        var copy = spfFirebase.cleanObj(getTask);
        console.log('my copy is ', copy);
        if (sharedData.taskType === 'linkPattern') {
            delete copy.badge;
            delete copy.serviceId;
            delete copy.singPathProblem;
        } else if (copy.serviceId === 'singPath') {
            delete copy.badge;
            if (copy.singPathProblem) {
                copy.singPathProblem.path = spfFirebase.cleanObj(getTask.singPathProblem.path);
                copy.singPathProblem.level = spfFirebase.cleanObj(getTask.singPathProblem.level);
                copy.singPathProblem.problem = spfFirebase.cleanObj(getTask.singPathProblem.problem);
            }
        } else {
            delete copy.singPathProblem;
            copy.badge = spfFirebase.cleanObj(getTask.badge);
        }

        if (!copy.link) {
            // delete empty link. Can't be empty string
            delete copy.link;
        }

        self.creatingTask = true;
        console.log("survey type is " + surveyType);
        copy.survey = surveyType;
        clmDataStore.events.addTask(sharedData.eventId, copy, sharedData.isOpen).then(function () {
            spfAlert.success('Task created');
            $location.path(urlFor('editEvent', {eventId: sharedData.eventId}));
        }).catch(function (err) {
            $log.error(err);
            spfAlert.error('Failed to create new task');
        }).finally(function () {
            self.creatingTask = false;
        });
    };

}
surveyFormEvent.$inject = [
    '$scope',
    'clmSurvey',
    'spfFirebase',
    'clmDataStore',
    '$log',
    'spfAlert',
    '$location',
    'urlFor'
];


function getTaskSurveyValues(clmSurvey, $q, $route, spfAuthData, clmDataStore, spfAuth) {
    var sharedData = clmSurvey.get();

    var data = baseEditCtrlInitialData(sharedData, $q, $route, spfAuthData, clmDataStore, clmSurvey);
    if (data != null) {
        console.log("Data is not null!!!");
    } else {
        console.log("DATA IS NULLLL!!");
    }
    data.badges = clmDataStore.badges.all();
    data.singPath = $q.all({
        paths: clmDataStore.singPath.paths(),
        levels: [],
        problems: []
    });

    return $q.all(data);
}
getTaskSurveyValues.$inject = ['clmSurvey', '$q', '$route', 'spfAuthData', 'clmDataStore', 'spfAuth'];


function baseEditCtrlInitialData(sharedData, $q, $route, spfAuthData, clmDataStore, clmSurvey) {


    var sharedData = clmSurvey.get();
    //console.log("baseeditctrlinitialdata spfAuthData: " + sharedData.currentUser);
    var errNoEvent = new Error('Event not found');
    var errNotAuthaurized = new Error('You cannot edit this event');
    var eventId = $route.current.params.eventId;

    var eventPromise = clmDataStore.events.get(sharedData.eventId).then(function (event) {
        if (event.$value === null) {
            return $q.reject(errNoEvent);
        }
        return event;
    });

    var data = {
        currentUser: spfAuthData.user(),
        event: eventPromise
    };
    console.log("current user id: " + data.currentUser);
    data.canEdit = $q.all({
        currentUser: spfAuthData.user(),
        event: eventPromise
    }).then(function (result) {
        if (
            !result.currentUser.publicId || !result.event.owner || !result.event.owner.publicId ||
            result.event.owner.publicId !== result.currentUser.publicId
        ) {
            return $q.reject(errNotAuthaurized);
        }

        return result;
    });

    return data;
}