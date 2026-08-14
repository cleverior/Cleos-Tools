const cleos = require('./cleos.service');
const log = require('../utils/logger');
const logfile = require('../utils/logfile');
const wallet = require('./wallet.service');
const ora = require('ora');

function getTokens(account, broadcaster) {
  const result = cleos.exec(['-u', broadcaster, 'get', 'currency', 'balance', 'vex.token', account]);
  if (!result.ok) return [];
  // Output format: "100.0000 VEX" or "100.0000 VEX 50.0000 ABC"
  return result.stdout.split(' ').filter((_, i) => i % 2 === 1);
  // Wait, parsing output like "100.0000 VEX 50.0000 ABC" -> ["100.0000", "VEX", "50.0000", "ABC"]
  // Actually, standard output is "100.0000 VEX".
  // Let's make it robust.
}

// Fixed parsing:
function getTokensRobust(account, broadcaster) {
    const result = cleos.exec(['-u', broadcaster, 'get', 'currency', 'balance', 'vex.token', account]);
    if (!result.ok) return [];
    // stdout might be "100.0000 VEX"
    // split by space
    const parts = result.stdout.trim().split(/\s+/);
    const tokens = [];
    for(let i = 0; i < parts.length; i += 2) {
        if(parts[i+1]) tokens.push({ amount: parts[i], symbol: parts[i+1] });
    }
    return tokens;
}

function transfer(walletName, from, to, amount, symbol, broadcaster, memo = '') {
    if (!wallet.unlock(walletName)) return false;
    const spinner = ora('Mengirim token...').start();
    const result = cleos.exec([
        '-u', broadcaster,
        'transfer', from, to, `${amount} ${symbol}`, memo,
        '-p', `${from}@active`
    ], { timeout: 60000 });
    spinner.stop();

    if (!result.ok) {
        log.error(result.friendly || 'Gagal mengirim token');
        return false;
    }
    log.success('Token berhasil dikirim.');
    logfile.append(`Transfer: ${from} -> ${to} ${amount} ${symbol} (Memo: ${memo})`);
    return true;
}

module.exports = { getTokens: getTokensRobust, transfer };
