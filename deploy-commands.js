//deploy-commands.js
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');

// ✅ Load environment variables (optional if not using dotenv)
// require('dotenv').config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
  console.error('❌ Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID in env vars.');
  process.exit(1);
}

// ✅ Load all command files
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`⚠️ Skipping command ${file} — missing .data`);
  }
}

const rest = new REST({ version: '10' }).setToken(token);
const route = Routes.applicationGuildCommands(clientId, guildId);

console.log('📤 Attempting to register guild commands...');
console.log('CLIENT_ID:', clientId);
console.log('GUILD_ID:', guildId);
console.log('COMMANDS:', commands.map(cmd => cmd.name));
console.log('ROUTE:', route);

(async () => {
  try {
    const response = await rest.put(route, { body: commands });
    console.log('✅ Successfully registered guild commands!');
    console.dir(response, { depth: null });
  } catch (error) {
    console.error('❌ Error registering commands:', error);
    if (error.request?.path) {
      console.error('📉 Failed endpoint:', error.request.path);
    }
  }
})();
