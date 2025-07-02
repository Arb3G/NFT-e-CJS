// services/genartFlow.js
const QRCode = require('qrcode');
const { getUser } = require('./db');
const { checkCJSBalance } = require('./tokenCheck');
const { startPaymentMonitor } = require('./paymentMonitor');

const PAYMENT_AMOUNT = '10';

/**
 * Runs the genart user flow: verifies user, checks balance, shows QR, monitors payment.
 * @param {string} userId - CJS user ID
 * @param {function} send - Function to output messages (console.log or Discord reply)
 * @param {object} [options]
 * @param {boolean} [options.qrDataURL=true] - If true, returns QR image data URL
 * @returns {Promise<object>} status and metadata
 */
async function runGenartFlow(userId, send, options = {}) {
  const { qrDataURL = true } = options;
  const user = await getUser(userId);

  if (!user) {
    await send(`❗ No wallet found for ID \`${userId}\`. Please register first.`);
    return { success: false, reason: 'no_user' };
  }

  const balance = await checkCJSBalance(user.public_key);
  if (balance < 10) {
    await send(
      `💸 You need at least **10 $CJS** in your wallet.\n` +
      `Current balance: **${balance}**\n` +
      `Top up here: [https://yourdomain.com/buycjs](#)`
    );
    return { success: false, reason: 'insufficient_balance' };
  }

  // Required payment info from environment
  //const TREASURY_PUBLIC_KEY = process.env.TREASURY_PUBLIC_KEY; ** using the below for now, update to actual TREASURY in the future ***
  const TREASURY_PUBLIC_KEY = process.env.STELLAR_ISSUER_ADDRESS;
  const STELLAR_ISSUER_ADDRESS = process.env.STELLAR_ISSUER_ADDRESS;

  if (!TREASURY_PUBLIC_KEY || !STELLAR_ISSUER_ADDRESS) {
    await send('❌ Server config error: Payment system not properly set up.');
    return { success: false, reason: 'config_error' };
  }

  const memo = `genart-${userId}`;
  const paymentURI = `web+stellar:pay?destination=${TREASURY_PUBLIC_KEY}` +
    `&amount=${PAYMENT_AMOUNT}` +
    `&asset_code=CJS` +
    `&asset_issuer=${STELLAR_ISSUER_ADDRESS}` +
    `&memo=${encodeURIComponent(memo)}`;

  let qrCodeDataUrl = null;
  if (qrDataURL) {
    qrCodeDataUrl = await QRCode.toDataURL(paymentURI);
  }

  await send(
    `✅ You're verified and funded!\n\n` +
    `🧾 Please send **${PAYMENT_AMOUNT} $CJS** to proceed using the QR or link below:\n` +
    `${paymentURI}\n\n` +
    `Monitoring for payment for up to 90 seconds...`
  );

  const confirmed = await startPaymentMonitor(user.public_key, PAYMENT_AMOUNT, memo, 90000);
  if (!confirmed.success) {
    await send(`❌ Payment not received. Please try again later.`);
    return { success: false, reason: 'payment_timeout' };
  }

  await send(
    `🎨 Payment received! Describe your art idea (e.g., *"Afrofuturist utopia on Mars"*).`
  );

  return { success: true, qr: qrCodeDataUrl, paymentURI };
}

module.exports = { runGenartFlow };
