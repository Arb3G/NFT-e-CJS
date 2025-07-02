#!/usr/bin/env node

const readline = require('readline');
const { runGenartFlow } = require('../services/genartFlow');

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Ask user for their CJS User ID (not Discord ID)
  rl.question('Enter your CJS User ID (not Discord ID): ', async (userId) => {
    rl.close();

    try {
      // runGenartFlow expects (userId, send function, options)
      const result = await runGenartFlow(userId, async (msg) => {
        // This is the send function that prints to console
        console.log(msg);
      });

      if (result.success) {
        console.log('🎉 Art generation flow complete!');
      } else {
        console.error('⚠️ Flow ended with reason:', result.reason);
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err.message);
    }
  });
}

main();
