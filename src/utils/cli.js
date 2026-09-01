const ora = require('ora');
const cleos = require('../services/cleos.service');
const log = require('./logger');
const logfile = require('./logfile');

/**
 * Common pattern: run cleos command with spinner, error handling, TX ID extraction, logging.
 * @param {Array<string>|string} args - cleos arguments (array or space-separated string)
 * @param {Object} opts - options
 * @param {string} opts.actionMsg - spinner message (default: 'Processing...')
 * @param {string} opts.successMsg - success message (default: 'Success.')
 * @param {string} opts.logMsg - logfile entry prefix (optional)
 * @param {number} opts.timeout - timeout in ms (default: 60000)
 * @param {boolean} opts.showTxId - show TX ID if found (default: true)
 * @returns {Promise<{ok: boolean, txId?: string, stdout?: string}>}
 */
async function runCleos(args, opts = {}) {
  const {
    actionMsg = 'Memproses...',
    successMsg = 'Berhasil.',
    logMsg = '',
    timeout = 60000,
    showTxId = true,
  } = opts;

  const spinner = ora(actionMsg).start();
  const parts = Array.isArray(args) ? args : args.split(/\s+/).filter(Boolean);
  const result = cleos.exec(parts, { timeout });
  spinner.stop();

  if (!result.ok) {
    log.error(result.friendly || 'Proses gagal');
    return { ok: false, stdout: result.stdout };
  }

  const txId = cleos.extractTxId(result.stdout);
  if (txId && showTxId) {
    log.success(`Proses berhasil dengan TX ID: ${txId}`);
  } else {
    log.success(successMsg);
  }

  if (logMsg) {
    logfile.append(logMsg);
  }

  return { ok: true, txId, stdout: result.stdout };
}

/**
 * Run cleos command that expects JSON output (for read-only queries).
 * @param {Array<string>|string} args - cleos arguments
 * @param {Object} opts - options
 * @param {string} opts.actionMsg - spinner message
 * @param {number} opts.timeout - timeout in ms
 * @returns {Promise<{ok: boolean, data?: Object, error?: string}>}
 */
async function runCleosJson(args, opts = {}) {
  const { actionMsg = 'Mengambil data...', timeout = 30000 } = opts;

  const spinner = ora(actionMsg).start();
  const parts = Array.isArray(args) ? args : args.split(/\s+/).filter(Boolean);
  const result = cleos.exec(parts, { timeout });
  spinner.stop();

  if (!result.ok) {
    log.error(result.friendly || 'Gagal mengambil data');
    return { ok: false, error: result.friendly };
  }

  try {
    const data = JSON.parse(result.stdout);
    return { ok: true, data };
  } catch (e) {
    log.error(`Gagal parse JSON: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

module.exports = { runCleos, runCleosJson };