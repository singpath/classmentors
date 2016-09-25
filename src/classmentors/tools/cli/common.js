/* eslint
  no-console: "off",
  no-process-exit: "off",
  no-underscore-dangle: ["error", {allow: ['_maintenance']}]
*/
'use strict';

const client = require('firebase-tools');
const path = require('path');
const tmp = require('tmp');

const dataPath = 'database/data';

/**
 * Adds some of the firebase database:get command options.
 *
 * @param {object} cmd Commander object.
 * @return {object}    An updated commander object
 */
exports.addGetOptions = function(cmd) {
  return cmd
    .option('--no-pretty', 'disable pretty print query responses')
    .option('--shallow', 'return shallow query response')
    .option('--export', 'include priorities in the query output response')
    .option('--limit-to-first <num>', 'limit to the first <num> query results')
    .option('--limit-to-last <num>', 'limit to the last <num> query results')
    .option('--start-at <val>', 'start query results at <val> (based on specified ordering)')
    .option('--end-at <val>', 'end query results at <val> (based on specified ordering)');
};

/**
 * Adds some of the database:set options.
 *
 * @param {object} cmd Commander object.
 * @return {object}    An updated commander object
 */
exports.addSetOptions = function(cmd) {
  return cmd.option('-y, --confirm', 'pass this option to bypass confirmation prompt');
};

/**
 * Adds a few of the firebase deploy command options.
 *
 * @param {object} cmd Commander object.
 * @return {object}    An updated commander object
 */
exports.addDeployRulesOptions = function(cmd) {
  return cmd.option('-m, --message <message>', 'an optional message describing rule deployment');
};

/**
 * Adds more of the firebase deploy command options.
 *
 * @param {object} cmd Commander object.
 * @return {object}    An updated commander object
 */
exports.addDeployAllOptions = function(cmd) {
  return cmd
    .option('-m, --message <message>', 'an optional message describing this deployment')
    .option('-p, --public <path>', 'override the Hosting public directory specified in firebase.json')
    .option('--only <targets>', 'only deploy to specified, comma-separated targets (e.g. "hosting,storage")')
    .option('--except <targets>', 'deploy to all targets except specified (e.g. "database")');
};

/**
 * Passthrough promise handler authenticating the user
 *
 * It also update opts with some firebase-tools config values
 * like "projectRoot".
 *
 * @param  {object} [opts] command options
 * @return {Promise<object, Error>}  resolve with the updated options.
 */
exports.login = function(opts) {
  opts = opts || {};

  return client.login(opts).then(
    () => opts
  );
};

/**
 * Print the error stack and exit with error code 1.
 *
 * @param  {Error} err error to print the stack.
 */
exports.exit = function(err) {
  console.error(err.stack);
  process.exit(1);
};

/**
 * Return the passthrough logger which called will print the msg to
 * the console and return the first argument.
 *
 * @example
 * const value = {};
 * Promise.resolve(value).then(
 *   logger('print me when resolved'))
 * .then(
 *   v => console.log(v === value)
 * )
 *
 * @param  {string} msg [description]
 * @return {function(value: any): any}
 */
exports.logger = msg => result => {
  console.log(msg);

  return result;
};

/**
 * Load local saved data.
 *
 * @param  {string} srcPath Path to the local data.
 * @param  {{projectRoot: string}} opts Command options.
 * @return {object}
 */
exports.loadData = function(srcPath, opts) {
  const src = getDataPath(srcPath, opts);

  console.log(`Loading "${src}"...`);

  return require(src);
};

/**
 * Download data from the database.
 *
 * if path is provided, the data will saved at the path and it will resolve to
 * undefined.
 *
 * Resolve to either the data or the command options.
 *
 * @param  {string} url    Data url.
 * @param  {string} [destPath] Where to save the data.
 * @param  {{projectRoot: string}}   opts   Command opts
 * @return {Promise<object,Error>}
 */
