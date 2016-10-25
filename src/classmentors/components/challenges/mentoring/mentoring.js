import mentorCreationTmpl from './mentor-create-view.html!text';

function createMentoringInitialData(){
    console.log("createMentoringInitial data came here");
}
createMentoringInitialData.$inject = [];

function createMentoringController(){
    console.log("mentoring controller reaches here");
}
createMentoringController.$inject = [];

export{
    createMentoringInitialData,
    createMentoringController,
    mentorCreationTmpl
};