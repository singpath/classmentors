
//TODO: Add imports
import mcqTmpl from './mcq-view-mcq.html!text';
import mcqEditTmpl from './mcq-view-mcq-edit.html!text';
import mcqStart from './mcq-view-start.html!text';

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

export function startMcqController(initialData, challengeService, clmDataStore, $location){
  var self = this;
  var data = initialData;
  var eventId = data.eventId;
  var taskId = data.taskId;
  var participant = data.participant;
  self.task = data.task;
  var quesFromJson = angular.fromJson(self.task.mcqQuestions);
  self.questions = loadQuestions(quesFromJson);

  function loadQuestions(quesFromJson){
    for(var i = 0; i < quesFromJson.length; i++){
      quesFromJson[i].answers = [];
    }
    return quesFromJson;
  };

  self.submit = function(){
    var userAnswers = [];
    for(var i = 0; i < self.questions.length; i++){
      userAnswers.push(self.questions[i].answers);
    }
    var answerString = angular.toJson(userAnswers);
    console.log(answerString);
    clmDataStore.events.submitSolution(eventId, taskId, participant.$id, answerString);
    $location.path('/events/'+eventId);
  }

  console.log(self.questions);

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

}

startMcqController.$inject = [
  'initialData',
  'challengeService',
  'clmDataStore',
  '$location'
];

export function newMcqController(initialData, challengeService, $filter){
  var self = this;
  self.task = initialData.task;
  self.questions = [{
    text:"",
    answers:[],
    options:[
      {
        text:""
      }
    ]

    // prob wont need this
    // ,
    // singleAns: false

  }];

  // Save mcq question to database.
  self.save = function(questions){
    var setAnswers = [];

    for(var i = 0; i < questions.length; i ++){
      var answers = questions[i].answers;
      setAnswers.push(answers)
      delete questions[i].answers;
    }

    // Check does questions contain answers?
    console.log(questions);

    // Check answer list
    console.log(setAnswers);

    // Change questions into JSON text
    var answersJsonText = angular.toJson(questions);
    console.log(answersJsonText);

    // Save function defined in challenges.js
    // Parameters: event, taskid, task, taskType, isOpen
    var event = initialData.event;
    var task = initialData.task;
    var taskId = task.taskId;
    var taskType = initialData.taskType;
    var isOpen = initialData.isOpen;
    task.mcqQuestions = answersJsonText;
    task.answers = angular.toJson(setAnswers);
    console.log(task)
    challengeService.save(event, taskId, task,taskType, isOpen);
  }

  // Add question when add question button is clicked
  self.addQuestion = function(){
    var question = {
      text:"",
      answers:[],
      options:[
        {
          text:""
        }
      ],
      singleAns: false
    }

    // Push new question object into questions list
    self.questions.push(question);
  }

  // Functionality for delete question.
  self.removeQuestion = function(itemIndex){
    if(itemIndex > -1){
      var removed = self.questions.splice(itemIndex,1);
      console.log('Removed : ', removed);
      console.log(self.questions);
    }

  }

  // Functionality for toggleOption between single answer and multi ans functionality
  // Needs further review though..
  // Is it better to set the answers as default multiple and the users will just set 1..n answers?
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

  // Used to clear answers whenever users change between single ans and multi ans mode
  self.clearAnswers = function(question){
    question.answers = [];
  }

  // Add new option to question
  self.addOption = function (question) {
    // Get options
    question.options.push({
      text:""
    });
  }

  // Delete options
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
  'challengeService',
  '$filter'
];

export function starMcqTmpl() {
  return mcqStart;
}
//this export function return the template when creating a new mcq challenge
export function newMcqTmpl(){
    return mcqTmpl;
}

export function editMcqTmpl(){
    return mcqEditTmpl;
}


//TODO: enable user to edit mcq