#!/usr/bin/env node
'use strict';

const config = require('./config.js');
const sh = require('shelljs');
const tools = require('@singpath/tools');

sh.set('-e');

const stdoutGetter = cmd => () => sh.exec(cmd, {silent: true}).stdout.trim();
const getOriginUrl = stdoutGetter('git config --get remote.origin.url');
const getCommitName = stdoutGetter('git --no-pager show -s --format=\'%an\'');
const getCommitEmail = stdoutGetter('git --no-pager show -s --format=\'%ae\'');

const firebaseId = process.argv.slice(2).shift() || 'singpath';
const remoteUrl = process.argv.slice(3).shift() || getOriginUrl();
const commitName = process.argv.slice(4).shift() || getCommitName();
const commitEmail = process.argv.slice(5).shift() || getCommitEmail();

// Build app
if (sh.test('-d', config.build.app.root)) {
  sh.echo('Skipping building app.');
  sh.rm('-rf', config.build.app.git);
} else {
  tools.exec('npm run build');
}

// git init
sh.echo(`setup git repository in ${config.build.app.root}...`);
sh.pushd(config.build.app.root);
tools.exec('git init');
tools.exec(`git config user.name "${commitName}"`);
tools.exec(`git config user.email "${commitEmail}"`);

// Switch firebase id in
sh.echo('Switching firebase id in "index.html"');
sh.cp('index.html', 'index.html.tmp');
sh.sed('-i', /firebaseId: ['"][-a-zA-Z0-9]+['"]/, `firebaseId: '${firebaseId}'`, 'index.html');

// Commit files
sh.echo('Committing files');
sh.rm('-f', '*.map');
tools.exec('git add .');
tools.exec('git commit -m "Deploy to GitHub Pages"');

// # Force push from the current repo's master branch to the remote
// # repo's gh-pages branch. (All previous history on the gh-pages branch
// # will be lost, since we are overwriting it.) We redirect any ${BUILD_DEST}put to
// # /dev/null to hide any sensitive credential data that might otherwise be exposed.
sh.echo('Pushing gh-pages to origin remote repo (or provided one)...');
tools.exec(`git push --force --quiet ${remoteUrl} master:gh-pages`, {
  printCmd: false,
  ignoreStdout: true,
  ignoreStderr: true
});

// # cleanup dist directory
sh.mv('index.html.tmp', 'index.html');
sh.popd();
sh.rm('-rf', config.build.app.git);
