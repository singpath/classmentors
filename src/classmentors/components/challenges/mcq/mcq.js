
//TODO: Add imports
import mcqTmpl from './mcq-view-mcq.html!text';
import mcqEditTmpl from './mcq-view-mcq-edit.html!text';

const noop = () => undefined;


//TODO: implement logic for creating of mcq questions

export function newMcqController(eventService, challengeService){
  this.data = eventService.get();
  this.test = challengeService.save;
}
newMcqController.$inject = ['eventService', 'challengeService'];

//this export function return the template when creating a new mcq challenge
export function newMcqTmpl(){
    return mcqTmpl;
}

export function editMcqTmpl(){
    return mcqEditTmpl;
}


//TODO: implement logic for rendering of mcq questions