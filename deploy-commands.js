//deploy-commands.js
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
//require('dotenv').config(); // Optional but recommended

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data) commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

console.log('📤 Attempting to register the following commands:');
console.log('CLIENT_ID:', process.env.CLIENT_ID);
console.log('GUILD_ID:', process.env.GUILD_ID ?? '(undefined)');
console.log('COMMANDS:', commands.map(cmd => cmd.name));

// Pick correct route
const route = process.env.GUILD_ID
  ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
  : Routes.applicationCommands(process.env.CLIENT_ID);

(async () => {
  try {
    console.log('🔎 Registering commands to route:', route);

    const response = await rest.put(route, { body: commands });

    console.log('✅ Successfully registered commands!');
    console.dir(response, { depth: null });
  } catch (error) {
    console.error('❌ Error registering commands:', error);
    if (error.request?.path) console.error('Failed endpoint:', error.request.path);
  }
})();
