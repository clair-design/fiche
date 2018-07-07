#!/usr/bin/env node
/**
 * adpated from
 * https://github.com/parcel-bundler/parcel/blob/master/src/cli.js
 */
const program = require('commander')
const version = require('../package.json').version

program.version(version)

program
  .command('start')
  .description('start watching and serving...')
  .action(bundle)

program
  .command('build')
  .description('render to static generated files')
  .action(bundle)

program
  .command('clean')
  .description('clean the working directory `.fiche`')
  .action(bundle)

program
  .command('help [command]')
  .description('display help information for a command')
  .action(function (command) {
    let cmd = program.commands.find(c => c.name() === command) || program
    cmd.help()
  })

const args = process.argv
if (args[2] === '--help' || args[2] === '-h') args[2] = 'help'
if (!args[2] || !program.commands.some(c => c.name() === args[2])) {
  args.splice(2, 0, 'start')
}

program.parse(args)

function bundle (command) {
  const name = command.name()

  if (name === 'clean') {
    return require('../').cleanWorkDir()
  }

  if (name === 'build') {
    process.env.NODE_ENV = 'production'
  } else {
    process.env.NODE_ENV = 'development'
  }
  require('../')()
}
