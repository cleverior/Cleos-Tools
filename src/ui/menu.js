const inquirer = require('inquirer');

async function mainMenu() {
  const { choice } = await inquirer.prompt([
    {
      type: 'rawlist',
      name: 'choice',
      message: 'Pilih Menu',
      choices: [
        { name: 'Create Wallet', value: 'create' },
        { name: 'Open Existing Wallet', value: 'open' },
        { name: 'Import Existing Wallet', value: 'import' },
        { name: 'Unlock Wallet', value: 'unlock' },
        { name: 'Lock Wallet', value: 'lock' },
        { name: 'Vote Block Producer', value: 'vote' },
        { name: 'Vote All Wallets', value: 'voteAll' },
        { name: 'Claim Reward', value: 'claim' },
        { name: 'Wallet Info', value: 'info' },
        { name: 'Define BP Mapping', value: 'bpMap' },
        { name: 'Broadcaster Nodes', value: 'nodes' },
        { name: 'VEX REX', value: 'vexrex' },
        { name: 'Stake/Unstake Resource', value: 'resource' },
        { name: 'Send Token', value: 'send' },
        { name: 'Restart Keosd', value: 'restart' },
        { name: 'Delete Wallet', value: 'delete' },
        { name: 'Exit', value: 'exit' },
      ],
    },
  ]);
  return choice;
}

async function vexrexMenu() {
  const { choice } = await inquirer.prompt([
    {
      type: 'rawlist',
      name: 'choice',
      message: 'Menu VEX REX',
      choices: [
        { name: 'Unstake to REX', value: 'unstakeToRex' },
        { name: 'Sell REX', value: 'sellRex' },
        { name: 'Withdraw REX Fund', value: 'withdrawRex' },
        { name: 'Cek Maturity REX', value: 'maturity' },
        { name: 'Cek Balance Withdrawable', value: 'withdrawable' },
        { name: 'Kembali', value: 'back' },
      ],
    },
  ]);
  return choice;
}

async function resourceMenu() {
  const { choice } = await inquirer.prompt([
    {
      type: 'rawlist',
      name: 'choice',
      message: 'Menu Stake/Unstake Resource',
      choices: [
        { name: 'Stake Resource (CPU/NET)', value: 'stake' },
        { name: 'Unstake Resource (CPU/NET)', value: 'unstake' },
        { name: 'Cek Stake Resource', value: 'staked' },
        { name: 'Cek Status Unstake (Refund 3 Hari)', value: 'unstakeStatus' },
        { name: 'Claim Refund', value: 'claimRefund' },
        { name: 'Kembali', value: 'back' },
      ],
    },
  ]);
  return choice;
}

module.exports = { mainMenu, vexrexMenu, resourceMenu };
