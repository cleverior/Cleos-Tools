const fs = require('fs');
const log = require('./logger');

function notEmpty(value, name) {
  if (!value || !value.trim()) {
    log.error(`${name} tidak boleh kosong.`);
    return false;
  }
  return true;
}

function fileExists(filepath) {
  if (!fs.existsSync(filepath)) {
    log.error(`File tidak ditemukan: ${filepath}`);
    return false;
  }
  return true;
}

module.exports = { notEmpty, fileExists };
