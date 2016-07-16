/**
 * Created by AMOS on 10/7/16.
 */


//TODO: Add various imports for challenge(s)
import * as mcq from './mcq/mcq.js';


//TODO: Add config for routing to various challenges
export function configRoute($routeProvider, routes){
    $routeProvider
        .when(routes.viewMcq, {
            template: mcq.newMcqTmpl,
            controller: viewCtrl,
            controllerAs: 'ctrl'
            // resolve: {
            //     initialData:
            // }
        })

        .when(routes.editMcq, {
            template: mcq.editMcqTmpl,
            controller: editCtrl,
            controllerAs: 'ctrl'
            // resolve: {
            //     initialData:
            // }
        });

}

configRoute.$inject = ['$routeProvider', 'routes'];

//TODO: Clarify what should and should not be a component
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
