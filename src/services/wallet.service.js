const fs = require('fs');
const path = require('path');
const ora = require('ora');
const cleos = require('./cleos.service');
const log = require('../utils/logger');
const valid = require('../utils/validator');
const logfile = require('../utils/logfile');

const WALLET_DIR = path.resolve(process.env.HOME || '/root', 'vex-wallet');
const PASS_DIR = path.resolve(__dirname, '../../passwords');

function listWallets() {
  const result = cleos.exec('wallet list');
  if (!result.ok) return [];
  const known = listWalletFiles();
  const wallets = [];
  const bracket = result.stdout.match(/\[[\s\S]*\]/);
  if (bracket) {
    try {
      const items = JSON.parse(bracket[0]);
      for (const item of items) {
        const name = item.replace(' *', '').trim();
        if (known.includes(name)) {
          wallets.push({ name, unlocked: item.includes('*') });
        }
      }
    } catch (_) {}
  }
  return wallets;
}

function detectPasswordFile(walletName) {
  const candidates = [
    path.resolve(PASS_DIR, `${walletName}_passwd.txt`),
    path.resolve(`${walletName}_passwd.txt`),
    path.resolve(WALLET_DIR, `${walletName}_passwd.txt`),
    path.resolve(__dirname, '../../', `${walletName}_passwd.txt`),
  ];
  for (const fp of candidates) {
    if (fs.existsSync(fp)) return fp;
  }
  return null;
}

function hasPrivateKey(walletName) {
  // First unlock the wallet so we can check private_keys
  const passFile = detectPasswordFile(walletName);
  if (!passFile) return false;

  const password = fs.readFileSync(passFile, 'utf8').trim();
  const result = cleos.exec(`wallet private_keys -n ${walletName} --password ${password}`, { timeout: 10000 });
  // Success means keys exist (output like [["PUBKEY","PVTKEY"]])
  if (result.ok && result.stdout.includes('VEX')) return true;

  // Fallback: try unlocked path
  if (!result.ok && result.stderr.includes('Locked')) return false;
  return result.ok && result.stdout.length > 20;
}

function create(name) {
  if (!valid.notEmpty(name, 'Nama wallet')) return false;

  const passFile = path.join(PASS_DIR, `${name}_passwd.txt`);
  const spinner = ora(`Membuat wallet ${name}...`).start();
  const result = cleos.exec(`wallet create -n ${name} -f ${passFile}`);
  spinner.stop();

  if (result.ok) {
    log.success('Wallet berhasil dibuat');
    log.info(`Wallet Name: ${name}`);
    log.info(`Password File: ${path.basename(passFile)}`);
    log.info(`Lokasi: ${passFile}`);
    logfile.append(`Wallet created: ${name}`);
    return true;
  }
  log.error(result.friendly || 'Gagal membuat wallet');
  return false;
}

function importKey(name, privateKey) {
  if (!valid.notEmpty(name, 'Nama wallet')) return false;
  if (!valid.notEmpty(privateKey, 'Private Key')) return false;

  const spinner = ora('Mengimport private key...').start();
  const result = cleos.exec(`wallet import --private-key ${privateKey} -n ${name}`);
  spinner.stop();

  if (result.ok) {
    log.success('Private Key berhasil diimport');
    logfile.append(`Key imported to wallet: ${name}`);
    return true;
  }
  log.error(result.friendly || 'Gagal mengimport private key');
  return false;
}

function unlock(name, passFile) {
  const list = listWallets();
  const found = list.find(w => w.name === name);
  if (found && found.unlocked) {
    log.info('Wallet sudah dalam keadaan unlock.');
    return true;
  }

  // auto-detect password file if not provided
  if (!passFile) passFile = detectPasswordFile(name);
  if (!passFile) {
    log.error('File password tidak ditemukan.');
    return false;
  }
  if (!valid.fileExists(passFile)) return false;

  const password = fs.readFileSync(passFile, 'utf8').trim();
  const spinner = ora('Membuka wallet...').start();
  const result = cleos.exec(`wallet unlock -n ${name} --password ${password}`, { timeout: 10000 });
  spinner.stop();

  if (result.ok) {
    log.success('Wallet berhasil dibuka');
    logfile.append(`Wallet unlocked: ${name}`);
    return true;
  }
  log.error(result.friendly || 'Gagal membuka wallet');
  return false;
}

