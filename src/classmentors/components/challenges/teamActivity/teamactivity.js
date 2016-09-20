import teamActivityCreateTmpl from './team-view-create.html!text';
import teamIRATTmpl from './teamactivity-view-irat-start.html!text';
import teamTRATTmpl from './teamactivity-view-trat-start.html!text';
import teamFormationTmpl from './teamactivity-view-teamFormation.html!text';
import './teamActivity.css!';


function startTRATInitialData($q, spfAuthData, eventService, clmDataStore, quizFactory){
    /*
    TODO:
    1. Load Teams
    2. Load Team Log
    3. Load Answers [done]
    */
    var data =  eventService.get();
    console.log("my data is:", data);
    return $q.all ({
        currentUser: spfAuthData.user(),
        answers: clmDataStore.events.getTaskAnswers(data.eventId, data.task.taskFrom),
        getProgress: clmDataStore.events.getProgress(data.eventId)
    }).then (function (result){
        return {
            data: data,
            correctAnswers: result.answers,
            currentUser: result.currentUser,
            progress: result.getProgress
        }
    });


}
startTRATInitialData.$inject = ['$q','spfAuthData', 'eventService','clmDataStore', 'quizFactory']

function createTeamActivityInitialData($q, eventService, clmDataStore) {
    var data = eventService.get();
    console.log("team data is:", data);

    return clmDataStore.events.participants(data.event.$id).then (
        function (result){
            return{
                data: data,
                participants: result
            }
        }
    )
}
createTeamActivityInitialData.$inject = ['$q', 'eventService', 'clmDataStore'];

function createTeamActivityController($q, initialData, clmDataStore, $location, urlFor,eventService){
    var self = this;

    console.log("initialdata are",initialData);
    // event variable consist of event id,timecreated,owner and event title
    self.event = initialData.data.event;

    //task variable consist of description,title of task, showProgress, priority, archived(t/f)
    self.task = initialData.data.task;

    self.taskType = initialData.data.taskType;

    self.participants = initialData.participants;
    self.teamsMaximumStudents = 0;
    self.taskType = initialData.data.taskType;
    self.activityType = null;
    self.newExistingTeams = null;
    self.teamFormationMethod = null;
    self.teamFormationParameter = null;

    
    self.submit = function(){
        self.task.activityType = self.activityType;
        self.task.newExistingTeams = self.newExistingTeams;
        self.task.teamFormationMethod = self.teamFormationMethod;
        self.task.teamFormationParameter = self.teamFormationParameter;
        self.task.startIRAT = true;
        self.event.teams = formTeams(self.teamFormationMethod, self.teamFormationParameter, self.participants.length);
        eventService.set({
            taskType: self.taskType,
            event: self.event,
            task: self.task,
            isOpen: initialData.data.isOpen
        })
        $location.path(urlFor('viewMcq'));
    }


    function formTeams(method, methodParameter, participants){
        var teams = [];
        var teamStructure = [];
        console.log('Total participants :', participants );
        if(method == 'noOfTeams'){
          //initialze teamStructure with team size of 0 each
          for(var i = 0; i < methodParameter; i++){
            teamStructure.push(0);
          }
          console.log('Line reaches here');
          console.log('teamStructure :', teamStructure);
          //add 1 to each team until there are no more participants left
          for(var i = 0; i < participants; i ++){
            teamStructure[i % methodParameter] += 1;
          }
        }else{//else by teamSize
           while (participants > methodParameter) {
             teamStructure.push(methodParameter);
             participants -= methodParameter;
           }
           // split up remaining participants
           for(var i = 0; i < participants; i ++){
             teamStructure[i % teamStructure.length] += 1;
           }
        }
        //Create 'teams'
        for(var i = 0; i < teamStructure.length; i ++){
          // teams[i] = populateTeam(teamStructure[i]);
          teams.push({
            maxSize: teamStructure[i],
            currentSize: 0
          });
        }
        console.log('Teams is: ', teams);
        return teams;
    }

    function populateTeam(members){
        var team = {}
        console.log(members);
        for(var i = 0; i < members; i++){
            team[i] = "";
        }
        console.log(angular.toJson(team));
        return team;
    }
    // if number of teams, "Each team will have a maximum enrollment of # students"; #= roundup (totalParticipants / # of teams)
    // if max number of student, "You will have # teams"; #= round up (totalParticipants / # stud per team)
    self.calculateTeamMaximumStudent = function (noTeamsOrStudents){
        // var noTeamsOrStudents = self.teamFormationInput;
        var totalParticipants = self.participants.length;

        console.log("number is ", noTeamsOrStudents);
        console.log("cal", Math.ceil(totalParticipants / noTeamsOrStudents) );
        self.teamsMaximumStudents = Math.ceil(totalParticipants / noTeamsOrStudents) ? Math.ceil(totalParticipants / noTeamsOrStudents):0 ;

    }

    self.calculationResult = function (){
        
        return self.teamsMaximumStudents;
    }

}
createTeamActivityController.$inject = [
    '$q', 
    'initialData', 
    'clmDataStore',
    '$location',
    'urlFor',
    'eventService'
    ];

function startTRATController($q, initialData, clmDataStore, $location, urlFor, quizFactory,
        firebaseApp, $firebaseObject, $firebaseArray){
    //TODO: propagate all questions to the html page
    var self = this;
    self.index = 0;
    self.question = quizFactory.getQuestion(self.index);
    self.options = self.question.options;
    var db = firebaseApp.db();
    // var eventSolRef =
    console.log("length of data:", initialData.data);
    // var questions = angular.fromJson(initialData.data.task.mcqQuestions);
    // self.question = questions[self.index];
    // self.options =  self.question.options;


    //self.options = angular.fromJson(initialData.data.task.)
    // console.log("initial Data for trat:", questions[0].options);
    /*TODO:
    1. Decide who answers the questions
    2. Load log
    3. Insert things into log
    */
    this.teamLog = (function(){

    })();

    this.submitTrat = function(){
        $location.path(urlFor('oneEvent'));
    }
    this.nextQuestion = function(){
        console.log("next question has been clicked");
        self.index = self.index + 1;
        self.question = quizFactory.getQuestion(self.index);
        self.options = self.question.options;

    }
}

startTRATController.$inject = [
    '$q',
    'initialData',
    'clmDataStore',
    '$location',
    'urlFor',
    'quizFactory',
    'firebaseApp',
    '$firebaseObject',
    '$firebaseArray'
]
export {
    teamActivityCreateTmpl,
    createTeamActivityInitialData,
    createTeamActivityController,
    teamIRATTmpl,
    startTRATController,
    teamTRATTmpl,
    teamFormationTmpl,
    startTRATInitialData

};
// startIRATController,
// export function teamActivityCreateView(){
//   return teamActivityCreateTmpl;
// }
