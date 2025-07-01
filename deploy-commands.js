//deploy-commands.js
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');

// Load commands
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data) commands.push(command.data.toJSON());
}

// Create REST client with debug enabled
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Enable debug logging for discord.js REST internals
process.env.DEBUG = 'discord:*';

console.log('📤 Attempting to register the following commands:');
console.log('CLIENT_ID:', process.env.CLIENT_ID);
console.log('GUILD_ID:', process.env.GUILD_ID);
console.log('COMMANDS:', commands.map(cmd => cmd.name));

(async () => {
  try {
    console.log('🔎 Attempting to register commands...');

    // Change this to guild commands for faster iteration if you have GUILD_ID
    const route = process.env.GUILD_ID
      ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
      : Routes.applicationCommands(process.env.CLIENT_ID);

    const response = await rest.put(route, { body: commands });

    console.log('✅ Successfully registered commands:', response);
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
