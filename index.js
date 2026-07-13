#!/usr/bin/env node
const cleos = require('./src/services/cleos.service');
const wallet = require('./src/services/wallet.service');
const voteService = require('./src/services/vote.service');
const rewardService = require('./src/services/reward.service');
const health = require('./src/services/health.service');
const config = require('./src/config');
const log = require('./src/utils/logger');
const validator = require('./src/utils/validator');
const logfile = require('./src/utils/logfile');
const header = require('./src/ui/header');
const menu = require('./src/ui/menu');
const inquirer = require('inquirer');
const RL = require('readline');

// ── ESC handling ──────────────────────────────────────────────────────
// Monkey-patch readline to track the active instance for ESC-to-close
const origCreateInterface = RL.createInterface;
let activeRl = null;
RL.createInterface = function (opts) {
  activeRl = origCreateInterface(opts);
  return activeRl;
};

if (process.stdin.isTTY) {
  RL.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on('keypress', (str, key) => {
    if (key && key.name === 'escape' && activeRl) {
      const rl = activeRl;
      activeRl = null;
      rl.close(); // triggers prompt rejection → caught by escPrompt
    }
  });
}

// Wrap inquirer.prompt — ESC closes the rl, which rejects with ERR_USE_AFTER_CLOSE
async function escPrompt(questions) {
  try {
    return await inquirer.prompt(questions);
  } catch (e) {
    return { __esc: true };
  }
}

// replace inquirer.prompt with escPrompt everywhere
const $ = escPrompt;

// ── boot ──────────────────────────────────────────────────────────────

async function boot() {
  header.showBanner();

  if (!cleos.checkInstalled()) {
    log.warn('cleos belum terinstall. Mencoba install otomatis...');
    const ok = cleos.install();
    if (!ok) {
      log.error('cleos tidak terinstall. Aplikasi tidak dapat berjalan.');
      process.exit(1);
    }
  } else {
    log.success('cleos tersedia');
  }
}

// ── prompt helpers ────────────────────────────────────────────────────

async function promptWallet(allowNone = false) {
  const wallets = wallet.listWallets();
  if (wallets.length === 0 && !allowNone) {
    log.warn('Belum ada wallet. Buat wallet dulu.');
    return null;
  }
  if (wallets.length === 0) return null;

  const choices = wallets.map(w => ({
    name: `${w.name} ${w.unlocked ? '(Unlocked)' : '(Locked)'}`,
    value: w.name,
  }));
  if (allowNone) choices.unshift({ name: '(kembali)', value: null });

  const { selected } = await $([
    { type: 'list', name: 'selected', message: 'Pilih wallet', choices },
  ]);
  if (selected && selected.__esc) return null;
  return selected;
}

async function confirm(msg) {
  const r = await $([
    { type: 'confirm', name: 'ok', message: msg, default: false },
  ]);
  if (r.__esc) return null;
  return r.ok;
}

async function input(msg, def, opts) {
  const validation = (opts && opts.validate) || (v => !!v.trim() || 'Tidak boleh kosong');
  const r = await $([
    { type: 'input', name: 'val', message: msg, default: def || '', validate: validation },
  ]);
  if (r.__esc) return null;
  return r.val ? r.val.trim() : null;
}

async function password(msg) {
  const r = await $([
    { type: 'password', name: 'val', message: msg, validate: v => !!v.trim() || 'Tidak boleh kosong' },
  ]);
  if (r.__esc) return null;
  return r.val ? r.val.trim() : null;
}

// ── menu actions ──────────────────────────────────────────────────────

async function doCreate() {
  const name = await input('Nama Wallet:');
  if (!name) return;
  wallet.create(name);
}

function doOpen() {
  const files = wallet.listWalletFiles();
  if (files.length === 0) {
    log.info('Tidak ada file wallet di ~/vex-wallet/.');
    return;
  }

  let ok = 0;
  for (const name of files) {
    const r = cleos.exec(`wallet open -n ${name}`);
    if (r.ok) ok++;
  }

  if (ok > 0) {
    log.success(`${ok} wallet berhasil dibuka`);
    logfile.append(`Opened ${ok} wallets`);
  }
  if (ok < files.length) {
    log.warn(`${files.length - ok} wallet gagal dibuka (mungkin sudah open)`);
  }
}

async function doImport() {
  const wallets = wallet.listWallets();
  if (wallets.length === 0) {
    log.warn('Belum ada wallet. Buat wallet dulu via menu 1.');
    return;
  }
  const selectedName = await promptWallet();
  if (!selectedName) return;

  const pk = await password('Private Key:');
  if (!pk) return;
  wallet.importKey(selectedName, pk);
}

