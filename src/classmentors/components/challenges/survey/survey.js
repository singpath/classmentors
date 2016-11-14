/**
 * Created by Kuan Yong on 22/7/2016.
 */
import surveyTmpl from './survey-view-survey.html!text';
import schEngagePreview from './schengage-view-preview.html!text';
import motiStratPreview from './motistrat-view-preview.html!text';
import eduDissPreview from './edudiss-view-preview.html!text';

const noop = () => undefined;
function showPreviewInitialData($q, $location, $route, firebaseApp, $firebaseArray, spfAuthData, clmDataStore) {
    var db = firebaseApp.database();
    var errNoEvent = new Error('Event not found');
    var eventId = $route.current.params.eventId;

    var profilePromise = clmDataStore.currentUserProfile().catch(noop);

    var eventPromise = clmDataStore.events.get(eventId).then(function (event) {
        if (event.$value === null) {
            return $q.reject(errNoEvent);
        }
        return event;
    });

    var canviewPromise = $q.all({
        event: eventPromise,
        profile: profilePromise
    }).then(function (data) {
        return $q.when(data.profile && data.profile.canView(data.event));
    });


    //returns a promise object from firebase
    var surveyRef = db.ref('classMentors/surveyTemplate');
    var survey = $firebaseArray(surveyRef);

    return $q.all({
        currentUser: spfAuthData.user().catch(noop),
        profile: profilePromise,
        event: eventPromise,
        canView: canviewPromise,
        survey2: survey.$loaded().then(function () {
            return survey;
        }),
        tasks: canviewPromise.then(function (canView) {
            if (canView) {
                return clmDataStore.events.getTasks(eventId);
            }
        }),
        participants: canviewPromise.then(function (canView) {
            if (canView) {
                return clmDataStore.events.participants(eventId);
            }
        }),
        progress: canviewPromise.then(function (canView) {
            if (canView) {
                return clmDataStore.events.getProgress(eventId);
            }
        }),
        solutions: canviewPromise.then(function (canView) {
            if (canView) {
                return clmDataStore.events.getSolutions(eventId);
            }
        })
    });
}
showPreviewInitialData.$inject = ['$q', '$location', '$route', 'firebaseApp', '$firebaseArray', 'spfAuthData', 'clmDataStore'];

function showPreviewController(spfNavBarService, $location, urlFor, initialData, $routeParams, clmDataStore, clmPagerOption, spfAlert, $scope, firebase, $route) {
    var self = this;
    var eventId = $route.current.params.eventId;
    var getTask = JSON.parse($route.current.params.task);
    var eventTitle = $route.current.params.eventTitle;

    spfNavBarService.update(
        getTask.title, [{
            title: 'Events',
            url: `#${urlFor('events')}`
        }, {
            title: eventTitle,
            url: `#${urlFor('oneEvent', {eventId: eventId})}`
        }, {
            title: 'Challenges',
            url: `#${urlFor('editEvent', {eventId: eventId})}`
        }]
    );


    this.questions = initialData.survey2;
    this.ratingOptions = [
        {id: 1},
        {id: 2},
        {id: 3},
        {id: 4},
        {id: 5},
        {id: 6},
        {id: 7}
    ];


    if ($routeParams.surveyType === 'School engagement scale') {


        self.responseRating = [
            {option: 'Never'},
            {option: 'On Occasion'},
            {option: 'Some of the Time'},
            {option: 'Most of the Time'},
            {option: 'All of the Time'}
        ];

        self.schEngageResp = {};

    }

    if ($routeParams.surveyType == 'Motivated strategies for learning') {

        self.questionsArr = [];
        for (let i = 1; i < Object.keys(initialData.survey2[1]).length - 1; i++) {
            //console.log("testing: ", initialData.survey2[1]["Q" + i]);
            self.questionsArr.push({'name': initialData.survey2[1]["Q" + i], 'qnid': i});
        }

        self.motiResp = {};

    }

    if ($routeParams.surveyType === 'Education vs Dissatisfaction with learning') {
        this.familyMembers = [
            {name: 'Father'},
            {name: 'Mother'},
            {name: 'Sister(s)'},
            {name: 'Brother(s)'},
            {name: 'Relative(s)'},
            {name: 'Grandparent(s)'}
        ];
        this.selectedFamily = [];
        this.selectedRaceEthnicity = [];

        this.toggle = function (item, list) {
            var idx = list.indexOf(item);
            if (idx > -1) {
                list.splice(idx, 1);
            }
            else {
                list.push(item);
            }
            return list
        };

        this.exists = function (item, list) {
            return list.indexOf(item) > -1;
        };

        this.bdayMonth = [
            {month: 'January'},
            {month: 'February'},
            {month: 'March'},
            {month: 'April'},
            {month: 'May'},
            {month: 'June'},
            {month: 'July'},
            {month: 'August'},
            {month: 'September'},
            {month: 'October'},
            {month: 'November'},
            {month: 'December'}
        ];

        this.ethnicity = [
            {firstRow: 'White'},
            {firstRow: 'African American'},
            {firstRow: 'Hispanic/Latino'},
            {secondRow: 'Asian'},
            {secondRow: 'Native Hawaii/Pacific Islander'},
            {secondRow: 'Other'}
        ];

        this.eduDissResp = {};
        this.questionJson = {};
        // console.log("this initialdata is", initialData.survey2[0]);
        //console.log("initial data before: ", initialData.survey2[0]);
        for (let i = 1; i < Object.keys(initialData.survey2[0]).length - 1; i++) {

            this.eduDissResp[initialData.survey2[0][i].title] = {};

        }
    }

    self.back = function(){
        $location.path('/challenges/survey/' + eventTitle +'/' + eventId + '/' + JSON.stringify(getTask));
    };

}
showPreviewController.$inject = ['spfNavBarService', '$location', 'urlFor', 'initialData', '$routeParams',
    'clmDataStore', 'clmPagerOption', 'spfAlert', '$scope', 'firebase', '$route'];

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