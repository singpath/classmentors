#!/usr/bin/env node
'use strict';

/**
 * Run example-app unit tests.
 */

const config = require('./config.js');
const sh = require('shelljs');
const tools = require('@singpath/tools');

// exit on error
sh.set('-e');

// test
tools.mocha(config.test.main);
