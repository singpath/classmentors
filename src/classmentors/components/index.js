import module from 'classmentors/module.js';

import * as app from './classmentors/classmentors.js';
import * as ace from './ace/ace.js';
import * as events from './events/events.js';
import * as profiles from './profiles/profiles.js';
import * as cohort from './cohort/cohort.js';

module.component('classmentors', app.component);
module.component('ace', ace.component);
module.component('cohort', cohort.component);

module.directive('clmProfile', profiles.clmProfileFactory);
module.directive('clmSpfProfile', profiles.clmSpfProfileFactory);
module.directive('clmServiceUserIdExists', profiles.clmServiceUserIdExistsFactory);
module.directive('clmEventTable', events.clmEventTableFactory);
module.directive('clmEventRankTable', events.clmEventRankTableFactory);
module.directive('clmPager', events.clmPagerFactory);

module.constant('aceStatsUrl', ace.ACE_STATS_URL);
module.factory('aceStats', ace.factory);
module.factory('clmRowPerPage', events.clmRowPerPageFactory);
module.factory('clmPagerOption', events.clmPagerOptionFactory);

module.config(ace.configRoute);
module.config(events.configRoute);
module.config(profiles.configRoute);
module.config(cohort.configRoute);