function unlockAll() {
  const list = listWallets();
  if (list.length === 0) {
    log.info('Tidak ada wallet untuk dibuka.');
    return;
  }
  let ok = 0;
  for (const w of list) {
    if (unlock(w.name)) ok++;
  }
  if (ok === 0) log.error('Gagal membuka semua wallet.');
}

function lock(name) {
  const spinner = ora(`Mengunci wallet ${name}...`).start();
  const result = cleos.exec(`wallet lock -n ${name}`);
  spinner.stop();

  if (result.ok) return true;
  if (result.stderr.includes('already')) return true;
  return false;
}

function lockAll() {
  const list = listWallets();
  if (list.length === 0) {
    log.info('Tidak ada wallet untuk dikunci.');
    return;
  }
  let ok = 0;
  for (const w of list) {
    if (lock(w.name)) {
      log.success(`Wallet ${w.name} berhasil dikunci`);
      logfile.append(`Wallet locked: ${w.name}`);
      ok++;
    }
  }
  if (ok === 0) log.error('Gagal mengunci semua wallet.');
}

function getVotedProducer(name, broadcaster) {
  const result = cleos.exec(`-u ${broadcaster} get table vexcore vexcore voters --lower ${name} --limit 1`);
  if (!result.ok) return '-';
  try {
    const data = JSON.parse(result.stdout);
    if (data.rows && data.rows[0] && data.rows[0].producers && data.rows[0].producers.length > 0) {
      return data.rows[0].producers.join(', ');
    }
  } catch (_) {}
  return '-';
}

function getInfo(name, broadcaster) {
  const list = listWallets();
  const found = list.find(w => w.name === name);
  const passFile = detectPasswordFile(name);
  const hasKey = hasPrivateKey(name);
  const votedBp = getVotedProducer(name, broadcaster);

  return {
    name,
    unlocked: found ? found.unlocked : false,
    exists: !!found,
    passFile,
    hasKey,
    votedBp,
  };
}

function listWalletFiles() {
  try {
    return fs.readdirSync(WALLET_DIR)
      .filter(f => f.endsWith('.wallet'))
      .map(f => f.replace('.wallet', ''));
  } catch { return []; }
}

function remove(names) {
  if (!names || names.length === 0) return false;
  let ok = 0;
  for (const name of names) {
    cleos.exec(`wallet lock -n ${name}`);
    const walletFile = path.resolve(WALLET_DIR, `${name}.wallet`);
    if (fs.existsSync(walletFile)) {
      fs.unlinkSync(walletFile);
      ok++;
    }
    const passFile = detectPasswordFile(name);
    if (passFile && fs.existsSync(passFile)) {
      fs.unlinkSync(passFile);
    }
    logfile.append(`Wallet deleted: ${name}`);
  }
  return ok;
}

function removeAll() {
  const files = listWalletFiles();
  for (const name of files) {
    cleos.exec(`wallet lock -n ${name}`);
    const walletFile = path.resolve(WALLET_DIR, `${name}.wallet`);
    if (fs.existsSync(walletFile)) fs.unlinkSync(walletFile);
    const passFile = detectPasswordFile(name);
    if (passFile && fs.existsSync(passFile)) fs.unlinkSync(passFile);
    logfile.append(`Wallet deleted: ${name}`);
  }
  return files.length;
}

module.exports = { listWallets, listWalletFiles, create, importKey, unlock, unlockAll, lock, lockAll, getInfo, getVotedProducer, detectPasswordFile, remove, removeAll };
