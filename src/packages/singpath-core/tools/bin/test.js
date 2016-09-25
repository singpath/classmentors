#!/usr/bin/env node
'use strict';

/**
 * Run singpath-core unit tests.
 */

const sh = require('shelljs');
const tools = require('@singpath/tools');
const src = 'singpath-core/singpath-core.specs.js';

// exit on error
sh.set('-e');

tools.mocha(src);
