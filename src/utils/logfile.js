const fs = require('fs');
const path = require('path');

const LOG_PATH = path.resolve(__dirname, '../../activity.log');

function append(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_PATH, line, 'utf8');
}

module.exports = { append, LOG_PATH };
