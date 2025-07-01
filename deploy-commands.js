//deploy-commands.js
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
//require('dotenv').config(); // optional if you use .env

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data) commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// 🔽 INSERT DEBUG LOGGING HERE
console.log('📤 Attempting to register the following commands:');
console.log('CLIENT_ID:', process.env.CLIENT_ID);
console.log('GUILD_ID:', process.env.GUILD_ID);
console.log('COMMANDS:', commands.map(cmd => cmd.name));

// 🚀 Deploy
(async () => {
  try {
    console.log('🔎 Attempt 1 of 3...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('✅ Successfully registered application commands.');
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
