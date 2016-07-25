
//TODO: Add imports
import mcqTmpl from './mcq-view-mcq.html!text';
import mcqEditTmpl from './mcq-view-mcq-edit.html!text';

const noop = () => undefined;

function mcqQuestionFactory(){
  var self = this;
  self.questions = {
    list:[],

  }
  return {
    create: function(){

    }
  }
}

//TODO: implement logic for creating of mcq question

export function newMcqController(initialData, challengeService){
  // this.data = eventService.get();
  var self = this;
  // self.data = initialData.data;
  // self.task = {
  //   title: initialData.title,
  //   description: initialData.desc
  // }
  self.test = challengeService.save;
  self.questions = [{
    id: 0,
    text:"",
    options:[
      {
        id:0,
        text:""
      }
    ]

  }];

  self.addQuestion = function(){
    var question = {

      options:[]
    }
    self.questions.push(question);
    console.log('Length of questions, ', self.questions.length);
  }

  self.removeQuestion = function(itemIndex){
    if(itemIndex > -1){
      var removed = self.questions.splice(itemIndex,1);
      console.log('Removed : ', removed);
      console.log(questions);
    }
  }

  self.addOption = function () {

  }

  self.removeOption = function () {

  }



}
newMcqController.$inject = [
  'initialData',
  'challengeService'
];

//this export function return the template when creating a new mcq challenge
export function newMcqTmpl(){
    return mcqTmpl;
}

export function editMcqTmpl(){
    return mcqEditTmpl;
}


//TODO: implement logic for rendering of mcq questions