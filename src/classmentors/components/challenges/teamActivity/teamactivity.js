import teamActivityCreateTmpl from './team-view-create.html!text';
import teamIRATTmpl from './teamactivity-view-irat-start.html!text';

function createTeamActivityInitialData($q, eventService, clmDataStore) {
    var data = eventService.get();
    console.log("team data is:", data);
    return data;
}
createTeamActivityInitialData.$inject = ['$q', 'eventService', 'clmDataStore'];

function createTeamActivityController($q, initialData, clmDataStore) {

}
createTeamActivityController.$inject = ['$q', 'initialData', 'clmDataStore']


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