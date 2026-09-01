const cleos = require('./cleos.service');
const log = require('../utils/logger');
const logfile = require('../utils/logfile');
const wallet = require('./wallet.service');
const ora = require('ora');

/**
 * Get token balances for an account.
 * @param {string} account - Account name
 * @param {string} broadcaster - Node URL
 * @returns {Array<{amount: string, symbol: string}>} - Array of token balances
 */
function getTokens(account, broadcaster) {
  const result = cleos.exec(['-u', broadcaster, 'get', 'currency', 'balance', 'vex.token', account]);
  if (!result.ok) return [];
  const parts = result.stdout.trim().split(/\s+/);
  const tokens = [];
  for (let i = 0; i < parts.length; i += 2) {
    if (parts[i + 1]) tokens.push({ amount: parts[i], symbol: parts[i + 1] });
  }
  return tokens;
}

/**
 * Sanitize memo to prevent injection/parsing issues.
 * Removes control characters and limits length to 256 chars.
 * @param {string} memo - User-provided memo
 * @returns {string} - Sanitized memo
 */
function sanitizeMemo(memo) {
  if (!memo) return '';
  return memo.replace(/[\x00-\x1F\x7F]/g, '').slice(0, 256);
}

/**
 * Transfer tokens between accounts.
 * @param {string} walletName - Wallet name to unlock
 * @param {string} from - Sender account
 * @param {string} to - Receiver account
 * @param {string} amount - Amount (e.g., "10.0000")
 * @param {string} symbol - Token symbol (e.g., "VEX")
 * @param {string} broadcaster - Node URL
 * @param {string} memo - Optional memo
 * @returns {Promise<boolean>}
 */
async function transfer(walletName, from, to, amount, symbol, broadcaster, memo = '') {
  if (!wallet.unlock(walletName)) return false;
  const safeMemo = sanitizeMemo(memo);
  const spinner = ora('Mengirim token...').start();
  const result = cleos.exec([
    '-u', broadcaster,
    'transfer', from, to, `${amount} ${symbol}`, safeMemo,
    '-p', `${from}@active`
  ], { timeout: 60000 });
  spinner.stop();

  if (!result.ok) {
    log.error(result.friendly || 'Gagal mengirim token');
    return false;
  }
  log.success('Token berhasil dikirim.');
  logfile.append(`Transfer: ${from} -> ${to} ${amount} ${symbol} (Memo: ${safeMemo})`);
  return true;
}

module.exports = { getTokens, transfer, sanitizeMemo };