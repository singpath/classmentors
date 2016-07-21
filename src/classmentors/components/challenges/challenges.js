/**
 * Created by AMOS on 10/7/16.
 */


//TODO: Add various imports for challenge(s)
import * as mcq from './mcq/mcq.js';
import * as survey from './survey/survey.js';


//TODO: Add config for routing to various challenges
export function configRoute($routeProvider, routes) {
    $routeProvider
        .when(routes.viewMcq, {
            template: mcq.showTmpl

        })
        .when(routes.viewSurvey, {
            template: survey.showSurveyTmpl,
            controller: surveyFormEvent,
            controllerAs: 'ctrl',
            resolve: {
                initialData: getTaskSurveyValues
            }
        });

    console.log('kuanyong testing');


}

configRoute.$inject = ['$routeProvider', 'routes'];

//TODO: Clarify what should and should not be a component
// export const component = {
//
// }
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
        //console.log('What is survey? ', surveyType);
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


