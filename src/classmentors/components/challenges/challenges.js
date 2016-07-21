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
            controllerAs: 'ctrl'
        });

    //console.log('kuanyong testing');


}

configRoute.$inject = ['$routeProvider', 'routes'];

//TODO: Clarify what should and should not be a component
// export const component = {
//
// }
function surveyFormEvent($scope) {
    $scope.surveys = [
        {id: 1, name: 'Education vs Dissatisfaction with learning'},
        {id: 2, name: 'Motivated strategies for learning'},
        {id: 3, name: 'School engagement scale'}

    ];
    //TODO: retrieve selected value, add task into firebase by calling the function
}
surveyFormEvent.$inject = ['$scope'];