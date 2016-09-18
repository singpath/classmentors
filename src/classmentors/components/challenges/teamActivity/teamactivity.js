import teamActivityCreateTmpl from './team-view-create.html!text';
import teamIRATTmpl from './teamactivity-view-irat-start.html!text';
import teamTRATTmpl from './teamactivity-view-trat-start.html!text';
import teamFormationTmpl from './teamactivity-view-teamFormation.html!text';

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

function startTRATController($q, initialData, clmDataStore, $location, urlFor){
    this.submitTrat = function(){
        $location.path(urlFor('oneEvent'));
    }
}

startTRATController.$inject = [
    '$q',
    'initialData',
    'clmDataStore',
    '$location',
    'urlFor'
]
export {
    teamActivityCreateTmpl,
    createTeamActivityInitialData,
    createTeamActivityController,
    teamIRATTmpl,
    startTRATController,
    teamTRATTmpl,
    teamFormationTmpl

};
// startIRATController,
// export function teamActivityCreateView(){
//   return teamActivityCreateTmpl;
// }
