#!/usr/bin/env node
'use strict';

/**
 * Remove build/test related directories.
 */


// dependencies
const tools = require('@singpath/tools');
const sh = require('shelljs');

// exit on error
sh.set('-e');

const dist = process.env.npm_package_config_build_dir || 'dist';

tools.clean([dist, 'coverage']);
