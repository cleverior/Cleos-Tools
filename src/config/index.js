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

function load() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) };
    }
  } catch (_) { /* ignore corrupt config, use defaults */ }
  return { ...DEFAULTS };
}

function save(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

module.exports = { load, save, CONFIG_PATH };
