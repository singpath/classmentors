/**
 * Created by AMOS on 10/7/16.
 */

//TODO: Add imports
import mcqTmpl from './mcq-view-mcq.html!text';
import mcqlEditTmpl from './mcq-view-mcq-edit.html!text';


//TODO: implement logic for creating of mcq questions
export function showTmpl(){
    console.log('template is returned');
    return mcqTmpl;
}

export function someController(eventService){
    this.task = eventService.get();
}
someController.$inject = ['eventService'];
//TODO: implement logic for rendering of mcq questions