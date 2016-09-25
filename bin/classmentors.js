#!/usr/bin/env node
'use strict';

const commander = require('commander');
const cli = require('../src/classmentors/tools/cli/index.js');

let program = commander
  .version('0.0.1')
  .description(`
  Group and extends firebase cli command.

  You can use "firebase login" and "firebase logout" to manage autentication, or
  "firebase use <alias_or_project_id>" to manage the target.

`)
  .option('-P, --project <alias_or_project_id>', 'the Firebase project to use for this command')
  .option('-j, --json', 'output JSON instead of text, also triggers non-interactive mode')
  .option('--token <token>', 'supply an auth token for this command')
  .option('--non-interactive', 'error out of the command instead of waiting for prompts')
  .option('--interactive', 'force interactive shell treatment even when not detected')
  .option('--debug', 'print verbose debug output and keep a debug log file')
  .option('--no-localhost', 'copy and paste a code instead of starting a local server for authentication');

// load commands
program = cli.acl(program);
program = cli.backup(program);
program = cli.serve(program);
program = cli.setup(program);

program.parse(process.argv);

