import teamActivityCreateTmpl from './team-view-create.html!text';

function createTeamActivityInitialData($q, eventService, clmDataStore){
    var data = eventService.get();
    return data;
}
createTeamActivityInitialData.$inject = ['$q', 'eventService', 'clmDataStore'];

function createTeamActivityController($q, initialData, clmDataStore){

}
createTeamActivityController.$inject = ['$q', 'initialData', 'clmDataStore']

export {
  teamActivityCreateTmpl,
  createTeamActivityInitialData,
  createTeamActivityController
};
// export function teamActivityCreateView(){
//   return teamActivityCreateTmpl;
// }