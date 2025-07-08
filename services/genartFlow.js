// services/genartFlow.js
// services/genartFlow.js
const QRCode = require('qrcode');
const { AttachmentBuilder } = require('discord.js');
const { getUser } = require('./db');
const { checkCJSBalance } = require('./tokenCheck');
const { startPaymentMonitor } = require('./paymentMonitor');
const { logPurchase } = require('./db'); // Add this import for logging purchases

const PAYMENT_AMOUNT = '10';

/**
 * Runs the genart user flow: verifies user, checks balance, shows QR, monitors payment.
 * @param {string} userId - CJS user ID
 * @param {function} send - Function to output messages (must support { content, ephemeral, files }) and returns a message with edit()
 * @param {object} [options]
 * @param {boolean} [options.qrDataURL=true]
 * @returns {Promise<object>} status and metadata
 */
async function runGenartFlow(userId, send, options = {}) {
  const { qrDataURL = true } = options;
  const user = await getUser(userId);

  if (!user) {
    await send({
      content: `❗ No wallet found for ID \`${userId}\`. Please register first.`,
      ephemeral: true,
    });
    return { success: false, reason: 'no_user' };
  }

  const balance = await checkCJSBalance(user.public_key);
  if (balance < 10) {
    await send({
      content:
        `💸 You need at least **10 $CJS** in your wallet.\n` +
        `Current balance: **${balance}**\n` +
        `Top up here: [https://yourdomain.com/buycjs](#)`,
      ephemeral: true,
    });
    return { success: false, reason: 'insufficient_balance' };
  }

  const TREASURY_PUBLIC_KEY = process.env.TREASURY_PUBLIC_KEY;
  const STELLAR_ISSUER_ADDRESS = process.env.STELLAR_ISSUER_ADDRESS;

  if (!TREASURY_PUBLIC_KEY || !STELLAR_ISSUER_ADDRESS) {
    await send({
      content: '❌ Server config error: Payment system not properly set up.',
      ephemeral: true,
    });
    return { success: false, reason: 'config_error' };
  }

  // Generate unique memo
  const memo = `genart-${userId}-${Date.now()}`;
  const paymentURI = `web+stellar:pay?destination=${TREASURY_PUBLIC_KEY}` +
    `&amount=${PAYMENT_AMOUNT}` +
    `&asset_code=CJS` +
    `&asset_issuer=${STELLAR_ISSUER_ADDRESS}` +
    `&memo=${memo}` +
    `&memo_type=text`; // lowercase memo_type

  const encoded = encodeURIComponent(paymentURI);
  const redirectLink = `https://2ea547a0-d1e3-4eb3-ae30-fbe27e3bd321-00-23mr2q1y95uet.worf.replit.dev/pay?uri=${encoded}`;

  let qrCodeDataUrl = null;
  let attachment = null;

  if (qrDataURL) {
    qrCodeDataUrl = await QRCode.toDataURL(paymentURI);
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    attachment = new AttachmentBuilder(buffer, { name: 'payment_qr.png' });
  }

  await send({
    content:
      `✅ You're verified and funded!\n\n` +
      `🧾 Send **${PAYMENT_AMOUNT} $CJS** using this QR code or link:\n` +
      `${redirectLink}\n\n` +
      `Monitoring for payment for up to 90 seconds...`,
    files: attachment ? [attachment] : [],
    ephemeral: true,
  });

  // --- Polling setup ---
  const totalWaitTimeMs = 90000; // 90 seconds total
  const pollIntervalMs = 5000; // 5 seconds polling interval
  const maxAttempts = Math.ceil(totalWaitTimeMs / pollIntervalMs);

  let attempt = 0;
  let confirmed = null;

  // Send initial progress message
  let progressMessage = await send({
   services/genartFlow.js
// services/genartFlow.js
const QRCode = require('qrcode');
const { AttachmentBuilder } = require('discord.js');
const { getUser } = require('./db');
const { checkCJSBalance } = require('./tokenCheck');
const { startPaymentMonitor } = require('./paymentMonitor');
const { logPurchase } = require('./db'); // Add this import for logging purchases

const PAYMENT_AMOUNT = '10';

/**
 * Runs the genart user flow: verifies user, checks balance, shows QR, monitors payment.
 * @param {string} userId - CJS user ID
 * @param {function} send - Function to output messages (must support { content, ephemeral, files }) and returns a message with edit()
 * @param {object} [options]
 * @param {boolean} [options.qrDataURL=true]
 * @returns {Promise<object>} status and metadata
 */
async function runGenartFlow(userId, send, options = {}) {
  const { qrDataURL = true } = options;
  const user = await getUser(userId);

  if (!user) {
    await send({
      content: `❗ No wallet found for ID \`${userId}\`. Please register first.`,
      ephemeral: true,
    });
    return { success: false, reason: 'no_user' };
  }

  const balance = await checkCJSBalance(user.public_key);
  if (balance < 10) {
    await send({
      content:
        `💸 You need at least **10 $CJS** in your wallet.\n` +
        `Current balance: **${balance}**\n` +
        `Top up here: [https://yourdomain.com/buycjs](#)`,
      ephemeral: true,
    });
    return { success: false, reason: 'insufficient_balance' };
  }

  const TREASURY_PUBLIC_KEY = process.env.TREASURY_PUBLIC_KEY;
  const STELLAR_ISSUER_ADDRESS = process.env.STELLAR_ISSUER_ADDRESS;

  if (!TREASURY_PUBLIC_KEY || !STELLAR_ISSUER_ADDRESS) {
    await send({
      content: '❌ Server config error: Payment system not properly set up.',
      ephemeral: true,
    });
    return { success: false, reason: 'config_error' };
  }

  // Generate unique memo
  const memo = `genart-${userId}-${Date.now()}`;
  const paymentURI = `web+stellar:pay?destination=${TREASURY_PUBLIC_KEY}` +
    `&amount=${PAYMENT_AMOUNT}` +
    `&asset_code=CJS` +
    `&asset_issuer=${STELLAR_ISSUER_ADDRESS}` +
    `&memo=${memo}` +
    `&memo_type=text`; // lowercase memo_type

  const encoded = encodeURIComponent(paymentURI);
  const redirectLink = `https://2ea547a0-d1e3-4eb3-ae30-fbe27e3bd321-00-23mr2q1y95uet.worf.replit.dev/pay?uri=${encoded}`;

  let qrCodeDataUrl = null;
  let attachment = null;

  if (qrDataURL) {
    qrCodeDataUrl = await QRCode.toDataURL(paymentURI);
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    attachment = new AttachmentBuilder(buffer, { name: 'payment_qr.png' });
  }

// services/genartFlow.js
const QRCode = require('qrcode');
const { AttachmentBuilder } = require('discord.js');
const { getUser, logPurchase } = require('./db');
const { checkCJSBalance } = require('./tokenCheck');
const { startPaymentMonitor } = require('./paymentMonitor');

const PAYMENT_AMOUNT = '10';

async function runGenartFlow(userId, send, options = {}) {
  const { qrDataURL = true } = options;
  const user = await getUser(userId);

  if (!user) {
    await send({
      content: `❗ No wallet found for ID \`${userId}\`. Please register first.`,
      ephemeral: true,
    });
    return { success: false, reason: 'no_user' };
  }

  const balance = await checkCJSBalance(user.public_key);
  if (balance < 10) {
    await send({
      content:
        `💸 You need at least **10 $CJS** in your wallet.\n` +
        `Current balance: **${balance}**\n` +
        `Top up here: [https://yourdomain.com/buycjs](#)`,
      ephemeral: true,
    });
    return { success: false, reason: 'insufficient_balance' };
  }

  const TREASURY_PUBLIC_KEY = process.env.TREASURY_PUBLIC_KEY;
  const STELLAR_ISSUER_ADDRESS = process.env.STELLAR_ISSUER_ADDRESS;

  if (!TREASURY_PUBLIC_KEY || !STELLAR_ISSUER_ADDRESS) {
    await send({
      content: '❌ Server config error: Payment system not properly set up.',
      ephemeral: true,
    });
    return { success: false, reason: 'config_error' };
  }

  const memo = `genart-${userId}-${Date.now()}`;
  const paymentURI = `web+stellar:pay?destination=${TREASURY_PUBLIC_KEY}` +
    `&amount=${PAYMENT_AMOUNT}` +
    `&asset_code=CJS` +
    `&asset_issuer=${STELLAR_ISSUER_ADDRESS}` +
    `&memo=${memo}` +
    `&memo_type=text`;

  const encoded = encodeURIComponent(paymentURI);
  const redirectLink = `https://yourdomain.com/pay?uri=${encoded}`; // replace with your redirect

  let qrCodeDataUrl = null;
  let attachment = null;

  if (qrDataURL) {
    qrCodeDataUrl = await QRCode.toDataURL(paymentURI);
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    attachment = new AttachmentBuilder(buffer, { name: 'payment_qr.png' });
  }

  await send({
    content:
      `✅ You're verified and funded!\n\n` +
      `🧾 Send **${PAYMENT_AMOUNT} $CJS** using this QR code or link:\n` +
      `${redirectLink}\n\n` +
      `Monitoring for payment for up to 90 seconds...`,
    files: attachment ? [attachment] : [],
    ephemeral: true,
  });

  const totalWaitTimeMs = 90000;
  const pollIntervalMs = 5000;
  const maxAttempts = Math.ceil(totalWaitTimeMs / pollIntervalMs);

  let attempt = 0;
  let confirmed = null;

  while (attempt < maxAttempts) {
    attempt++;
    const elapsedSeconds = attempt * (pollIntervalMs / 1000);

    try {
      confirmed = await startPaymentMonitor(
        TREASURY_PUBLIC_KEY,
        PAYMENT_AMOUNT,
        memo,
        pollIntervalMs,
        new Date()
      );

      if (confirmed.success) {
        await send({
          content: `✅ Payment received after ${elapsedSeconds}s!\n🧾 Memo: \`${memo}\``,
          ephemeral: true,
        });
        break;
      } else {
        await send({
          content: `⏳ Waiting for payment... ${elapsedSeconds}s elapsed`,
          ephemeral: true,
        });
      }
    } catch (err) {
      console.error('Polling error:', err);
    }

    if (!confirmed?.success) {
      await new Promise((res) => setTimeout(res, pollIntervalMs));
    }
  }

  if (!confirmed || !confirmed.success) {
    await send({
      content: `❌ Payment not received within ${totalWaitTimeMs / 1000}s. Please try again later.`,
      ephemeral: true,
    });
    return { success: false, reason: 'payment_timeout' };
  }

  // Record the purchase in Supabase
  await logPurchase(userId, Number(PAYMENT_AMOUNT), 'Crypto Wallet', memo);

  // Prompt for next step — describe art
  await send({
    content:
      `🎨 Payment verified!\n` +
      `Now describe your art idea (e.g., *"Afrofuturist utopia on Mars"*)`,
    ephemeral: false,
  });

  return {
    success: true,
    qr: qrCodeDataUrl,
    paymentURI,
    txHash: confirmed.hash,
    timestamp: confirmed.timestamp,
    memo,
  };
}

module.exports = { runGenartFlow };
