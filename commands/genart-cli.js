#!/usr/bin/env node
const { runGenArt } = require('./services/genartLogic');

const userId = process.argv[2];
if (!userId) {
  console.error('Usage: node genart-cli.js <userId>');
  process.exit(1);
}

(async () => {
  try {
    console.log(`Starting genart for user ${userId}...`);
    const result = await runGenArt(userId, {
      sendReply: (msg) => console.log(msg), // simple console output
      // optionally handle CLI input, QR code display etc.
    });
    console.log('Payment confirmed! You can now describe your art.');
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
