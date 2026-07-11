const cleos = require('./cleos.service');
const ora = require('ora');
const log = require('../utils/logger');

function healthCheck(url) {
  const spinner = ora('Memeriksa koneksi broadcaster...').start();
  // Try to get chain info as a lightweight health check
  const result = cleos.exec(`-u ${url} get info`, { timeout: 15000 });
  spinner.stop();

  if (result.ok) {
    log.success(`Broadcaster ${url} dapat dijangkau.`);
    return true;
  }
  log.warn(`Broadcaster ${url} tidak merespon. Coba node lain?`);
  return false;
}

module.exports = { healthCheck };
