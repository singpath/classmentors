import tmpl from './classmentors-view.html!text';
import './classmentors.css!';

export const component = {
    template: tmpl,
    controller: sideNavController,
    controllerAs: 'ctrl'
};

function sideNavController() {
    this.navAceOfCoders = {};
    this.navCohorts = {};
    this.navEvents = {};
    this.navProfile = {};
    this.navFeedback = {};
    this.navQQ = {};


    this.navClick = function (navStyle) {
        if (navStyle == 'navAceOfCoders') {
            this.navAceOfCoders = {
                'background-color': '#CDCDCD'
            };
            this.navCohorts = {};
            this.navEvents = {};
            this.navProfile = {};
            this.navFeedback = {};
            this.navQQ = {};
        } else if (navStyle == 'navCohorts') {
            this.navAceOfCoders = {};
            this.navCohorts = {
                'background-color': '#CDCDCD'
            };
            this.navEvents = {};
            this.navProfile = {};
            this.navFeedback = {};
            this.navQQ = {};
        } else if (navStyle == 'navEvents') {
            this.navEvents = {
                'background-color': '#CDCDCD'
            };
            this.navCohorts = {};
            this.navAceOfCoders = {};
            this.navProfile = {};
            this.navFeedback = {};
            this.navQQ = {};
        } else if (navStyle == 'navProfile') {
            this.navProfile = {
                'background-color': '#CDCDCD'
            };
            this.navEvents = {};
            this.navCohorts = {};
            this.navAceOfCoders = {};
            this.navFeedback = {};
            this.navQQ = {};
        } else if (navStyle == 'navFeedback') {
            this.navFeedback = {
                'background-color': '#CDCDCD'
            };
            this.navProfile = {};
            this.navEvents = {};
            this.navCohorts = {};
            this.navAceOfCoders = {};
            this.navQQ = {};
        } else if (navStyle == 'navQQ') {
            this.navQQ = {
                'background-color': '#CDCDCD'
            };
            this.navFeedback = {};
            this.navProfile = {};
            this.navEvents = {};
            this.navCohorts = {};
            this.navAceOfCoders = {};

        }

    }

};

export{
    sideNavController
}