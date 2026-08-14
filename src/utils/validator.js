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

function isAccountName(value) {
  return /^[a-z1-5.]{1,12}$/.test((value || '').trim());
}

function isAsset(value, symbol) {
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^\\d+(?:\\.\\d{4})? ${escaped}$`).test((value || '').trim());
}

module.exports = { notEmpty, fileExists, isAccountName, isAsset };
