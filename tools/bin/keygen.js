#!/usr/bin/env node
'use strict';

/**
 * Run example-app unit tests.
 */

const path = require('path');
const config = require('./config.js');
const sh = require('shelljs');
const tools = require('@singpath/tools');
const openssl = sh.which('openssl');

// exit on error
sh.set('-e');

if (!openssl) {
  sh.echo('openssl is not installed or not in your $PATH');
  sh.exit(1);
}

// setup
tools.clean(config.serve.certs.root, {message: 'Removing SSL certificate'});
sh.echo(`Setting up "${config.serve.certs.root}/"...`);
sh.mkdir('-p', config.serve.certs.root);

// creating keys
const key = path.join(config.serve.certs.root, 'localhost.key');
const cert = path.join(config.serve.certs.root, 'localhost.cert');
const subj = '/C=SG/ST=Denial/L=Singapore/O=Dis/CN=localhost';
const year = 365;
const opts = `-x509 -nodes -newkey rsa:4096 -new -days ${3 * year} -subj "${subj}"`;

sh.echo('Creating new self-signed SSL certificate...');
tools.exec(`openssl req ${opts} -keyout ${key} -out ${cert}`);
