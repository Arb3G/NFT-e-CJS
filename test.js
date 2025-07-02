const { REST, Routes } = require('discord.js');
//require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    //const data = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID));
    const data = await rest.get(Routes.applicationGuildCommands(process.env.CLIENT_ID,process.env.GUILD_ID));
    console.log('✅ Successfully fetched commands:', data);
  } catch (error) {
    console.error('❌ GET request failed:', error);
  }
})();
