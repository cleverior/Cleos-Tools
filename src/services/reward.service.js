const wallet = require('./wallet.service');
const { runCleos } = require('../utils/cli');

/**
 * Claim producer rewards for an account.
 * @param {string} walletName - Wallet name to unlock
 * @param {string} accountName - Account name to claim rewards for
 * @param {string} broadcaster - Node URL
 * @returns {Promise<boolean>}
 */
async function claim(walletName, accountName, broadcaster) {
  if (!wallet.unlock(walletName)) return false;

  const result = await runCleos(
    `-u ${broadcaster} system claimrewards ${accountName}`,
    {
      actionMsg: 'Mengklaim reward...',
      successMsg: 'Reward berhasil diklaim.',
      logMsg: `Claimed rewards: ${accountName}`,
      timeout: 120000,
    }
  );

  return result.ok;
}

module.exports = { claim };
