#!/usr/bin/env node

const readline = require('readline');
const { runGenartFlow } = require('./services/genartFlow');

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve =>
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

(async () => {
  console.log('\n🎨 Welcome to the CJS Art Engine (CLI Edition)');
  console.log('💡 This tool lets you generate AI art using your $CJS tokens.\n');

  const userId = await prompt('🔑 Enter your CJS User ID (not Discord ID): ');

  try {
    await runGenartFlow({
      userId,
      send: async (msg) => {
        console.log('\n' + msg);
      },
    });

    console.log('\n✅ Payment confirmed! Proceeding to generate your art...');
    // You can call a local art generation function here if needed

  } catch (error) {
    console.error('\n❌ Error:', error.message || 'Unexpected failure.');
    process.exit(1);
  }
})();
