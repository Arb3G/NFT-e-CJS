const { REST, Routes } = require('discord.js');

// Replace these with actual values or use process.env
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('📡 Fetching guild slash commands...');
    const commands = await rest.get(
      Routes.applicationGuildCommands(clientId, guildId)
    );
    console.log('✅ Successfully fetched guild commands:', commands);
  } catch (error) {
    console.error('❌ Error fetching guild commands:', error);
  }
})();
