/**
 * Created by Kuan Yong on 22/7/2016.
 */
import surveyTmpl from './survey-view-survey.html!text';
import schEngagePreview from './schengage-view-preview.html!text';
import motiStratPreview from './motistrat-view-preview.html!text';
import eduDissPreview from './edudiss-view-preview.html!text';

function showPreviewInitialData($q, $location, $route) {
    console.log("showpreview reaches here");
}
showPreviewInitialData.$inject = ['$q', '$location', '$route'];

function showPreviewController(initialData, $q, $location, $route) {

}
showPreviewController.$inject = ['initialData', '$q', '$location', '$route'];

export function showSurveyTmpl() {
    return surveyTmpl;
}

export{
    showPreviewInitialData,
    showPreviewController,
    schEngagePreview,
    motiStratPreview,
    eduDissPreview
};