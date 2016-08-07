
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

export function startMcqController(initialData, challengeService, clmDataStore, $location, $mdDialog,urlFor ){
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

  self.toggleOption = function(question, itemIndex){
    if(question.answers.indexOf(itemIndex) != -1){
      var removed = question.answers.splice(itemIndex,1);
      console.log(removed);

    }else{
      question.answers.push(itemIndex);
    }
  }

  self.discardChanges = function (ev){
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
      $location.path(urlFor('oneEvent', {eventId: eventId}));

    })
  }

}

startMcqController.$inject = [
  'initialData',
  'challengeService',
  'clmDataStore',
  '$location',
    '$mdDialog',
    'urlFor'
];

export function newMcqController(initialData, challengeService, $filter,$mdDialog){
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
  }];

  // Save mcq question to database.

  //todo: clean up the form before submitting. e.g. when toggled, vid entered, but toggled off
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
      ]
    }

    // Push new question object into questions list
    self.questions.push(question);
  }

  self.removeQuestion = function(ev,itemIndex) {

    var confirm = $mdDialog.confirm()
        .title('Would you like to delete this question?')
        .textContent('This question and its option(s) will be deleted. Do you wish to proceed?')
        .ariaLabel('Question deletion')
        .targetEvent(ev)
        .ok('Delete')
        .cancel('Do not delete');
    $mdDialog.show(confirm).then(function() {
      if(itemIndex > -1){
        var removed = self.questions.splice(itemIndex,1);
        console.log('Removed : ', removed);
        console.log(self.questions);
      }
    });
  };

  // Functionality for toggleOption between single answer and multi ans functionality
  // Needs further review though..
  // Is it better to set the answers as default multiple and the users will just set 1..n answers?
  self.toggleOption = function(question, itemIndex){
    if(question.answers.indexOf(itemIndex) != -1){
      var removed = question.answers.splice(itemIndex,1);
      console.log(removed);

    }else{
      question.answers.push(itemIndex);
    }

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
  '$filter',
  '$mdDialog'
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