'use strict';

import {classMentors} from 'classmentors/module.js';

import * as app from './classmentors/classmentors.js';
import * as ace from './ace/ace.js';
import './events/events.js';
import './profiles/profiles.js';

classMentors.component('classmentors', app.component);
classMentors.component('ace', ace.component);

classMentors.constant('aceStatsUrl', ace.ACE_STATS_URL);
classMentors.factory('aceStats', ace.factory);

classMentors.config(ace.configRoute);
