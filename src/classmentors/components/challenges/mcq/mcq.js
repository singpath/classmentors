
//TODO: Add imports
import mcqTmpl from './mcq-view-mcq.html!text';
import mcqlEditTmpl from './mcq-view-mcq-edit.html!text';

const noop = () => undefined;

//TODO: implement logic for creating of mcq questions
export function showTmpl(){
    console.log('template is returned');
    return mcqTmpl;
}


//todo: amos to finish up config
/*export function configRoute($routeProvider, routes) {
    $routeProvider
        .when(routes.newMCQ, {
            template: mcqTmpl,
            controller: viewCtrl,
            controllerAs: 'ctrl',
            resolve: {
                initialData:
            }
        })
}*/

//inject config route
//configRoute.$inject = ['$routeProvider', 'routes'];

//TODO: implement logic for rendering of mcq questions

// this function controls the view behaviours
function viewCtrl ($mdDialog,$location,urlFor){
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
}

//inject viewctrl
viewCtrl.$inject = [
    '$mdDialog',
    '$location',
    'urlFor'
];