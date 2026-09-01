const ora = require('ora');
const cleos = require('./cleos.service');
const wallet = require('./wallet.service');
const log = require('../utils/logger');
const logfile = require('../utils/logfile');

function formatTx(result, okMsg, logMsg) {
  if (!result.ok) {
    log.error(result.friendly || 'Proses gagal');
    return false;
  }

  const txId = cleos.extractTxId(result.stdout);
  if (txId) {
    log.success(`Proses berhasil dengan TX ID: ${txId}`);
  } else {
    log.success(okMsg);
  }
  logfile.append(logMsg);
  return true;
}

function delegateBw(walletName, from, receiver, netAmount, cpuAmount, broadcaster) {
  if (!wallet.unlock(walletName)) return false;

  const spinner = ora('Stake resource (delegatebw)...').start();
  const result = cleos.exec([
    '-u', broadcaster,
    'system', 'delegatebw',
    from,
    receiver,
    netAmount,
    cpuAmount,
    '-p', `${from}@active`,
  ], { timeout: 120000 });
  spinner.stop();

  return formatTx(result, 'Stake resource berhasil.', `Delegate BW: ${from} -> ${receiver} (NET ${netAmount}, CPU ${cpuAmount})`);
}

function undelegateBw(walletName, from, receiver, netAmount, cpuAmount, broadcaster) {
  if (!wallet.unlock(walletName)) return false;

  const spinner = ora('Unstake resource (undelegatebw)...').start();
  const result = cleos.exec([
    '-u', broadcaster,
    'system', 'undelegatebw',
    from,
    receiver,
    netAmount,
    cpuAmount,
    '-p', `${from}@active`,
  ], { timeout: 120000 });
  spinner.stop();

  return formatTx(result, 'Unstake resource berhasil.', `Undelegate BW: ${from} -> ${receiver} (NET ${netAmount}, CPU ${cpuAmount})`);
}

function getStakedResources(owner, broadcaster) {
  const spinner = ora('Mengambil data stake resource...').start();
  const result = cleos.exec([
    '-u', broadcaster,
    'system', 'listbw',
    owner,
    '-j',
  ], { timeout: 30000 });
  spinner.stop();

  if (!result.ok) {
    log.error(result.friendly || 'Gagal mengambil data stake resource');
    return false;
  }

  try {
    const data = JSON.parse(result.stdout);
    let totalNet = 0;
    let totalCpu = 0;
    if (data.rows && Array.isArray(data.rows)) {
      for (const row of data.rows) {
        totalNet += parseFloat(row.net_weight || '0');
        totalCpu += parseFloat(row.cpu_weight || '0');
      }
    }
    const netWeight = totalNet.toFixed(4) + ' VEX';
    const cpuWeight = totalCpu.toFixed(4) + ' VEX';
    log.raw(`\nAccount          : ${owner}`);
    log.raw(`Staked NET       : ${netWeight}`);
    log.raw(`Staked CPU       : ${cpuWeight}`);
    log.raw(`Total Staked     : ${(totalNet + totalCpu).toFixed(4)} VEX`);
    return { netWeight, cpuWeight };
  } catch (e) {
    log.error(`Gagal parse data stake resource: ${e.message}`);
    return false;
  }
}

module.exports = { delegateBw, undelegateBw, getStakedResources };