// services/paymentMonitor.js
// services/paymentMonitor.js
const { Server } = require('stellar-sdk');
const server = new Server('https://horizon.stellar.org');


const CJS_ASSET_CODE = process.env.CJS_ASSET_CODE;
const CJS_ISSUER_ADDRESS = process.env.CJS_ISSUER_ADDRESS;
const TREASURY_PUBLIC_KEY = process.env.TREASURY_PUBLIC_KEY;

function createCjsPaymentRequest(fromPublicKey, amount) {
  const memo = `genart-${Math.floor(Math.random() * 100000)}`;
  const paymentUrl = `https://wallet.freighter.app/pay?destination=${TREASURY_PUBLIC_KEY}&asset_code=${CJS_ASSET_CODE}&asset_issuer=${CJS_ISSUER_ADDRESS}&amount=${amount}&memo=${memo}&memo_type=TEXT`;
  return { paymentUrl, memo };
}

async function waitForCjsPayment(from, memo, amountExpected) {
  for (let i = 0; i < 3; i++) {
    console.log(`⏳ Checking for payment... (${i + 1}/3)`);
    try {
      const payments = await server
        .payments()
        .forAccount(TREASURY_PUBLIC_KEY)
        .order('desc')
        .limit(10)
        .call();

      const match = payments.records.find(op =>
        op.type === 'payment' &&
        op.asset_code === CJS_ASSET_CODE &&
        op.asset_issuer === CJS_ISSUER_ADDRESS &&
        op.from === from &&
        op.memo === memo &&
        parseFloat(op.amount) === amountExpected
      );

      if (match) return true;
    } catch (e) {
      console.error('🔍 Payment check failed:', e);
    }

    await new Promise(r => setTimeout(r, 30000)); // wait 30s
  }

  return false;
}

module.exports = { createCjsPaymentRequest, waitForCjsPayment };
