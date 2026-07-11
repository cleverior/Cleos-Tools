const cleos = require('./cleos.service');
const wallet = require('./wallet.service');
const ora = require('ora');
const log = require('../utils/logger');
const logfile = require('../utils/logfile');

function vote(walletName, voterAccount, bpName, broadcaster) {
  // 1. unlock
  if (!wallet.unlock(walletName)) return false;

  // 2. vote
  const spinner = ora('Melakukan vote...').start();
  const cmd = `-u ${broadcaster} system voteproducer prods ${voterAccount} ${bpName}`;
  const result = cleos.exec(cmd, { timeout: 60000 });
  spinner.stop();

  if (result.ok) {
    // extract TX ID from the full output (stdout+stderr merged)
    const m = result.stdout.match(/executed transaction:\s+([a-f0-9]+)/);
    const txId = m ? m[1] : null;
    if (txId) {
      log.success(`Proses berhasil dengan TX ID: ${txId}`);
    } else {
      log.success('Vote berhasil.');
    }
    logfile.append(`Voted: ${voterAccount} -> ${bpName}`);
    return true;
  }
  log.error(result.friendly || 'Gagal melakukan vote');
  return false;
}

module.exports = { vote };
