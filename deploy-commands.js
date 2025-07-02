//deploy-commands.js
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');

// Uncomment this line if you use a .env file instead of shell exports
// require('dotenv').config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

console.log('--- Environment Variables ---');
console.log('DISCORD_TOKEN:', token ? '✅ set' : '❌ missing');
console.log('CLIENT_ID:', clientId || '❌ missing');
console.log('GUILD_ID:', guildId || '❌ missing');
console.log('-----------------------------');

if (!token || !clientId || !guildId) {
  console.error('❌ Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID environment variables.');
  process.exit(1);
}

// Load commands
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

console.log(`📁 Found ${commandFiles.length} command file(s).`);

for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);
    if (command.data && typeof command.data.toJSON === 'function') {
      commands.push(command.data.toJSON());
      console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
      console.warn(`⚠️ Skipping command ${file} — missing or invalid .data`);
    }
  } catch (error) {
    console.error(`❌ Error loading command file ${file}:`, error);
  }
}

const rest = new REST({ version: '10' }).setToken(token);
const route = Routes.applicationGuildCommands(clientId, guildId);

(async () => {
  try {
    console.log('Testing bot guild membership...');
    const guild = await rest.get(Routes.guild(guildId));
    console.log(`Guild found: ${guild.name} (ID: ${guild.id})`);
  } catch (error) {
    console.error('Failed to access guild:', error);
  }
})();


(async () => {
  try {
    console.log('🧹 Attempting to clear existing guild commands...');
    await rest.put(route, { body: [] });
    console.log('✅ Cleared existing guild commands.');

    console.log('📤 Attempting to register new guild commands...');
    console.log('CLIENT_ID:', clientId);
    console.log('GUILD_ID:', guildId);
    console.log('COMMANDS:', commands.map(cmd => cmd.name));
    console.log('ROUTE:', route);

    const response = await rest.put(route, { body: commands });
    console.log(`✅ Successfully registered ${response.length} guild command(s)!`);
    console.dir(response, { depth: null });

  } catch (error) {
    console.error('❌ Error registering commands:', error);

    if (error.request?.path) {
      console.error('📉 Failed endpoint:', error.request.path);
    }
    if (error.response?.data) {
      console.error('📉 Discord response error data:', error.response.data);
    }
    if (error.stack) {
      console.error('🧵 Stack trace:', error.stack);
    }
  }
})();
