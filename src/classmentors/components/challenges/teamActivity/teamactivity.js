import teamActivityCreateTmpl from './team-view-create.html!text';

function createTeamActivityInitialData($q, eventService, clmDataStore){
    var data = eventService.get();
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

export {
  teamActivityCreateTmpl,
  createTeamActivityInitialData,
  createTeamActivityController
};
// export function teamActivityCreateView(){
//   return teamActivityCreateTmpl;
// }