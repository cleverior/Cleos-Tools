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

/**
 * Check unstake refund status for an account.
 * Returns pending refunds that are not yet claimable (within 3-day period) and claimable ones.
 * @param {string} owner - Account owner
 * @param {string} broadcaster - Node URL
 * @returns {Promise<{pending: Array, claimable: Array, totalPending: string, totalClaimable: string}|boolean>}
 */
async function getUnstakeStatus(owner, broadcaster) {
  const result = await runCleosJson([
    '-u', broadcaster,
    'get', 'table', 'vexcore', owner, 'refunds',
  ], {
    actionMsg: 'Mengambil status unstake (refund)...',
    timeout: 30000,
  });

  if (!result.ok) return false;

  try {
    const data = result.data;
    const log = require('../utils/logger');
    const pending = [];
    const claimable = [];
    let totalPending = 0;
    let totalClaimable = 0;

    if (data.rows && Array.isArray(data.rows)) {
      for (const row of data.rows) {
          const net = parseFloat(row.net_amount || '0');
          const cpu = parseFloat(row.cpu_amount || '0');
          const total = net + cpu;
          const requestTime = row.request_time;
          const now = Date.now();
          const requestTimeMs = new Date(requestTime).getTime();
          const elapsedHours = (now - requestTimeMs) / (1000 * 60 * 60);
          const isClaimable = elapsedHours >= 72;

          const entry = {
            netAmount: net.toFixed(4) + ' VEX',
            cpuAmount: cpu.toFixed(4) + ' VEX',
            totalAmount: total.toFixed(4) + ' VEX',
            requestTime,
            elapsedHours: elapsedHours.toFixed(2),
            isClaimable,
          };

          if (isClaimable) {
            claimable.push(entry);
            totalClaimable += total;
          } else {
            pending.push(entry);
            totalPending += total;
          }
      }
    }

    log.raw(`\nAccount: ${owner}`);
    log.raw(`────────────────────────────────────────`);
    if (pending.length > 0) {
      log.raw(`${require('chalk').yellow('⏳ Belum bisa claim (kurang dari 3 hari / 72 jam):')}`);
      for (const p of pending) {
        log.raw(`  NET: ${p.netAmount}  CPU: ${p.cpuAmount}  Total: ${p.totalAmount}`);
        log.raw(`    Request: ${p.requestTime}  (${p.elapsedHours} jam lalu)`);
      }
      log.raw(`  Total Pending: ${totalPending.toFixed(4)} VEX`);
    }
    if (claimable.length > 0) {
      log.raw(`${require('chalk').green('✅ Siap claim (sudah lewat 3 hari / 72 jam):')}`);
      for (const c of claimable) {
        log.raw(`  NET: ${c.netAmount}  CPU: ${c.cpuAmount}  Total: ${c.totalAmount}`);
        log.raw(`    Request: ${c.requestTime}  (${c.elapsedHours} jam lalu)`);
      }
      log.raw(`  Total Claimable: ${totalClaimable.toFixed(4)} VEX`);
      log.raw(`  → Gunakan menu 'Claim Refund' atau: cleos push action vexcore refund '{"owner":"<account>"}' -p <account>@active`);
    }
    if (pending.length === 0 && claimable.length === 0) {
      log.raw('Tidak ada refund pending.');
    }
    log.raw(`────────────────────────────────────────`);

    return {
      pending,
      claimable,
      totalPending: totalPending.toFixed(4) + ' VEX',
      totalClaimable: totalClaimable.toFixed(4) + ' VEX',
    };
  } catch (e) {
    const log = require('../utils/logger');
    log.error(`Gagal parse data unstake status: ${e.message}`);
    return false;
  }
}

/**
 * Claim unstake refund (vexcore::refund) for an account.
 * Funds are only claimable after the 3-day / 72-hour waiting period.
 * Note: Wallet must be unlocked before calling this function.
 * @param {string} walletName - Wallet name (for logging only)
 * @param {string} owner - Account to claim refund for
 * @param {string} broadcaster - Node URL
 * @returns {Promise<boolean>}
 */
async function claimRefund(walletName, owner, broadcaster) {
  const result = await runCleos([
    '-u', broadcaster,
    'push', 'action', 'vexcore', 'refund',
    `{"owner":"${owner}"}`,
    '-p', `${owner}@active`,
  ], {
    actionMsg: `Claim refund untuk ${owner}...`,
    successMsg: 'Refund berhasil diklaim.',
    logMsg: `Claim refund: ${owner}`,
    timeout: 120000,
  });

  return result.ok;
}

module.exports = { delegateBw, undelegateBw, getStakedResources, getUnstakeStatus, claimRefund };