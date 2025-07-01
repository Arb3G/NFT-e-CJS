// services/paymentMonitor.js
// services/paymentMonitor.js
const fetch = require('node-fetch');
const dayjs = require('dayjs');

const HORIZON = 'https://horizon.stellar.org';
const MONITORED_ACCOUNT = 'YOUR_TREASURY_PUBLIC_KEY'; // replace with treasury or account you want to monitor
const CJS_ASSET_CODE = 'CJS';
const CJS_ISSUER = 'YOUR_CJS_ISSUER_ADDRESS'; // your CJS issuer address
const POLL_INTERVAL_MS = 10000;

let lastSeenPaymentId = null;

async function getTransactionMemo(txHash) {
  try {
    const res = await fetch(`${HORIZON}/transactions/${txHash}`);
    const txData = await res.json();
    return txData.memo || null;
  } catch (e) {
    console.error('Error fetching transaction memo:', e.message);
    return null;
  }
}

async function checkTokenPayments(account) {
  const url = `${HORIZON}/accounts/${account}/payments?limit=10&order=desc`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const records = data._embedded?.records || [];

    // Filter new CJS payments
    const newPayments = records.filter(payment =>
      payment.type === 'payment' &&
      payment.asset_code === CJS_ASSET_CODE &&
      payment.asset_issuer === CJS_ISSUER &&
      payment.id !== lastSeenPaymentId
    );

    if (newPayments.length > 0) {
      // Track newest payment ID to avoid duplicates next time
      lastSeenPaymentId = newPayments[0].id;

      // Reverse to show oldest first
      newPayments.reverse();

      for (const payment of newPayments) {
        const memo = await getTransactionMemo(payment.transaction_hash);
        const when = dayjs(payment.created_at).format('MMMM YYYY');

        console.log('\n🧾 Payment received!');
        console.log(`💰 Amount: ${payment.amount} ${payment.asset_code}`);
        console.log(`👤 From: ${payment.from}`);
        console.log(`📆 Month: ${when}`);
        console.log(`🔖 Memo: ${memo || 'none'}`);
        console.log('---');
      }
    } else {
      console.log(`[${new Date().toISOString()}] 💤 No new CJS payments...`);
    }

  } catch (error) {
    console.error('❌ Error checking payments:', error.message);
  }
