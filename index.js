//index.js
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

// --- 1. ENV CHECK ---
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ ERROR: DISCORD_TOKEN not set. Use `export DISCORD_TOKEN=...` before running.');
  process.exit(1);
}

console.log('✅ Discord token: [loaded]');
console.log('🚀 Starting bot...');

// --- 2. CLIENT INIT ---
const client = new Client({
  intents: [GatewayIntentBits.Guilds], // Only Guilds intent needed for slash commands
});

client.commands = new Collection();

// --- 3. LOAD COMMANDS ---
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`📁 Found ${commandFiles.length} command file(s).`);

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`✅ Loaded command: ${command.data.name}`);
  } else {
    console.warn(`[⚠️] Skipped invalid command in ${filePath} — missing "data" or "execute".`);
  }
}

// --- 4. LOAD EVENTS ---
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

console.log(`📁 Found ${eventFiles.length} event file(s).`);

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  if (event.once) {
    client.once(event.name, (...args) => {
      console.log(`🔁 Loaded (once) event: ${event.name}`);
      event.execute(...args, client);
    });
  } else {
    client.on(event.name, (...args) => {
      console.log(`🔁 Loaded event: ${event.name}`);
      event.execute(...args, client);
    });
  }
}

// --- 5. LOGIN TO DISCORD ---
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('🔐 Login request sent to Discord...'))
  .catch(error => {
    console.error('❌ Login failed:', error);
    process.exit(1);
  });

// --- 6. READY: BOT CONNECTED ---
client.once('ready', () => {
  console.log(`🎉 Logged in as ${client.user.tag} (ID: ${client.user.id})`);
  console.log(`🧠 Bot is in ${client.guilds.cache.size} server(s):`);
  client.guilds.cache.forEach(guild => {
    console.log(` - 🛡️ ${guild.name} (ID: ${guild.id})`);
  });
});

// --- 7. GLOBAL ERROR HANDLERS ---
client.on('error', error => {
  console.error('🚨 Discord client error:', error);
});

client.on('warn', info => {
  console.warn('⚠️ Discord client warning:', info);
});
