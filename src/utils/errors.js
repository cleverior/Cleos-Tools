const log = require('./logger');
const logfile = require('./logfile');

/**
 * Standardized error result object.
 * @typedef {Object} ErrorResult
 * @property {boolean} ok - Always false
 * @property {string} error - Error message
 * @property {string} context - Context where error occurred
 */

/**
 * Create a standardized error result.
 * @param {string} error - Error message
 * @param {string} context - Context where error occurred
 * @returns {ErrorResult}
 */
function createError(error, context) {
  return { ok: false, error, context };
}

/**
 * Handle cleos result and return standardized format.
 * @param {Object} result - cleos.exec result
 * @param {string} context - Context for error message
 * @param {string} [successMsg='Berhasil.'] - Success message
 * @param {string} [logMsg] - Log file entry
 * @returns {{ok: boolean, txId?: string, error?: string}}
 */
function handleResult(result, context, successMsg = 'Berhasil.', logMsg) {
  if (!result.ok) {
    log.error(result.friendly || `${context} gagal`);
    return { ok: false, error: result.friendly };
  }

  const txId = require('../services/cleos.service').extractTxId(result.stdout);
  if (txId) {
    log.success(`Proses berhasil dengan TX ID: ${txId}`);
  } else {
    log.success(successMsg);
  }

  if (logMsg) {
    logfile.append(logMsg);
  }

  return { ok: true, txId };
}

/**
 * Wrap an async function with standardized error handling.
 * @param {Function} fn - Async function to wrap
 * @param {string} context - Context for error messages
 * @returns {Promise<*>}
 */
async function wrapAsync(fn, context) {
  try {
    return await fn();
  } catch (e) {
    log.error(`${context}: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

module.exports = {
  createError,
  handleResult,
  wrapAsync,
};