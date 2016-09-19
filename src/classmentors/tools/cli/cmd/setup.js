/* eslint no-console: "off" */
'use strict';

const common = require('../common.js');
const merge = require('lodash.merge');

/**
 * Add the "setup" sub command to the cli.
 *
 * @param  {object} program Commander parser.
 * @return {object}         Updated commander parser.
 */
module.exports = function setup(program) {
  let cmd = program.command('setup');

  cmd = cmd.description(`
  Setup the firebase database with:

  - School and badges lists.
  - settings.
  - database rules [TODO]

  Example:

  firebase use staging
  ./node_modules/.bin/classmentors setups

`);

  cmd = common.addSetOptions(cmd);
  cmd = common.addDeployRulesOptions(cmd);

  cmd.action(opts => {

    // login, beside authenticating the user, update `opts` with some properties
    // like "projectRoot" absolute path.
    return common.login(opts)
      .then(setupDefaults)
      .then(uploadBackups)
      .catch(common.exit);
  });

  return program;
};

/**
 * Setup default database values like "classMentors/settings".
 *
 * The list of values to set in in the "firebase.json" file at
 * "database._maintenance.defaults".
 *
 * @param  {{projectRoot: string}} opts Command options.
 * @return {options}                    Commander options
 */
function setupDefaults(opts) {
  const init = Promise.resolve();
  const config = common.config(opts);

  return config.defaults.reduce((pipe, data) => {
    const defaultData = common.loadData(data.path, opts);

    console.log(`Setting defaults at ${data.url}...`);

    return pipe.then(
      () => common.downloadData(data.url, opts)
    ).then(
      value => merge({}, defaultData, value)
    ).then(value => {
      console.log(`New value:\n${JSON.stringify(value, undefined, 2)}`);

      return common.uploadData(data.url, value, opts);
    }).then(
      common.logger(`Defaults set up at ${data.url}.`)
    );
  }, init);
}

/**
 * Upload the files defined in firebase.json at "database._maintenance.backups".
 *
 * @param  {options} opts Commander options
 * @return {options}      Commander options
 */
function uploadBackups(opts) {
  const config = common.config(opts);
  const init = Promise.resolve();

  return config.backups.reduce((pipe, data) => {
    return pipe.then(
      () => common.uploadFile(data.url, data.path, opts)
    );
  }, init);
}
