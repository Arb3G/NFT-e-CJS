//index.js
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
//require('dotenv').config(); // only if using .env

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Commands collection
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Load commands
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`✅ Loaded command: ${command.data.name}`);
  } else {
    console.warn(`⚠️ Skipping ${file} (missing data or execute)`);
  }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

console.log(`📁 Found ${eventFiles.length} event file(s).`);

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// On bot ready
client.once('ready', () => {
  console.log(`✅ Bot connected as ${client.user.tag}`);
  console.log(`🧠 Logged into ${client.guilds.cache.size} server(s):`);

  client.guilds.cache.forEach(guild => {
    console.log(`🔗 Guild: ${guild.name} (ID: ${guild.id})`);
  });

  console.log(`📡 Ready to receive slash commands.`);
});

// Login
client.login(process.env.DISCORD_TOKEN || 'YOUR_DISCORD_TOKEN_HERE');
