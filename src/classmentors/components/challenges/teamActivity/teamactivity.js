import teamActivityCreateTmpl from './team-view-create.html!text';
import teamIRATTmpl from './teamactivity-view-irat-start.html!text';

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

function createTeamActivityController($q, initialData, clmDataStore,$scope){
    var self = this;

    console.log("initialdata are",initialData);

    // event variable consist of event id,timecreated,owner and event title
    self.event = initialData.data.event;

    //task variable consist of description,title of task, showProgress, priority, archived(t/f)
    self.task = initialData.data.task;

    self.taskType = initialData.data.taskType;

    self.participants = initialData.participants;

    var teamsMaximumStudents = 0;

    // if number of teams, "Each team will have a maximum enrollment of # students"; #= roundup (totalParticipants / # of teams)
    // if max number of student, "You will have # teams"; #= round up (totalParticipants / # stud per team)
    $scope.calculateTeamMaximumStudent = function (noTeamsOrStudents){
        // var noTeamsOrStudents = $scope.teamFormationInput;
        var totalParticipants = self.participants.length;

        console.log("number is ",noTeamsOrStudents);

        console.log("cal",Math.ceil(totalParticipants/noTeamsOrStudents) );
        teamsMaximumStudents = Math.ceil(totalParticipants/noTeamsOrStudents) ? Math.ceil(totalParticipants/noTeamsOrStudents):0 ;

    }

    $scope.calculationResult = function (){
        console.log("t", teamsMaximumStudents);

        return teamsMaximumStudents;
    }

}
createTeamActivityController.$inject = ['$q', 'initialData', 'clmDataStore','$scope'];


function startIRATController($q, initialData, clmDataStore, $location, urlFor) {
    //todo: implement irat logic here


    this.submitIrat = function(){
        console.log("i come in here");
        $location.path(urlFor('oneEvent'));
    };
}

startIRATController.$inject = [
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
    startIRATController,
    teamIRATTmpl
};
// export function teamActivityCreateView(){
//   return teamActivityCreateTmpl;
// }