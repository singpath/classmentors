'use strict';

var chai = require('chai');
var targaryen = require('@dinoboff/targaryen');

chai.use(targaryen.chai);

require('./security-rules.specs.js');
require('./auth.specs.js');
