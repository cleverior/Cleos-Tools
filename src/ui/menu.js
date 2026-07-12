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
        { name: '3. Unlock Wallet', value: 'unlock' },
        { name: '4. Lock Wallet', value: 'lock' },
        { name: '5. Vote Block Producer', value: 'vote' },
        { name: '6. Vote All Wallets', value: 'voteAll' },
        { name: '7. Claim Reward', value: 'claim' },
        { name: '8. Wallet Info', value: 'info' },
        { name: '9. Define BP Mapping', value: 'bpMap' },
        { name: '10. Settings', value: 'settings' },
        { name: '11. Restart Keosd', value: 'restart' },
        { name: '12. Delete Wallet', value: 'delete' },
        { name: '13. Exit', value: 'exit' },
      ],
    },
  ]);
  return choice;
}

module.exports = { mainMenu };
