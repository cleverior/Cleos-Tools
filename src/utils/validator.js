const fs = require('fs');
const log = require('./logger');

/**
 * Check if value is not empty (required field validation).
 * @param {string} value - Value to check
 * @param {string} name - Field name for error message
 * @returns {boolean}
 */
function notEmpty(value, name) {
  if (!value || !value.trim()) {
    log.error(`${name} tidak boleh kosong.`);
    return false;
  }
  return true;
}

/**
 * Check if file exists.
 * @param {string} filepath - Path to file
 * @returns {boolean}
 */
function fileExists(filepath) {
  if (!fs.existsSync(filepath)) {
    log.error(`File tidak ditemukan: ${filepath}`);
    return false;
  }
  return true;
}

/**
 * Validate EOSIO/Vexanium account name format (1-12 chars, a-z, 1-5, .).
 * @param {string} value - Account name
 * @returns {boolean}
 */
function isAccountName(value) {
  return /^[a-z1-5.]{1,12}$/.test((value || '').trim());
}

/**
 * Validate asset format (e.g., "10.0000 VEX").
 * @param {string} value - Asset string
 * @param {string} symbol - Expected symbol (e.g., "VEX")
 * @returns {boolean}
 */
function isAsset(value, symbol) {
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^\\d+(?:\\.\\d{4})? ${escaped}$`).test((value || '').trim());
}

/**
 * Parse and format user input to 4-decimal asset string.
 * - Empty input -> "0.0000 SYMBOL"
 * - Integer "25" -> "25.0000 SYMBOL"
 * - "25.001" -> "25.0010 SYMBOL"
 * - "25.0001" -> "25.0001 SYMBOL"
 * @param {string} value - User input
 * @param {string} symbol - Token symbol (e.g., "VEX")
 * @returns {string|null} - Formatted asset or null if invalid
 */
function parseAssetInput(value, symbol) {
  const trimmed = (value || '').trim();
  if (!trimmed) return `0.0000 ${symbol}`;
  // Check if trimmed is a valid number (integer or decimal)
  // Regex: optional minus, digits, optional decimal point with digits
  // But we don't allow negative amounts for resources
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const num = parseFloat(trimmed);
  return num.toFixed(4) + ' ' + symbol;
}

/**
 * Validate private key format (WIF - starts with 5, K, L).
 * @param {string} key - Private key
 * @returns {boolean}
 */
function isPrivateKey(key) {
  const trimmed = (key || '').trim();
  // WIF format: 51-52 chars, starts with 5, K, or L
  return /^[5KL][1-9A-HJ-NP-Za-km-z]{50,51}$/.test(trimmed);
}

/**
 * Validate public key format (EOS/VEX prefix).
 * @param {string} key - Public key
 * @returns {boolean}
 */
function isPublicKey(key) {
  const trimmed = (key || '').trim();
  return /^VEX[1-9A-HJ-NP-Za-km-z]{50,}$/.test(trimmed);
}

/**
 * Validate that at least one of NET or CPU amount is > 0.
 * @param {string} netAmount - NET asset string (e.g., "10.0000 VEX")
 * @param {string} cpuAmount - CPU asset string
 * @returns {boolean}
 */
function hasResourceAmount(netAmount, cpuAmount) {
  const parseAmount = (asset) => parseFloat((asset || '0').split(' ')[0]);
  return parseAmount(netAmount) > 0 || parseAmount(cpuAmount) > 0;
}

/**
 * Validate broadcaster URL format.
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
function isBroadcasterUrl(url) {
  const trimmed = (url || '').trim();
  return /^https?:\/\/.+/.test(trimmed);
}

/**
 * Validate wallet name (alphanumeric, underscore, dash).
 * @param {string} name - Wallet name
 * @returns {boolean}
 */
function isWalletName(name) {
  return /^[a-zA-Z0-9_-]{1,64}$/.test((name || '').trim());
}

module.exports = {
  notEmpty,
  fileExists,
  isAccountName,
  isAsset,
  parseAssetInput,
  isPrivateKey,
  isPublicKey,
  hasResourceAmount,
  isBroadcasterUrl,
  isWalletName,
};
