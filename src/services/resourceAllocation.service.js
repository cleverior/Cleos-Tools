const wallet = require('./wallet.service');
const { runCleos, runCleosJson } = require('../utils/cli');

/**
 * Delegate bandwidth (stake NET/CPU) from one account to another.
 * @param {string} walletName - Wallet name to unlock
 * @param {string} from - Account staking resources
 * @param {string} receiver - Account receiving staked resources
 * @param {string} netAmount - NET amount (e.g., "10.0000 VEX")
 * @param {string} cpuAmount - CPU amount (e.g., "10.0000 VEX")
 * @param {string} broadcaster - Node URL
 * @returns {Promise<boolean>}
 */
async function delegateBw(walletName, from, receiver, netAmount, cpuAmount, broadcaster) {
  if (!wallet.unlock(walletName)) return false;

  const result = await runCleos([
    '-u', broadcaster,
    'system', 'delegatebw',
    from,
    receiver,
    netAmount,
    cpuAmount,
    '-p', `${from}@active`,
  ], {
    actionMsg: 'Stake resource (delegatebw)...',
    successMsg: 'Stake resource berhasil.',
    logMsg: `Delegate BW: ${from} -> ${receiver} (NET ${netAmount}, CPU ${cpuAmount})`,
    timeout: 120000,
  });

  return result.ok;
}

/**
 * Undelegate bandwidth (unstake NET/CPU) from one account to another.
 * @param {string} walletName - Wallet name to unlock
 * @param {string} from - Account unstaking resources
 * @param {string} receiver - Account receiving unstaked resources
 * @param {string} netAmount - NET amount (e.g., "10.0000 VEX")
 * @param {string} cpuAmount - CPU amount (e.g., "10.0000 VEX")
 * @param {string} broadcaster - Node URL
 * @returns {Promise<boolean>}
 */
async function undelegateBw(walletName, from, receiver, netAmount, cpuAmount, broadcaster) {
  if (!wallet.unlock(walletName)) return false;

  const result = await runCleos([
    '-u', broadcaster,
    'system', 'undelegatebw',
    from,
    receiver,
    netAmount,
    cpuAmount,
    '-p', `${from}@active`,
  ], {
    actionMsg: 'Unstake resource (undelegatebw)...',
    successMsg: 'Unstake resource berhasil.',
    logMsg: `Undelegate BW: ${from} -> ${receiver} (NET ${netAmount}, CPU ${cpuAmount})`,
    timeout: 120000,
  });

  return result.ok;
}

/**
 * Get staked NET and CPU resources for an account.
 * @param {string} owner - Account owner
 * @param {string} broadcaster - Node URL
 * @returns {Promise<{netWeight: string, cpuWeight: string}|boolean>}
 */
async function getStakedResources(owner, broadcaster) {
  const result = await runCleosJson([
    '-u', broadcaster,
    'system', 'listbw',
    owner,
    '-j',
  ], {
    actionMsg: 'Mengambil data stake resource...',
    timeout: 30000,
  });

  if (!result.ok) return false;

  try {
    const data = result.data;
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
    const log = require('../utils/logger');
    log.raw(`\nAccount          : ${owner}`);
    log.raw(`Staked NET       : ${netWeight}`);
    log.raw(`Staked CPU       : ${cpuWeight}`);
    log.raw(`Total Staked     : ${(totalNet + totalCpu).toFixed(4)} VEX`);
    return { netWeight, cpuWeight };
  } catch (e) {
    const log = require('../utils/logger');
    log.error(`Gagal parse data stake resource: ${e.message}`);
    return false;
  }
}

module.exports = { delegateBw, undelegateBw, getStakedResources };