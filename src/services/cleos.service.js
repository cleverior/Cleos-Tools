const { execSync, spawnSync } = require('child_process');
const ora = require('ora');
const log = require('../utils/logger');

const CLEOS_BIN = 'cleos';

function checkInstalled() {
  try {
    execSync('command -v cleos', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function install() {
  const spinner = ora('Menginstall cleos...').start();
  try {
    execSync(
      'wget -q https://vexascan.com/download/files/vex-spring_1.2.2-ubuntu22.04_amd64.deb -O /tmp/vex-spring.deb && sudo dpkg -i /tmp/vex-spring.deb 2>/dev/null && sudo apt-get install -f -y -q 2>/dev/null',
      { stdio: 'pipe', timeout: 120000 }
    );
    spinner.stop();
    if (checkInstalled()) {
      log.success('cleos berhasil terinstall');
      return true;
    }
    log.error('Gagal menginstall cleos');
    return false;
  } catch (e) {
    spinner.stop();
    log.error(`Gagal menginstall cleos: ${e.stderr?.toString() || e.message}`);
    return false;
  }
}

function exec(args, opts = {}) {
  // Use spawnSync so we capture both stdout and stderr (cleos writes TX IDs to stderr)
  const parts = args.split(/\s+/);
  const child = spawnSync(CLEOS_BIN, parts, {
    stdio: 'pipe',
    timeout: opts.timeout || 30000,
    encoding: 'utf8',
  });

  const stdout = (child.stdout || '').trim();
  const stderr = (child.stderr || '').trim();
  const merged = stdout + '\n' + stderr;

  if (child.status === 0 && !child.error) {
    return { ok: true, stdout: merged, stderr: '' };
  }

  const friendly = friendlyError(merged || child.error?.message || '');
  return { ok: false, stdout: merged, stderr, friendly };
}

function friendlyError(stderr) {
  if (!stderr) return '';
  if (stderr.includes('password')) return 'Password salah.';
  if (stderr.includes('Locked') || stderr.includes('lock'))
    return 'Wallet masih terkunci.';
  if (stderr.includes('Unable to connect'))
    return 'Gagal connect ke broadcaster. Periksa node URL.';
  if (stderr.includes('not found'))
    return 'Wallet tidak ditemukan.';
  if (stderr.includes('exist'))
    return 'Wallet sudah ada.';
  if (stderr.includes('Invalid'))
    return 'Input tidak valid.';

  // Extract cleos assertion message: "assertion failure with message: <msg>"
  const match = stderr.match(/assertion failure with message: (.+?)(?:\n|$)/);
  if (match) return match[1].trim();

  return stderr;
}

function extractTxId(stdout) {
  // "executed transaction: <txid> ..."
  const match = stdout.match(/executed transaction:\s+([a-f0-9]+)/);
  return match ? match[1] : null;
}

function restartKeosd() {
  const wallet = require('./wallet.service');
  const spinner = ora('Merestart keosd...').start();
  try {
    const count = wallet.removeAll();
    execSync('pkill -x keosd 2>/dev/null; sleep 0.5; keosd &', { stdio: 'pipe', timeout: 10000 });
    spinner.stop();
    log.success(`keosd berhasil direstart. ${count} wallet & password dihapus.`);
    return true;
  } catch (e) {
    spinner.stop();
    log.error(`Gagal restart keosd: ${e.message}`);
    return false;
  }
}

module.exports = { checkInstalled, install, exec, extractTxId, restartKeosd };
