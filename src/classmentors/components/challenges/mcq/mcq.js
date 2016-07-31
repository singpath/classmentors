
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
    text:"",
    answers:[],
    options:[
      {
        text:"",
        isAns:false
      }
    ],
    singleAns: false

  }];

  self.addQuestion = function(){
    var question = {
      text:"",
      answers:[],
      options:[
        {
          text:"",
          isAns:false
        }
      ],
      singleAns: false
    }
    console.log('Added: ');
    console.log(question.id);
    self.questions.push(question);
    console.log('Length of questions, ', self.questions.length);
  }

  self.removeQuestion = function(itemIndex){
    if(itemIndex > -1){
      var removed = self.questions.splice(itemIndex,1);
      console.log('Removed : ', removed);
      console.log(self.questions);
    }
  }


  self.toggleOption = function(question, itemIndex, singleAns){
    if(question.answers.indexOf(itemIndex) != -1){
      var removed = question.answers.splice(itemIndex,1);
      console.log(removed);
    }else{
      if(singleAns){
        question.answers = [itemIndex];
      }else{
        question.answers.push(itemIndex);
      }
    }
  }
  self.clearAnswers = function(question){
    question.answers = [];
  }
  self.addOption = function (question) {
    // Get options
    question.options.push({
      text:"",
      isAns:false
    });
  }

  self.removeOption = function(question, itemIndex) {
    if(itemIndex > -1){
      var removed = question.options.splice(itemIndex,1);
      question.answers.splice(itemIndex,1);
      console.log('Removed : ', removed);
      console.log(question.options);
    }
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