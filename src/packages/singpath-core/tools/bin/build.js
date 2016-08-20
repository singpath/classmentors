#!/usr/bin/env node
'use strict';

/**
 * Bundle singpath-core demo.
 */

// dependencies
const tools = require('@singpath/tools');
const path = require('path');
const sh = require('shelljs');

// exit on error
sh.set('-e');

// paths
const dist = process.env.npm_package_config_build_dir || 'dist';
const assets = process.env.npm_package_config_build_assets_dir || 'tools/assets';
const distAssests = `${assets}/dist/*`;
const output = path.join(dist, 'singpath-core.js');
const outputMin = path.join(dist, 'singpath-core.min.js');
const outputTree = path.join(dist, 'singpath-core.tree.html');
const demo = path.join(dist, 'demo.js');

const externals = [{
  name: 'angular',
  entry: 'angular-animate/angular-animate.js',
  globalName: 'angular'
}, {
  name: 'angular',
  entry: 'angular-aria/angular-aria.js',
  globalName: 'angular'
}, {
  name: 'angular',
  entry: 'angular-messages/angular-messages.js',
  globalName: 'angular'
}, {
  name: 'angular',
  entry: 'angular-route/angular-route.js',
  globalName: 'angular'
}, {
  name: 'angular',
  entry: 'angular/angular.js',
  globalName: 'angular'
}, {
  name: 'angular-material',
  entry: 'angular-material/angular-material.js',
  globalName: 'angular'
}, {
  name: 'angular-loading-bar',
  entry: 'angular-loading-bar/build/loading-bar.js',
  globalName: 'angular'
}, {
  name: 'firebase',
  entry: 'firebase/firebase.js',
  globalName: 'Firebase'
}, {
  name: 'angularfire',
  entry: 'angularfire',
  globalName: 'angular'
}];

// jspm options
const deps = externals.map(e => e.name);
const globalDeps = externals.reduce(
  (gd, e) => Object.assign(gd, {[e.entry]: e.globalName}),
  {}
);
const src = ['singpath-core'].concat(deps).join(' - ');
const depsOpts = `--global-name spfShared --global-deps '${JSON.stringify(globalDeps)}'`;


// Setup
sh.echo(`CWD: ${process.cwd()}`);
tools.clean(dist);
sh.echo(`Setting up "${dist}/"...`);
sh.mkdir('-p', dist);
sh.cp('-r', 'LICENSE', distAssests, dist);


// Bundles
sh.echo(`Buidling ${output}...`);
tools.exec(`jspm build ${src} "${output}" ${depsOpts} --format umd --skip-source-maps`);

sh.echo(`Buidling ${outputMin}...`);
tools.exec(`jspm build ${src} "${outputMin}" ${depsOpts} --format umd --minify`);

sh.echo(`Buidling ${demo}...`);
tools.exec(`jspm build singpath-core/demo.js "${demo}" --global-name spfSharedDemo --format umd`);


// Dependency tree
//
// You don't want the browser to load the source map file
// (the source map is often as big as the bundle).
// So we are stripping the source map directive in the bundle
// by stripping the last line.
sh.echo(`Removing source map directive from ${outputMin}...`);
sh.sed('-i', /^\/\/# sourceMappingURL=.*$/, '', outputMin);

sh.echo('Analysing source map...');
tools.execPipe(`source-map-explorer --html "${outputMin}" "${outputMin}.map"`, {stdout: outputTree});

sh.echo(`open "'${outputTree}'" to find weight of each modules.`);
