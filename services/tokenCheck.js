// tokencheck.js

const fetch = require('node-fetch');

// Load asset info from environment variables
const CJS_ASSET_CODE = process.env.CJS_ASSET_CODE;
const CJS_ISSUER_ADDRESS = process.env.CJS_ISSUER_ADDRESS;
const HORIZON_URL = 'https://horizon.stellar.org'; // Or testnet if needed

/**
 * Checks the balance of CJS tokens in a Stellar account.
 * @param {string} publicKey - Stellar public key of the user wallet.
 * @returns {Promise<number>} Token balance (0 if none or error).
 */
async function checkCJSBalance(publicKey) {
  try {
    const res = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
    if (!res.ok) throw new Error(`Horizon error ${res.status}`);
    const account = await res.json();

    // Find CJS token balance
    const balance = account.balances.find(
      b => b.asset_code === CJS_ASSET_CODE && b.asset_issuer === CJS_ISSUER_ADDRESS
    );

    return parseFloat(balance?.balance || '0');
  } catch (err) {
    console.error('Balance check failed:', err.message);
    return 0;
  }
}

module.exports = { checkCJSBalance };