exports.downloadData = function(url, destPath, opts) {
  assertProject(opts);

  if (typeof destPath !== 'string') {
    opts = destPath;
    destPath = undefined;
  }

  if (destPath) {
    const dest = getDataPath(destPath, opts);

    console.log(`Downloading "${url}" to "${dest}"...`);

    return getData(url, dest, opts).then(
      () => opts
    );
  }

  const tmpOpts = {
    keep: true,
    postfix: '-tmp.json'
  };

  console.log(`Downloading "${url}"...`);

  return new Promise((resolve, reject) => {
    tmp.file(tmpOpts, function(err, tmpPath, fd, cleanup) {
      if (err) {
        reject(err);
      }

      const promisedData = getData(url, tmpPath, opts).then(
        () => require(tmpPath)
      );

      promisedData.then(cleanup, cleanup);

      resolve(promisedData);
    });
  });
};

/**
 * Upload data to database url.
 *
 * Resolve to the cmd options.
 *
 * @param  {string} url                             Data url.
 * @param  {object|string|boolean|number|null} data Data to upload.
 * @param  {object} opts                            Command options.
 * @return {Promise<object,Error>}
 */
exports.uploadData = function(url, data, opts) {
  assertProject(opts);

  const uploadOptions = Object.assign({data: JSON.stringify(data)}, opts);

  console.log(`Uploading data to ${url}...`);

  return client.database.set(url, undefined, uploadOptions).then(
    () => opts
  );
};

/**
 * Upload the json content of the file to the database url
 *
 * Resolve to the cmd options.
 *
 * @param  {string} url  Data url.
 * @param  {string} srcPath Path to the file.
 * @param  {{projectRoot: string}} opts Command options.
 * @return {Promise<void,Error>}
 */
exports.uploadFile = function(url, srcPath, opts) {
  assertProject(opts);

  const src = getDataPath(srcPath, opts);
  const uploadOptions = Object.assign({}, opts);

  console.log(`Uploading "${src}" to "${url}"...`);

  return client.database.set(url, src, uploadOptions).then(
    () => opts
  );
};

/**
 * Load the project maintenance config out of the project "firebase.json".
 *
 * @param  {{projectRoot: string}} opts Command options
 * @return {{backups: array, defaults: array}}
 */
exports.config = function(opts) {
  const firebaseCfg = require(getPath('firebase.json', opts));
  const defaults = {backups: [], defaults: []};
  const config = (
    firebaseCfg &&
    firebaseCfg.database &&
    firebaseCfg.database._maintenance
  );

  return Object.assign(defaults, config);
};

/**
 * Return an absolute path firebase project file or directory.
 *
 * @param  {string}                relativePath Path relative to the firebase root directory
 * @param  {{projectRoot: string}} opts         Command options.
 * @return {string}
 */
function getPath(relativePath, opts) {
  if (!opts || !opts.projectRoot) {
    throw new Error('no project root provided');
  }

  if (!relativePath) {
    throw new Error('no path provided');
  }

  return path.join(opts.projectRoot, relativePath);
}

/**
 * Return an absolute path firebase project database data file or directory.
 *
 * @param  {string}                relativePath Path relative to the firebase data directory (database/data).
 * @param  {{projectRoot: string}} opts         Command options.
 * @return {string}
 */
function getDataPath(relativePath, opts) {
  return getPath(
    path.join(dataPath, relativePath),
    opts
  );
}

/**
 * Assert the project ID is set.
 *
 * @param  {{project: string}} opts Command options
 * @return {string} the project id
 */
function assertProject(opts) {
  if (!opts || !opts.project) {
    return Promise.reject(new Error('no project id set.'));
  }

  return opts.project;
}

/**
 * Load some firebase data and save it to a file.
 *
 * @param  {string}                url  Path to the data in the firebase database.
 * @param  {string}                dest Local path relative to the project database/data directory.
 * @param  {{projectRoot: string}} opts Command options
 * @return {Promise<void, Error>}
 */
function getData(url, dest, opts) {
  const downloadOptions = Object.assign({output: dest}, opts);

  return client.database.get(url, downloadOptions);
}
