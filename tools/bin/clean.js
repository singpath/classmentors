#!/usr/bin/env node
'use strict';

/**
 * Remove build/test related directories.
 */


// dependencies
const config = require('./config');
const sh = require('shelljs');
const tools = require('@singpath/tools');

// exit on error
sh.set('-e');

tools.clean([config.build.root, config.coverage.root]);
