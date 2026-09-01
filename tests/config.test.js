const config = require('../src/config');
const fs = require('fs');

console.log('=== Config Tests ===\n');

let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) {
    console.log(`✓ ${name}`);
    passed++;
  } else {
    console.log(`✗ ${name}`);
    failed++;
  }
}

const CONFIG_PATH = require('../src/config').CONFIG_PATH;

// Backup original config
let originalConfig = null;
if (fs.existsSync(CONFIG_PATH)) {
  originalConfig = fs.readFileSync(CONFIG_PATH, 'utf8');
}

// Test config.load() with defaults - first clear any existing config file
if (fs.existsSync(CONFIG_PATH)) {
  fs.unlinkSync(CONFIG_PATH);
}
config.clearCache();
const loaded = config.load();
assert('load returns defaults when no config file', loaded.defaultBroadcaster === 'https://vexascan.com:8443');
assert('load returns defaults broadcasters array', Array.isArray(loaded.broadcasters) && loaded.broadcasters.length === 1);

// Test config.get() returns cached config
const cached = config.get();
assert('get returns cached config', cached === loaded);

// Test config.save() and cache update
config.save({ defaultWallet: 'testwallet', defaultBroadcaster: 'https://test.com' });
const afterSave = config.get();
assert('save updates cache', afterSave.defaultWallet === 'testwallet');
assert('save updates broadcaster', afterSave.defaultBroadcaster === 'https://test.com');

// Test config.load() returns updated config
const reloaded = config.load();
assert('load returns saved config', reloaded.defaultWallet === 'testwallet');

// Test DEFAULTS export
assert('DEFAULTS exported', config.DEFAULTS.defaultBroadcaster === 'https://vexascan.com:8443');

// Test clearCache
config.clearCache();
const afterClear = config.load();
assert('clearCache forces reload', afterClear.defaultWallet === 'testwallet');

// Restore original config
if (originalConfig !== null) {
  fs.writeFileSync(CONFIG_PATH, originalConfig);
} else {
  if (fs.existsSync(CONFIG_PATH)) {
    fs.unlinkSync(CONFIG_PATH);
  }
}
config.clearCache();

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);