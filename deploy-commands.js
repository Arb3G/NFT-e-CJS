//deploy-commands.js
// deploy-commands.js
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
//require('dotenv').config(); // Ensure .env is loaded

// ✅ Load commands from ./commands
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if (command.data) {
    commands.push(command.data.toJSON());
  }
}

// ✅ Create REST client
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// 🧪 DEBUG logging
console.log('📤 Preparing to register the following commands...');
console.log('CLIENT_ID:', process.env.CLIENT_ID);
console.log('Total commands:', commands.length);
commands.forEach(cmd => console.log(` - ${cmd.name}`));

// 🚀 Deploy
(async () => {
  try {
    console.log('🔎 Attempting to refresh global application (/) commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Successfully registered application commands globally.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
    if (error.response && error.response.data) {
      console.error('📦 Error details:', error.response.data);
    }
  }
})();
