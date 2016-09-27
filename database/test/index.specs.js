'use strict';

var chai = require('chai');
var targaryen = require('@dinoboff/targaryen');

chai.use(targaryen.chai);

require('./security-rules.specs.js');
require('./auth.specs.js');
require('./events.specs.js');
require('./settings.specs.js');
require('./eventQuestions.specs.js');
require('./profile.specs.js');
