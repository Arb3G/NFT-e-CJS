//genart-cli.js
//#!/usr/bin/env node
const readline = require('readline');
const qrcode = require('qrcode-terminal');
const { runGenartFlow } = require('./services/genartFlow');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter your CJS User ID (not Discord ID): ', async (userId) => {
  try {
    const result = await runGenartFlow(userId, async (msg) => {
      console.log(msg);
    }, { qrDataURL: false }); // Don't generate dataURL QR code, we'll print terminal QR here

    if (result.success) {
      if (result.paymentURI) {
        console.log('\nScan this QR code to pay or use the link below:\n');
        qrcode.generate(result.paymentURI, { small: true });
        console.log('\nThank you! Waiting for your payment to confirm...\n');
      }
    } else {
      console.warn('⚠️ Flow ended with reason:', result.reason || 'unknown');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    rl.close();
  }
});
