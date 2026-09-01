const chalk = require('chalk');
const figlet = require('figlet');
const boxen = require('boxen');
const config = require('../config');
const cleos = require('../services/cleos.service');
const walletService = require('../services/wallet.service');

function showBanner() {
  console.log(
    chalk.blue(figlet.textSync('Cleos Tools', { font: 'Small' }))
  );
  console.log(chalk.dim('Vexanium Block Producer Wallet Manager\n'));
}

function showDashboard(wallets, cfg) {
  const c = cfg || config.load();
  const lines = [];

  if (wallets && wallets.length > 0) {
    for (const w of wallets) {
      const status = w.unlocked
        ? chalk.green('✅ Unlocked')
        : chalk.yellow('🔒 Locked');

      // Check staked resources if wallet is unlocked
      let stakeInfo = '';
      if (w.unlocked) {
        try {
          const result = cleos.exec([
            '-u', c.defaultBroadcaster,
            'system', 'listbw',
            w.name,
            '-j',
          ], { timeout: 10000 });
          if (result.ok) {
            const data = JSON.parse(result.stdout);
            let totalNet = 0;
            let totalCpu = 0;
            if (data.rows && Array.isArray(data.rows)) {
              for (const row of data.rows) {
                totalNet += parseFloat(row.net_weight || '0');
                totalCpu += parseFloat(row.cpu_weight || '0');
              }
            }
            if (totalNet > 0 || totalCpu > 0) {
              stakeInfo = `  ${chalk.cyan(`NET: ${totalNet.toFixed(4)} VEX  CPU: ${totalCpu.toFixed(4)} VEX`)}`;
            }
          }
        } catch (_) {}
      }

      lines.push(`  ${chalk.bold(w.name)}  ${status}${stakeInfo}`);
    }
  } else {
    lines.push(chalk.dim('  (belum ada wallet)'));
  }

  console.log(boxen(lines.join('\n'), {
    padding: { top: 1, bottom: 1, left: 2, right: 2 },
    borderStyle: 'round',
    borderColor: 'blue',
    title: chalk.bold('Wallet Status'),
    titleAlignment: 'left',
  }));

  console.log(
    boxen(
      `  ${chalk.bold('Broadcaster')} : ${chalk.cyan(c.defaultBroadcaster || 'https://vexascan.com:8443')}`,
      { padding: { top: 0, bottom: 0, left: 2, right: 2 }, borderStyle: 'round', borderColor: 'cyan' }
    )
  );
  console.log();
}

module.exports = { showBanner, showDashboard };
