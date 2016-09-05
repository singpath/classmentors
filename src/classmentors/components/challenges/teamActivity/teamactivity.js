import teamActivityCreateTmpl from './team-view-create.html!text';
import teamIRATTmpl from './teamactivity-view-irat-start.html!text';
import teamTRATTmpl from './teamactivity-view-trat-start.html!text';

function createTeamActivityInitialData($q, eventService, clmDataStore) {
    var data = eventService.get();
    console.log("team data is:", data);
    return data;
}
createTeamActivityInitialData.$inject = ['$q', 'eventService', 'clmDataStore'];

function createTeamActivityController($q, initialData, clmDataStore){
    var self = this;

    // console.log(initialData);

    // event variable consist of event id,timecreated,owner and event title
    self.event = initialData.event;

    //task variable consist of description,title of task, showProgress, priority, archived(t/f)
    self.task = initialData.task;

    self.taskType = initialData.taskType;

}
createTeamActivityController.$inject = ['$q', 'initialData', 'clmDataStore'];


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
    startIRATController,
    teamIRATTmpl,
    startTRATController,
    teamTRATTmpl

};
// export function teamActivityCreateView(){
//   return teamActivityCreateTmpl;
// }