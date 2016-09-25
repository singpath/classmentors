/* eslint no-console: "off" */
'use strict';

/**
 * Add the "serve" sub command to the cli.
 *
 * @param  {object} program Commander parser.
 * @return {object}         Updated commander parser.
 */
module.exports = function serve(program) {
  let cmd = program.command('serve [port]');

  cmd.description(`
  Serve development app

  Example:

  ./node_modules/.bin/classmentors serve 8080

  `);

  cmd.action((port) => {
    port = parseInt(port, 10);

    if (Number.isNaN(port) || port < 1024) {
      throw new Error('The server port should be a number > 1024');
    }

    console.log(`TODO: serve src/ on port ${port}`);
  });

  return program;

};
