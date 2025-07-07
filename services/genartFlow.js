// services/genartFlow.js
const QRCode = require('qrcode');
const { AttachmentBuilder } = require('discord.js');
const { getUser } = require('./db');
const { checkCJSBalance } = require('./tokenCheck');
const { startPaymentMonitor } = require('./paymentMonitor');

const PAYMENT_AMOUNT = '10';

/**
 * Runs the genart user flow: verifies user, checks balance, shows QR, monitors payment.
 * @param {string} userId - CJS user ID
 * @param {function} send - Function to output messages (must support { content, ephemeral, files })
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

  // ✅ Generate a unique memo for this session
  const memo = `genart-${userId}-${Date.now()}`;
  const paymentURI = `web+stellar:pay?destination=${TREASURY_PUBLIC_KEY}` +
    `&amount=${PAYMENT_AMOUNT}` +
    `&asset_code=CJS` +
    `&asset_issuer=${STELLAR_ISSUER_ADDRESS}` +
    `&memo=${encodeURIComponent(memo)}` +
    `&memo_type=TEXT`;

  const encoded = encodeURIComponent(paymentURI);
  const redirectLink = `https://yourdomain.com/pay?uri=${encoded}`;

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

  const flowStartTime = new Date();

  const confirmed = await startPaymentMonitor(
    TREASURY_PUBLIC_KEY,
    PAYMENT_AMOUNT,
    memo,
    90000,
    flowStartTime
  );

  if (!confirmed.success) {
    await send({
      content: `❌ Payment not received. Please try again later.`,
      ephemeral: true,
    });
    return { success: false, reason: 'payment_timeout' };
  }

  await send({
    content:
      `🎨 Payment received!\n` +
      `🧾 Memo: \`${memo}\`\n\n` +
      `Now describe your art idea (e.g., *"Afrofuturist utopia on Mars"*)`,
    ephemeral: true,
  });

  return {
    success: true,
    qr: qrCodeDataUrl,
    paymentURI,
    txHash: confirmed.hash,
    timestamp: confirmed.timestamp,
    memo, // included for logging or further processing
  };
}

module.exports = { runGenartFlow };
