const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.resolve(__dirname, '../../config.json');

const DEFAULTS = {
  defaultWallet: '',
  defaultPasswordFile: '',
  defaultBroadcaster: 'https://vexascan.com:8443',
  broadcasters: ['https://vexascan.com:8443'], // list of saved nodes
  bpMapping: {},
};

let _cachedConfig = null;

/**
 * Load config with caching (singleton pattern).
 * First call reads from disk, subsequent calls return cached config.
 * @returns {Object}
 */
function load() {
  if (_cachedConfig) return _cachedConfig;

  try {
    if (fs.existsSync(CONFIG_PATH)) {
      _cachedConfig = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) };
      return _cachedConfig;
    }
  } catch (_) { /* ignore corrupt config, use defaults */ }
  _cachedConfig = { ...DEFAULTS };
  return _cachedConfig;
}

/**
 * Save config and update cache.
 * @param {Object} config - Config object to save
 */
function save(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
  _cachedConfig = { ...DEFAULTS, ...config };
}

/**
 * Get current cached config (loads if not cached).
 * @returns {Object}
 */
function get() {
  return load();
}

/**
 * Clear cache (useful for testing or after external config changes).
 */
function clearCache() {
  _cachedConfig = null;
}

module.exports = { load, save, get, clearCache, CONFIG_PATH, DEFAULTS };
