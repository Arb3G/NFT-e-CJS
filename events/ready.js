//ready.js - previously empty
const startPaymentMonitor = require('../services/paymentMonitor'); // Optional, if you have this service

module.exports = {
  name: 'ready',
  once: true,

  /**
   * @param {import('discord.js').Client} client
   */
  async execute(client) {
    console.log(`✅ Bot connected as ${client.user.tag}`);
    console.log(`🧠 Connected to ${client.guilds.cache.size} guild(s):`);

    client.guilds.cache.forEach(guild => {
      console.log(` - 🛡️ ${guild.name} (ID: ${guild.id})`);
    });

    console.log('📡 Ready to receive slash commands.');

    // Optional: start services after bot is ready
    try {
      if (typeof startPaymentMonitor === 'function') {
        startPaymentMonitor(client);
        console.log('📈 Payment monitor started.');
      }
    } catch (err) {
      console.error('❌ Error starting payment monitor:', err.message);
    }
  }
};

