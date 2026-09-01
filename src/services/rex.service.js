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

function unstakeToRex(walletName, owner, receiver, netAmount, cpuAmount, broadcaster) {
  if (!wallet.unlock(walletName)) return false;

  const spinner = ora('Memindahkan stake ke REX...').start();
  const result = cleos.exec([
    '-u', broadcaster,
    'system', 'rex', 'unstaketorex',
    owner,
    receiver,
    netAmount,
    cpuAmount,
    '-p', `${owner}@active`,
  ], { timeout: 120000 });
  spinner.stop();

  return formatTx(result, 'Unstake to REX berhasil.', `Unstake to REX: ${owner} -> ${receiver} (${netAmount}, ${cpuAmount})`);
}

function sellRex(walletName, owner, rexAmount, broadcaster) {
  if (!wallet.unlock(walletName)) return false;

  const spinner = ora('Menjual REX...').start();
  const result = cleos.exec([
    '-u', broadcaster,
    'system', 'rex', 'sellrex',
    owner,
    rexAmount,
    '-p', `${owner}@active`,
  ], { timeout: 120000 });
  spinner.stop();

  return formatTx(result, 'Sell REX berhasil.', `Sell REX: ${owner} (${rexAmount})`);
}

function withdrawRex(walletName, owner, vexAmount, broadcaster) {
  if (!wallet.unlock(walletName)) return false;

  const spinner = ora('Menarik dana dari REX fund...').start();
  const result = cleos.exec([
    '-u', broadcaster,
    'system', 'rex', 'withdraw',
    owner,
    vexAmount,
    '-p', `${owner}@active`,
  ], { timeout: 120000 });
  spinner.stop();

  return formatTx(result, 'Withdraw REX fund berhasil.', `Withdraw REX fund: ${owner} (${vexAmount})`);
}

function getMaturity(owner, broadcaster) {
  const spinner = ora('Mengambil data maturity REX...').start();
  const result = cleos.exec([
    '-u', broadcaster,
    'get', 'table', 'vexcore', 'vexcore', 'rexbal',
    '--lower', owner,
    '--upper', owner,
    '--limit', '1',
  ], { timeout: 30000 });
  spinner.stop();

  if (!result.ok) {
    log.error(result.friendly || 'Gagal mengambil data maturity REX');
    return false;
  }

  try {
    const data = JSON.parse(result.stdout);
    const row = data.rows && data.rows[0];
    if (!row || row.owner !== owner) {
      log.warn('Data REX balance tidak ditemukan.');
      return false;
    }

    const matured = formatRexUnits(row.matured_rex);
    log.raw(`\nOwner           : ${row.owner}`);
    log.raw(`REX Balance     : ${row.rex_balance}`);
    log.raw(`Matured REX     : ${matured}`);
    log.raw(`Vote Stake      : ${row.vote_stake}`);
    log.raw(`Maturity Bucket : ${row.rex_maturities?.length || 0}`);
    return matured;
  } catch (e) {
    log.error(`Gagal parse data maturity REX: ${e.message}`);
    return false;
  }
}

function getWithdrawable(owner, broadcaster) {
  const spinner = ora('Mengambil saldo withdrawable REX...').start();
  const result = cleos.exec([
    '-u', broadcaster,
    'get', 'table', 'vexcore', 'vexcore', 'rexfund',
    '--lower', owner,
    '--upper', owner,
    '--limit', '1',
  ], { timeout: 30000 });
  spinner.stop();

  if (!result.ok) {
    log.error(result.friendly || 'Gagal mengambil saldo withdrawable REX');
    return false;
  }

  try {
    const data = JSON.parse(result.stdout);
    const row = data.rows && data.rows[0];
    const balance = row && row.owner === owner ? row.balance : '0.0000 VEX';
    log.raw(`\nOwner              : ${owner}`);
    log.raw(`Withdrawable Balance: ${balance}`);
    return balance;
  } catch (e) {
    log.error(`Gagal parse saldo withdrawable REX: ${e.message}`);
    return false;
  }
}

function formatRexUnits(value) {
  const raw = String(value || '0');
  if (raw.length <= 4) return `0.${raw.padStart(4, '0')} REX`;
  return `${raw.slice(0, -4)}.${raw.slice(-4)} REX`;
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
        const net = parseFloat(row.net_weight || '0');
        const cpu = parseFloat(row.cpu_weight || '0');
        totalNet += net;
        totalCpu += cpu;
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

module.exports = { unstakeToRex, sellRex, withdrawRex, getMaturity, getWithdrawable, formatRexUnits, delegateBw, undelegateBw, getStakedResources };
