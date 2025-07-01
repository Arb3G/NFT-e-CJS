const { REST, Routes } = require('discord.js');
//require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    const data = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID));
    console.log('✅ Successfully fetched commands:', data);
  } catch (error) {
    console.error('❌ GET request failed:', error);
  }
})();
