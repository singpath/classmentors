#!/usr/bin/env node
'use strict';

/**
 * Run singpath-core unit tests.
 */

const sh = require('shelljs');
const tools = require('@singpath/tools');
const src = 'singpath-core/singpath-core.specs.js';
const coverage = './coverage';

// exit on error
sh.set('-e');

// setup
tools.clean(coverage, {message: 'Removing coverage data'});
sh.echo(`Setting up "${coverage}/"...`);
sh.mkdir('-p', coverage);

tools.instanbul(src, {coverage});