async function doUnlock() {
  const wallets = wallet.listWallets();
  if (wallets.length === 0) {
    log.warn('Belum ada wallet.');
    return;
  }

  const { mode } = await $([
    {
      type: 'list', name: 'mode', message: 'Pilih mode unlock:',
      choices: [
        { name: 'Unlock satu wallet', value: 'single' },
        { name: 'Unlock semua wallet', value: 'all' },
      ],
    },
  ]);
  if (mode.__esc) return;

  if (mode === 'all') {
    wallet.unlockAll();
    return;
  }

  const selectedName = await promptWallet();
  if (!selectedName) return;

  const passFile = wallet.detectPasswordFile(selectedName);
  if (!passFile) {
    log.error(`File password untuk "${selectedName}" tidak ditemukan.`);
    return;
  }
  wallet.unlock(selectedName, passFile);
}

async function doLock() {
  wallet.lockAll();
}

async function doVote() {
  const cfg = config.load();
  const selectedName = await promptWallet();
  if (!selectedName) return;

  if (!health.healthCheck(cfg.defaultBroadcaster)) {
    const proceed = await confirm('Broadcaster tidak merespon. Lanjutkan?');
    if (!proceed) return;
  }

  const voter = await input('Voter Account:');
  if (!voter) return;
  const bpName = await input('Nama Block Producer:');
  if (!bpName) return;

  const ok = await confirm(`Vote ${voter} -> ${bpName}?`);
  if (!ok) { log.info('Dibatalkan.'); return; }

  voteService.vote(selectedName, voter, bpName, cfg.defaultBroadcaster);
}

async function doVoteAll() {
  const cfg = config.load();
  const mapping = cfg.bpMapping || {};
  if (Object.keys(mapping).length === 0) {
    log.warn('Belum ada BP Mapping. Define dulu via menu Define BP Mapping.');
    return;
  }

  const ok = await confirm('Vote semua wallet ke BP masing-masing?');
  if (!ok) { log.info('Dibatalkan.'); return; }

  for (const [walletName, bpName] of Object.entries(mapping)) {
    if (!bpName) continue;
    log.raw('');
    log.info(`Voting ${walletName} -> ${bpName}...`);
    wallet.unlock(walletName);
    voteService.vote(walletName, walletName, bpName, cfg.defaultBroadcaster);
  }
}

async function doClaim() {
  const cfg = config.load();
  const selectedName = await promptWallet();
  if (!selectedName) return;

  const bpName = selectedName;

  if (!health.healthCheck(cfg.defaultBroadcaster)) {
    const proceed = await confirm('Broadcaster tidak merespon. Lanjutkan?');
    if (!proceed) return;
  }

  const ok = await confirm(`Klaim reward untuk ${bpName}?`);
  if (!ok) { log.info('Dibatalkan.'); return; }

  rewardService.claim(selectedName, bpName, cfg.defaultBroadcaster);
}

async function doInfo() {
  const cfg = config.load();
  const wallets = wallet.listWallets();

  if (wallets.length === 0) {
    log.info('Belum ada wallet.');
  } else {
    for (const w of wallets) {
      const info = wallet.getInfo(w.name, cfg.defaultBroadcaster);
      console.log(`\n${'─'.repeat(46)}`);
      log.raw(`  ${require('chalk').bold('Wallet')}          : ${info.name}`);
      log.raw(`  ${require('chalk').bold('Status')}          : ${info.unlocked ? require('chalk').green('Unlocked') : require('chalk').yellow('Locked')}`);
      log.raw(`  ${require('chalk').bold('Password File')}   : ${info.passFile ? require('chalk').green('Ada') : require('chalk').red('Tidak ada')}`);
      log.raw(`  ${require('chalk').bold('Private Key')}     : ${info.hasKey ? require('chalk').green('Sudah diimport') : require('chalk').red('Belum diimport')}`);
      log.raw(`  ${require('chalk').bold('Voted BP')}        : ${require('chalk').cyan(info.votedBp)}`);
    }
  }
  console.log(`\n${'─'.repeat(46)}`);
  log.raw(`  ${require('chalk').bold('Default Wallet')}  : ${cfg.defaultWallet || '-'}`);
  log.raw(`  ${require('chalk').bold('Broadcaster')}     : ${cfg.defaultBroadcaster}`);
}

async function doBpMapping() {
  const cfg = config.load();
  const wallets = wallet.listWallets();
  if (wallets.length === 0) {
    log.warn('Belum ada wallet. Buat wallet dulu.');
    return;
  }

  const mapping = { ...(cfg.bpMapping || {}) };
  for (const w of wallets) {
    // Auto-detect current voted BP from chain
    const currentVote = wallet.getVotedProducer(w.name, cfg.defaultBroadcaster);
    const defaultValue = mapping[w.name] || (currentVote !== '-' ? currentVote : '');

    const { val } = await $([
      { type: 'input', name: 'val', message: `BP target untuk "${w.name}" (kosongkan = skip):`, default: defaultValue },
    ]);
    if (val.__esc) return;
    mapping[w.name] = val.trim();
  }

  cfg.bpMapping = mapping;
  config.save(cfg);
  log.success('BP Mapping disimpan.');
}

