const chalk = require('chalk');

function success(msg) { console.log(chalk.green('✅ ' + msg)); }
function error(msg)   { console.log(chalk.red('❌ ' + msg)); }
function warn(msg)    { console.log(chalk.yellow('⚠️  ' + msg)); }
function info(msg)    { console.log(chalk.blue('ℹ️  ' + msg)); }
function raw(msg)     { console.log(msg); }

module.exports = { success, error, warn, info, raw };
