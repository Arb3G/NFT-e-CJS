// services/paymentMonitor.js
// services/paymentMonitor.js
const fetch = require('node-fetch');
const dayjs = require('dayjs');

// Countdown helper to display wait time
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

// Fetch JSON helper with error handling
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for URL: ${url}`);
  return res.json();
}

/**
 * Poll Stellar Horizon for payments to PUBLIC_KEY matching the memoId.
 * @param {string} publicKey - Recipient's wallet (usually treasury)
 * @param {string} amount - Expected token amount (as string)
 * @param {string} memoId - The memo ID to match
 * @param {number} timeoutMs - Max duration to wait (default 90000ms)
 * @returns {Promise<object>} Result object with success info or failure reason.
 */
async function startPaymentMonitor(publicKey, amount, memoId, timeoutMs = 90000) {
  // Pull config lazily
  const HORIZON = process.env.HORIZON_URL || 'https://horizon.stellar.org';
  const CJS_ASSET_CODE = process.env.CJS_ASSET_CODE;
  const CJS_ISSUER = process.env.STELLAR_ISSUER_ADDRESS;
  const POLL_INTERVAL = Number(process.env.POLL_INTERVAL_MS) || 30000;
  const MAX_ATTEMPTS = Math.ceil(timeoutMs / POLL_INTERVAL);

  if (!publicKey || !CJS_ASSET_CODE || !CJS_ISSUER) {
    throw new Error('Missing required environment variables: PUBLIC_KEY, CJS_ASSET_CODE, or CJS_ISSUER.');
  }

  let attempt = 0;
  let lastSeenTx = null;

  console.log(`📡 Monitoring payments to ${publicKey} for memo: "${memoId}"`);

  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    console.log(`\n🔎 Attempt ${attempt} of ${MAX_ATTEMPTS}...`);

    try {
      const url = `${HORIZON}/accounts/${publicKey}/payments?order=desc&limit=10`;
      const data = await fetchJSON(url);

      for (const record of data._embedded.records) {
        if (
          record.type === 'payment' &&
          record.asset_type !== 'native' &&
          record.asset_code === CJS_ASSET_CODE &&
          record.asset_issuer === CJS_ISSUER &&
          record.to === publicKey
        ) {
          const txData = await fetchJSON(`${HORIZON}/transactions/${record.transaction_hash}`);
          if (txData.memo === memoId && record.transaction_hash !== lastSeenTx) {
            lastSeenTx = record.transaction_hash;

            console.log(`✅ Received ${record.amount} ${CJS_ASSET_CODE} at ${dayjs(record.created_at).format()}`);
            console.log(`🔗 https://stellar.expert/explorer/public/tx/${record.transaction_hash}`);

            return {
              success: true,
              amount: record.amount,
              hash: record.transaction_hash,
              timestamp: record.created_at,
            };
          }
        }
      }

      console.log('❌ No matching payment found yet.');
      if (attempt < MAX_ATTEMPTS) await countdown(POLL_INTERVAL / 1000);

    } catch (err) {
      console.error(`❌ Payment monitor error:`, err.message);
      return { success: false, error: err.message };
    }
  }

  console.log(`⏹️ Timeout: No matching payment found after ${MAX_ATTEMPTS} attempts.`);
  return { success: false, timeout: true };
}

module.exports = { startPaymentMonitor };
