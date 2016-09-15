/* eslint no-console: "off" */
'use strict';

/**
 * Add the "acl" sub command to the cli.
 *
 * @param  {object} program Commander parser.
 * @return {object}         Updated commander parser.
 */
module.exports = function acl(program) {
  let cmd = program.command('acl <action> <publicId> <role>');

  cmd.description(`
  Add/Remove admin and premium roles to a user.

  The list of the data to save is defined in the project firebase.json, at
  "database._maintenance.backups".

  Example:

  firebase use staging
  ./node_modules/.bin/classmentors acl add chris admin

  `);

  cmd.action((action, publicId, role) => {

    switch (action) {
      case 'add':
      case 'remove':
        break;
      default:
        throw new Error('action should be "add" or "remove".');
    }

    switch (role) {
      case 'admin':
      case 'premium':
        break;
      default:
        throw new Error('role should be "admin" or "premium".');
    }

    console.log(`TODO: make ${publicId} an ${role}`);
  });

  return program;

};
