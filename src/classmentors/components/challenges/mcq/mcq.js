
//TODO: Add imports
import mcqTmpl from './mcq-view-mcq.html!text';
import mcqEditTmpl from './mcq-view-mcq-edit.html!text';

const noop = () => undefined;

//this export function return the template when creating a new mcq challenge
export function newMcqTmpl(){
    return mcqTmpl;
}

export function editMcqTmpl(){
    return mcqEditTmpl;
}

//TODO: implement logic for rendering of mcq questions

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

//testing
