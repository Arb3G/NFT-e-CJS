// services/paymentMonitor.js
const { Server, TransactionBuilder, Operation, Asset, Networks } = require('stellar-sdk');
const server = new Server('https://horizon.stellar.org');

const CJS_ASSET_CODE = process.env.CJS_ASSET_CODE;
const CJS_ISSUER_ADDRESS = process.env.CJS_ISSUER_ADDRESS;
const CJS_RECEIVER_ADDRESS = process.env.CJS_TREASURY_ADDRESS; // Where user must send 10 CJS

// Generate the manual transaction link (URI)
function createPaymentURI(senderPublicKey) {
  const asset = new Asset(CJS_ASSET_CODE, CJS_ISSUER_ADDRESS);

  const uri = `web+stellar:tx?destination=${CJS_RECEIVER_ADDRESS}` +
              `&amount=10&asset_code=${CJS_ASSET_CODE}&asset_issuer=${CJS_ISSUER_ADDRESS}` +
              `&memo=art-${Date.now()}&msg=Pay+10+CJS+to+start+art+generation`;

  return uri;
}

// Monitor for payment confirmation (30s wait x 3 tries)
async function waitForPayment(userPublicKey, expectedAmount = '10', attempts = 3) {
  const asset = new Asset(CJS_ASSET_CODE, CJS_ISSUER_ADDRESS);
  let found = false;

  for (let i = 0; i < attempts; i++) {
    try {
      const payments = await server.payments()
        .forAccount(CJS_RECEIVER_ADDRESS)
        .order('desc')
        .limit(10)
        .call();

      found = payments.records.some(pmt =>
        pmt.asset_type === 'credit_alphanum4' &&
        pmt.asset_code === CJS_ASSET_CODE &&
        pmt.asset_issuer === CJS_ISSUER_ADDRESS &&
        pmt.from === userPublicKey &&
        pmt.amount === expectedAmount
      );

      if (found) return true;

    } catch (err) {
      console.error('🔁 Payment polling failed:', err);
    }

    // Wait 30 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 30000));
  }

  return false;
}

module.exports = { createPaymentURI, waitForPayment };
