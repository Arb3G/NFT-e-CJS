// services/paymentMonitor.js
const StellarSdk = require('stellar-sdk');
const dayjs = require('dayjs');

// === CONFIGURATION ===
const HORIZON = 'https://horizon.stellar.org';
const PUBLIC_KEY = 'G...'; // Receiving account
const CJS_ASSET_CODE = 'CJS';
const CJS_ISSUER = 'G...'; // CJS asset issuer
const MEMO_ID = 'user123'; // Replace with dynamic user ID or pass via CLI/arg/env
const POLL_INTERVAL = 30 * 1000; // 30 seconds
const MAX_ATTEMPTS = 3;

const server = new StellarSdk.Server(HORIZON);
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

// === MAIN POLLING FUNCTION ===
async function pollForPayment() {
  attempt++;
  console.log(`\n🔎 Attempt ${attempt} of ${MAX_ATTEMPTS}...`);

  try {
    const payments = await server
      .payments()
      .forAccount(PUBLIC_KEY)
      .order('desc')
      .limit(10)
      .call();

    for (const record of payments.records) {
      if (
        record.type === 'payment' &&
        record.asset_type !== 'native' &&
        record.asset_code === CJS_ASSET_CODE &&
        record.asset_issuer === CJS_ISSUER &&
        record.to === PUBLIC_KEY
      ) {
        // Fetch transaction to read the memo
        const tx = await server.transactions().transaction(record.transaction_hash).call();
        if (tx.memo === MEMO_ID) {
          if (record.transaction_hash !== lastSeenTx) {
            lastSeenTx = record.transaction_hash;
            console.log(`✅ Payment received: ${record.amount} ${CJS_ASSET_CODE} from ${record.from}`);
            console.log(`🔗 https://stellar.expert/explorer/public/tx/${record.transaction_hash}`);
            return process.exit(0); // Success, exit program
          }
        }
      }
    }

    // No payment found for this attempt
    if (attempt < MAX_ATTEMPTS) {
      console.log(`❌ Payment not detected. Please complete the payment.`);
      await countdown(POLL_INTERVAL / 1000); // Wait with visible countdown
      pollForPayment(); // Try again
    } else {
      console.log(`❌ Payment still not received after ${MAX_ATTEMPTS} attempts.`);
      console.log(`🔁 Please restart the program to try again.`);
      process.exit(1); // Exit with error code
    }

  } catch (err) {
    console.error(`❌ Error checking for payment:`, err.message);
    process.exit(1);
  }
}

// === START ===
pollForPayment();
