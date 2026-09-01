const wallet = require('./wallet.service');
const { runCleos } = require('../utils/cli');

/**
 * Vote for a block producer.
 * @param {string} walletName - Wallet name to unlock
 * @param {string} voterAccount - Voter account name
 * @param {string} bpName - BP name to vote for
 * @param {string} broadcaster - Node URL
 * @returns {Promise<boolean>}
 */
async function vote(walletName, voterAccount, bpName, broadcaster) {
  if (!wallet.unlock(walletName)) return false;

  const result = await runCleos(
    `-u ${broadcaster} system voteproducer prods ${voterAccount} ${bpName}`,
    {
      actionMsg: 'Melakukan vote...',
      successMsg: 'Vote berhasil.',
      logMsg: `Voted: ${voterAccount} -> ${bpName}`,
      timeout: 60000,
    }
  );

  return result.ok;
}

module.exports = { vote };
