//index.js
// index.js
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

// Check for Discord token early
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ ERROR: DISCORD_TOKEN environment variable not set.');
  process.exit(1);
}

console.log('✅ Discord token: [loaded]');
console.log('🚀 Starting bot...');

// Create client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // ✅ This is critical to collect user input
    GatewayIntentBits.DirectMessages,
  ],
});

// Collection for slash commands
client.commands = new Collection();

// === Load Commands ===
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`📁 Found ${commandFiles.length} command file(s).`);

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);

  try {
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
      console.warn(`⚠️ Skipped invalid command file: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error loading command file "${file}":`, error);
  }
}

// === Load Events ===
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

console.log(`📁 Found ${eventFiles.length} event file(s).`);

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);

  try {
    const event = require(filePath);

    if (!event.name || !event.execute) {
      console.warn(`⚠️ Skipped invalid event file: ${file}`);
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => {
        console.log(`🔁 Loaded event (once): ${event.name}`);
        event.execute(...args, client);
      });
    } else {
      client.on(event.name, (...args) => {
        console.log(`🔁 Loaded event: ${event.name}`);
        event.execute(...args, client);
      });
    }
  } catch (error) {
    console.error(`❌ Error loading event file "${file}":`, error);
  }
}

// === Log all messages for debugging ===
client.on('messageCreate', msg => {
  console.log(`[💬] Message in #${msg.channel?.name || 'DM'} from ${msg.author.tag}: ${msg.content}`);
});

// === Login to Discord ===
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('📡 Login request sent to Discord.'))
  .catch(error => {
    console.error('❌ Login failed:', error);
    process.exit(1);
  });

// === Optional Error Handling ===
client.on('error', err => {
  console.error('💥 Discord client error:', err);
});

client.on('warn', warning => {
  console.warn('⚠️ Discord client warning:', warning);
});
