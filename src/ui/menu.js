const inquirer = require('inquirer');

async function mainMenu() {
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Pilih Menu',
      choices: [
        { name: '1. Create Wallet', value: 'create' },
        { name: '2. Open Existing Wallet', value: 'open' },
        { name: '3. Import Existing Wallet', value: 'import' },
        { name: '4. Unlock Wallet', value: 'unlock' },
        { name: '5. Lock Wallet', value: 'lock' },
        { name: '6. Vote Block Producer', value: 'vote' },
        { name: '7. Vote All Wallets', value: 'voteAll' },
        { name: '8. Claim Reward', value: 'claim' },
        { name: '9. Wallet Info', value: 'info' },
        { name: '10. Define BP Mapping', value: 'bpMap' },
        { name: '11. Broadcaster Nodes', value: 'nodes' },
        { name: '12. VEX REX', value: 'vexrex' },
        { name: '13. Stake/Unstake Resource', value: 'resource' },
        { name: '14. Send Token', value: 'send' },
        { name: '15. Restart Keosd', value: 'restart' },
        { name: '16. Delete Wallet', value: 'delete' },
        { name: '17. Exit', value: 'exit' },
      ],
    },
  ]);
  return choice;
}

async function vexrexMenu() {
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Menu VEX REX',
      choices: [
        { name: '1. Unstake to REX', value: 'unstakeToRex' },
        { name: '2. Sell REX', value: 'sellRex' },
        { name: '3. Withdraw REX Fund', value: 'withdrawRex' },
        { name: '4. Cek Maturity REX', value: 'maturity' },
        { name: '5. Cek Balance Withdrawable', value: 'withdrawable' },
        { name: '6. Kembali', value: 'back' },
      ],
    },
  ]);
  return choice;
}

async function resourceMenu() {
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Menu Stake/Unstake Resource',
      choices: [
        { name: '1. Stake Resource (CPU/NET)', value: 'stake' },
        { name: '2. Unstake Resource (CPU/NET)', value: 'unstake' },
        { name: '3. Cek Stake Resource', value: 'staked' },
        { name: '4. Kembali', value: 'back' },
      ],
    },
  ]);
  return choice;
}

module.exports = { mainMenu, vexrexMenu, resourceMenu };
