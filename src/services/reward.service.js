const cleos = require('./cleos.service');
const wallet = require('./wallet.service');
const ora = require('ora');
const log = require('../utils/logger');
const logfile = require('../utils/logfile');

function claim(walletName, accountName, broadcaster) {
  // 1. unlock
  if (!wallet.unlock(walletName)) return false;

  // 2. claim
  const spinner = ora('Mengklaim reward...').start();
  const cmd = `-u ${broadcaster} system claimrewards ${accountName}`;
  const result = cleos.exec(cmd, { timeout: 120000 });
  spinner.stop();

  if (result.ok) {
    const m = result.stdout.match(/executed transaction:\s+([a-f0-9]+)/);
    const txId = m ? m[1] : null;
    if (txId) {
      log.success(`Proses berhasil dengan TX ID: ${txId}`);
    } else {
      log.success('Reward berhasil diklaim.');
    }
    logfile.append(`Claimed rewards: ${accountName}`);
    return true;
  }
  log.error(result.friendly || 'Gagal mengklaim reward');
  return false;
}

module.exports = { claim };
