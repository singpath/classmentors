#!/usr/bin/env node
'use strict';

const sh = require('shelljs');
const tools = require('@singpath/tools');
const yaml = require('js-yaml');
const travis = sh.which('travis');

sh.set('-e');

const travisFile = './.travis.yml';
const travisInit = `
language: node_js
node_js:
  - '4'
script:
  - npm run test
  - npm run coveralls
after_success:
  - ./tools/bin/build-gh-pages-travis.sh
`.trimLeft();

if (!travis) {
  process.stderr.write('Travis is not install.\n');
  process.stderr.write('Run "gem install travis".\n');
  sh.exit(1);
}

sh.echo(`Initiating "${travisFile}"...`);
new sh.ShellString(travisInit).to(travisFile);

sh.echo(`setting up release...
Please provide you github credentials (they won't hit Travis server);
The file to upload is dist/classmentors.zip;
Deploy should occure from singpath/classmentors;
The API key should be encrypted.
`);
tools.exec('travis setup releases -r singpath/classmentors');


const travisConfig = yaml.safeLoad(sh.cat(travisFile));

travisConfig.deploy = {
  provider: 'releases',
  skip_cleanup: true,
  on: {
    repo: 'singpath/classmentors',
    tags: true
  },
  file: 'dist/classmentors.zip',
  api_key: travisConfig.deploy.api_key
};

new sh.ShellString(
  yaml.safeDump(travisConfig).replace(/\'on\':/, 'on:')
).to(travisFile);
sh.echo('Travis release setup.');
