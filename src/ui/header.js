const chalk = require('chalk');
const figlet = require('figlet');
const boxen = require('boxen');
const config = require('../config');

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
      lines.push(`  ${chalk.bold(w.name)}  ${status}`);
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
