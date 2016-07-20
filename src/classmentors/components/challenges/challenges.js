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
            controller: mcq.someController
        });

}
configRoute.$inject = ['$routeProvider', 'routes'];

//TODO: Generic save function
export function challengeServiceFactory
  ($q, $route, spfAuthData, clmDataStore, spfFirebase, $log, spfAlert){
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
      } else {
        delete copy.singPathProblem;
        copy.badge = spfFirebase.cleanObj(task.badge);
      }

      if (!copy.link) {
        // delete empty link. Can't be empty string
        delete copy.link;
      }

      self.creatingTask = true;
      clmDataStore.events.addTask(event.$id, copy, isOpen);
      console.log('FAILS!');
      // .then(function() {
    //   console.log('FAILS!');
    //   spfAlert.success('Task created');
    //   $location.path(urlFor('editEvent', {eventId: self.event.$id}));
    //       }).catch(function(err) {
    //         $log.error(err);
    //         spfAlert.error('Failed to created new task');
    //       }).finally(function() {
    //         self.creatingTask = false;
    //       });
    }
  }
}
challengeServiceFactory.$inject =
    ['$q', '$route', 'spfAuthData', 'clmDataStore', 'spfFirebase', '$log', 'spfAlert'];