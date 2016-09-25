/* eslint no-console: "off" */
'use strict';

const common = require('../common.js');

/**
 * Add the "backup" sub command to the cli.
 *
 * @param  {object} program Commander parser.
 * @return {object}         Updated commander parser.
 */
module.exports = function backup(program) {
  let cmd = program.command('backup');

  cmd.description(`
  Download some data and save them to the project database/data folder.

  The list of the data to save is defined in the project firebase.json, at
  "database._maintenance.backups".

  Example:

  firebase use production
  ./node_modules/.bin/classmentors backup

`);

  cmd = common.addGetOptions(cmd);

  cmd.action(opts => {

    // login, beside authenticating the user, update `opts` with some properties
    // like "projectRoot" absolute path.
    return common.login(opts)
      .then(saveBackups)
      .catch(common.exit);
  });

  return program;
};

/**
 * Save to a file the paths defined in firebase.json at
 * "database._maintenance.backups".
 *
 * @param  {options} opts Commander options
 * @return {options}      Commander options
 */
function saveBackups(opts) {
  const config = common.config(opts);
  const init = Promise.resolve();

  return config.backups.reduce((pipe, data) => {
    return pipe.then(
      () => common.downloadData(data.url, data.path, opts)
    );
  }, init);
}
