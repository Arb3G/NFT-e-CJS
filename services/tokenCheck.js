// tokencheck.js

const { Server } = require('stellar-sdk');

// Connect to Stellar Horizon server (use public or testnet)
const server = new Server('https://horizon.stellar.org'); // Replace with testnet URL if testing

// Load asset info from environment variables
const CJS_ASSET_CODE = process.env.CJS_ASSET_CODE;
const CJS_ISSUER_ADDRESS = process.env.CJS_ISSUER_ADDRESS;

/**
 * Checks the balance of CJS tokens in a Stellar account.
 * @param {string} publicKey - Stellar public key of the user wallet.
 * @returns {Promise<number>} Token balance (0 if none or error).
 */
async function checkCJSBalance(publicKey) {
  try {
    // Load account details from Horizon
    const account = await server.loadAccount(publicKey);

    // Find CJS token balance
    const balance = account.balances.find(
      b => b.asset_code === CJS_ASSET_CODE && b.asset_issuer === CJS_ISSUER_ADDRESS
    );

    // Return parsed balance as float, or 0 if not found
    return parseFloat(balance?.balance || '0');
  } catch (err) {
    console.error('Balance check failed:', err);
    return 0;
  }
}

module.exports = { checkCJSBalance };

