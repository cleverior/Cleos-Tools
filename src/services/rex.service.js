const wallet = require('./wallet.service');
const { runCleos, runCleosJson } = require('../utils/cli');

/**
 * Unstake resources to REX.
 * @param {string} walletName - Wallet name to unlock
 * @param {string} owner - Account owner
 * @param {string} receiver - Receiver account
 * @param {string} netAmount - NET amount (e.g., "10.0000 VEX")
 * @param {string} cpuAmount - CPU amount (e.g., "10.0000 VEX")
 * @param {string} broadcaster - Node URL
 * @returns {Promise<boolean>}
 */
async function unstakeToRex(walletName, owner, receiver, netAmount, cpuAmount, broadcaster) {
  if (!wallet.unlock(walletName)) return false;

  const result = await runCleos([
    '-u', broadcaster,
    'system', 'rex', 'unstaketorex',
    owner,
    receiver,
    netAmount,
    cpuAmount,
    '-p', `${owner}@active`,
  ], {
    actionMsg: 'Memindahkan stake ke REX...',
    successMsg: 'Unstake to REX berhasil.',
    logMsg: `Unstake to REX: ${owner} -> ${receiver} (${netAmount}, ${cpuAmount})`,
    timeout: 120000,
  });

  return result.ok;
}

/**
 * Sell REX tokens.
 * @param {string} walletName - Wallet name to unlock
 * @param {string} owner - Account owner
 * @param {string} rexAmount - REX amount (e.g., "10.0000 REX")
 * @param {string} broadcaster - Node URL
 * @returns {Promise<boolean>}
 */
async function sellRex(walletName, owner, rexAmount, broadcaster) {
  if (!wallet.unlock(walletName)) return false;

  const result = await runCleos([
    '-u', broadcaster,
    'system', 'rex', 'sellrex',
    owner,
    rexAmount,
    '-p', `${owner}@active`,
  ], {
    actionMsg: 'Menjual REX...',
    successMsg: 'Sell REX berhasil.',
    logMsg: `Sell REX: ${owner} (${rexAmount})`,
    timeout: 120000,
  });

  return result.ok;
}

/**
 * Withdraw from REX fund.
 * @param {string} walletName - Wallet name to unlock
 * @param {string} owner - Account owner
 * @param {string} vexAmount - VEX amount (e.g., "10.0000 VEX")
 * @param {string} broadcaster - Node URL
 * @returns {Promise<boolean>}
 */
async function withdrawRex(walletName, owner, vexAmount, broadcaster) {
  if (!wallet.unlock(walletName)) return false;

  const result = await runCleos([
    '-u', broadcaster,
    'system', 'rex', 'withdraw',
    owner,
    vexAmount,
    '-p', `${owner}@active`,
  ], {
    actionMsg: 'Menarik dana dari REX fund...',
    successMsg: 'Withdraw REX fund berhasil.',
    logMsg: `Withdraw REX fund: ${owner} (${vexAmount})`,
    timeout: 120000,
  });

  return result.ok;
}

/**
 * Get REX maturity data for an account.
 * @param {string} owner - Account owner
 * @param {string} broadcaster - Node URL
 * @returns {Promise<string|boolean>} - Matured REX string or false on error
 */
async function getMaturity(owner, broadcaster) {
  const result = await runCleosJson([
    '-u', broadcaster,
    'get', 'table', 'vexcore', 'vexcore', 'rexbal',
    '--lower', owner,
    '--upper', owner,
    '--limit', '1',
  ], {
    actionMsg: 'Mengambil data maturity REX...',
    timeout: 30000,
  });

  if (!result.ok) return false;

  try {
    const data = result.data;
    const row = data.rows && data.rows[0];
    if (!row || row.owner !== owner) {
      const log = require('../utils/logger');
      log.warn('Data REX balance tidak ditemukan.');
      return false;
    }

    const matured = formatRexUnits(row.matured_rex);
    const log = require('../utils/logger');
    log.raw(`\nOwner           : ${row.owner}`);
    log.raw(`REX Balance     : ${row.rex_balance}`);
    log.raw(`Matured REX     : ${matured}`);
    log.raw(`Vote Stake      : ${row.vote_stake}`);
    log.raw(`Maturity Bucket : ${row.rex_maturities?.length || 0}`);
    return matured;
  } catch (e) {
    const log = require('../utils/logger');
    log.error(`Gagal parse data maturity REX: ${e.message}`);
    return false;
  }
}

/**
 * Get withdrawable REX fund balance.
 * @param {string} owner - Account owner
 * @param {string} broadcaster - Node URL
 * @returns {Promise<string|boolean>} - Balance string or false on error
 */
async function getWithdrawable(owner, broadcaster) {
  const result = await runCleosJson([
    '-u', broadcaster,
    'get', 'table', 'vexcore', 'vexcore', 'rexfund',
    '--lower', owner,
    '--upper', owner,
    '--limit', '1',
  ], {
    actionMsg: 'Mengambil saldo withdrawable REX...',
    timeout: 30000,
  });

  if (!result.ok) return false;

  try {
    const data = result.data;
    const row = data.rows && data.rows[0];
    const balance = row && row.owner === owner ? row.balance : '0.0000 VEX';
    const log = require('../utils/logger');
    log.raw(`\nOwner              : ${owner}`);
    log.raw(`Withdrawable Balance: ${balance}`);
    return balance;
  } catch (e) {
    const log = require('../utils/logger');
    log.error(`Gagal parse saldo withdrawable REX: ${e.message}`);
    return false;
  }
}

/**
 * Format raw REX units (integer string) to human-readable 4-decimal format.
 * @param {string|number} value - Raw REX value
 * @returns {string} - Formatted REX (e.g., "1.2345 REX")
 */
function formatRexUnits(value) {
  const raw = String(value || '0');
  if (raw.length <= 4) return `0.${raw.padStart(4, '0')} REX`;
  return `${raw.slice(0, -4)}.${raw.slice(-4)} REX`;
}

module.exports = { unstakeToRex, sellRex, withdrawRex, getMaturity, getWithdrawable, formatRexUnits };
