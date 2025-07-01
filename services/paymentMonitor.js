// services/paymentMonitor.js
const fetch = require('node-fetch');
const dayjs = require('dayjs');

// === CONFIGURATION ===
const HORIZON = 'https://horizon.stellar.org';
const PUBLIC_KEY = 'G...';      // Replace with your receiving account
const CJS_ASSET_CODE = 'CJS';
const CJS_ISSUER = 'G...';      // Replace with your token issuer
const MEMO_ID = 'user123';      // Replace with actual user ID
const POLL_INTERVAL = 30 * 1000;
const MAX_ATTEMPTS = 3;

let attempt = 0;
let lastSeenTx = null;

// === HELPER: Countdown display ===
function countdown(seconds) {
  return new Promise(resolve => {
    const interval = setInterval(() => {
      process.stdout.write(`\r⏳ Waiting... ${seconds}s remaining `);
      seconds--;
      if (seconds < 0) {
        clearInterval(interval);
        process.stdout.write('\n');
        resolve();
      }
    }, 1000);
  });
}

// === FETCH HELPERS ===
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function pollForPayment() {
  attempt++;
  console.log(`\n🔎 Attempt ${attempt} of ${MAX_ATTEMPTS}...`);

  try {
    // Fetch last 10 payments to PUBLIC_KEY
    const url = `${HORIZON}/accounts/${PUBLIC_KEY}/payments?order=desc&limit=10`;
    const data = await fetchJSON(url);

    for (const record of data._embedded.records) {
      if (
        record.type === 'payment' &&
        record.asset_type !== 'native' &&
        record.asset_code === CJS_ASSET_CODE &&
        record.asset_issuer === CJS_ISSUER &&
        record.to === PUBLIC_KEY
      ) {
        // Fetch the transaction to inspect memo
        const txData = await fetchJSON(`${HORIZON}/transactions/${record.transaction_hash}`);
        if (txData.memo === MEMO_ID) {
          if (record.transaction_hash !== lastSeenTx) {
            lastSeenTx = record.transaction_hash;
            console.log(`✅ Received ${record.amount} ${CJS_ASSET_CODE} at ${dayjs(record.created_at).format()}`);
            console.log(`🔗 https://stellar.expert/explorer/public/tx/${record.transaction_hash}`);
            return process.exit(0);
          }
        }
      }
    }

    // Not found — retry if attempts left
    if (attempt < MAX_ATTEMPTS) {
      console.log(`❌ Payment not detected. Please complete the payment.`);
      await countdown(POLL_INTERVAL / 1000);
      pollForPayment();
    } else {
      console.log(`❌ Payment still not received after ${MAX_ATTEMPTS} attempts.`);
      console.log(`🔁 Please restart the program to try again.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ Error:`, err.message);
    process.exit(1);
  }
}

// === START ===
pollForPayment();
