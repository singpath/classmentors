#!/usr/bin/env node
'use strict';

/**
 * Remove build/test related directories.
 */


// dependencies
const tools = require('@singpath/tools');
const sh = require('shelljs');
const config = require('./config');

// exit on error
sh.set('-e');

tools.clean([config.build.root, config.coverage.root]);
