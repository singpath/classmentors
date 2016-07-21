/**
 * Created by AMOS on 10/7/16.
 */


//TODO: Add various imports for challenge(s)
import * as mcq from './mcq/mcq.js';


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


        });

}
configRoute.$inject = ['$routeProvider', 'routes'];

//TODO: Generic save function
export function challengeServiceFactory
  ($q, $route, spfAuthData, clmDataStore, spfFirebase, $log, spfAlert, $location, urlFor){
  return {
    save : function(event, _, task, taskType, isOpen) {
      var copy = spfFirebase.cleanObj(task);
      console.log('COPY IS ... ', copy);
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
