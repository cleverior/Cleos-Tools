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
        { name: '12. Restart Keosd', value: 'restart' },
        { name: '13. Delete Wallet', value: 'delete' },
        { name: '14. Exit', value: 'exit' },
      ],
    },
  ]);
  return choice;
}

module.exports = { mainMenu };
