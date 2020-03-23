const chalk = require('chalk');
const commandLineArgs = require('command-line-args');
const clientOptions = commandLineArgs([
   { name: 'format', alias: 'f', defaultValue: 'png' },
   { name: 'outputPath', alias: 'o' },
   { name: 'src', type: String, multiple: true, defaultOption: true },
 ]);

console.log(chalk.grey(JSON.stringify(clientOptions)));
const Client = require('./client');

// (new Client()).get('../');