async function doNodes() {
  const cfg = config.load();
  const nodes = cfg.broadcasters || [];
  if (nodes.length === 0) nodes.push(cfg.defaultBroadcaster);

  const { action } = await $([
    {
      type: 'list', name: 'action', message: 'Broadcaster Nodes',
      choices: [
        { name: 'Tambah node', value: 'add' },
        { name: 'Hapus node', value: 'del' },
        { name: 'Pilih node aktif', value: 'select' },
        { name: 'Kembali', value: 'back' },
      ],
    },
  ]);
  if (action.__esc || action === 'back') return;

  if (action === 'add') {
    const url = await input('Node URL (contoh: https://api.vexanium.com):', 'https://', { validate: v => v.startsWith('http') || 'URL harus dimulai dengan http' });
    if (!url) return;
    if (nodes.includes(url)) { log.warn('Node sudah ada.'); return; }
    nodes.push(url);
    cfg.broadcasters = nodes;
    if (!cfg.defaultBroadcaster) cfg.defaultBroadcaster = url;
    config.save(cfg);
    log.success('Node ditambahkan.');
    return;
  }

  if (action === 'del') {
    if (nodes.length <= 1) { log.warn('Setidaknya harus ada 1 node.'); return; }
    const { selected } = await $([
      { type: 'list', name: 'selected', message: 'Pilih node yang akan dihapus:', choices: nodes.map(n => ({ name: n, value: n })) },
    ]);
    if (selected.__esc) return;
    const filtered = nodes.filter(n => n !== selected);
    cfg.broadcasters = filtered;
    if (cfg.defaultBroadcaster === selected) cfg.defaultBroadcaster = filtered[0];
    config.save(cfg);
    log.success('Node dihapus.');
    return;
  }

  if (action === 'select') {
    const { selected } = await $([
      { type: 'list', name: 'selected', message: 'Pilih node aktif:', choices: nodes.map(n => ({ name: n + (n === cfg.defaultBroadcaster ? ' ⭐' : ''), value: n })) },
    ]);
    if (selected.__esc) return;
    cfg.defaultBroadcaster = selected;
    config.save(cfg);
    log.success(`Node aktif: ${selected}`);
  }
}

async function doDelete() {
  const files = wallet.listWalletFiles();
  if (files.length === 0) {
    log.info('Tidak ada file wallet.');
    return;
  }

  const { selected } = await $([
    {
      type: 'checkbox',
      name: 'selected',
      message: 'Pilih wallet yang ingin dihapus (spasi = centang):',
      choices: files.map(f => ({ name: f, value: f })),
      validate: v => v.length > 0 || 'Pilih minimal satu wallet',
    },
  ]);
  if (selected.__esc) return;

  const ok = await confirm(`Hapus ${selected.length} wallet?`);
  if (!ok) { log.info('Dibatalkan.'); return; }

  const deleted = wallet.remove(selected);
  for (const name of selected) {
    if (deleted) log.success(`Wallet ${name} berhasil dihapus`);
  }
}

// ── main loop ─────────────────────────────────────────────────────────

function clearScreen() {
  if (process.stdin.isTTY) process.stdout.write('\x1Bc');
}

async function pause() {
  await $([{ type: 'input', name: 'cont', message: 'Tekan Enter untuk melanjutkan...' }]);
}

async function main() {
  clearScreen();
  await boot();

  let running = true;
  while (running) {
    clearScreen();
    const wallets = wallet.listWallets();
    const cfg = config.load();
    header.showDashboard(wallets, cfg);

    let choice;
    try {
      choice = await menu.mainMenu();
    } catch (e) {
      if (e.code === 'ERR_USE_AFTER_CLOSE') break;
      throw e;
    }
    switch (choice) {
      case 'create':    await doCreate(); break;
      case 'import':    await doImport(); break;
      case 'open':      doOpen(); break;
      case 'unlock':    await doUnlock(); break;
      case 'lock':      await doLock(); break;
      case 'vote':      await doVote(); break;
      case 'voteAll':   await doVoteAll(); break;
      case 'claim':     await doClaim(); break;
      case 'info':      await doInfo(); break;
      case 'bpMap':     await doBpMapping(); break;
      case 'nodes':     await doNodes(); break;
      case 'restart':
        log.raw(require('chalk').yellow('\n⚠️  PERHATIAN: Restart keosd akan menghapus semua wallet dari daftar.\n   Wallet yang sudah diimport perlu diimport ulang secara manual.\n'));
        { const ok = await confirm('Lanjutkan restart?');
          if (!ok) { log.info('Dibatalkan.'); break; }
          cleos.restartKeosd();
        } break;
      case 'delete':    await doDelete(); break;
      case 'exit':
        log.raw(require('chalk').blue('\nTerima kasih telah menggunakan Cleos Tools!\n'));
        running = false;
        continue;
    }
    if (running) await pause();
  }
}

main().catch(e => {
  log.error(`Error: ${e.message}`);
  process.exit(1);
});

process.on('uncaughtException', e => {
  if (e.code === 'ERR_USE_AFTER_CLOSE') return;
  console.error(e);
  process.exit(1);
});

process.on('unhandledRejection', e => {
  if (e && e.code === 'ERR_USE_AFTER_CLOSE') return;
});
