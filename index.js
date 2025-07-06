// === Express Web Server Setup ===
const express = require('express');
const app = express();

// Redirect route for Stellar payment
const redirectRoute = require('./routes/redirect');
app.use('/', redirectRoute);

// Optional: Basic root route to avoid "Cannot GET /"
app.get('/', (req, res) => {
  res.send('✅ Discord bot and web server are running.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌐 Express server running at http://localhost:${PORT}`);
});

// === Discord Bot Setup ===
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

if (!process.env.DISCORD_TOKEN) {
  console.error('❌ ERROR: DISCORD_TOKEN environment variable not set.');
  process.exit(1);
}

console.log('✅ Discord token: [loaded]');
console.log('🚀 Starting Discord bot...');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: ['CHANNEL'], // needed for DMs
});

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

// === Interaction Logging ===
client.on('interactionCreate', interaction => {
  if (interaction.isChatInputCommand()) {
    console.log(`⚡ Slash command: /${interaction.commandName} from ${interaction.user.tag}`);
  }
  if (interaction.isButton()) {
    console.log(`🔘 Button pressed: ${interaction.customId} by ${interaction.user.tag}`);
  }
  if (interaction.isModalSubmit()) {
    console.log(`📝 Modal submitted: ${interaction.customId} by ${interaction.user.tag}`);
  }
});

// === Log ALL Messages (DMs and Servers)
client.on('messageCreate', msg => {
  const isDM = msg.channel.type === 1 || msg.channel.type === 'DM';

  console.log(`📨 Message received:`);
  console.log(`   Author: ${msg.author.tag} (${msg.author.id})`);
  console.log(`   Channel: ${isDM ? 'DM' : `#${msg.channel.name} (${msg.channel.id})`}`);
  console.log(`   Guild: ${msg.guild ? `${msg.guild.name} (${msg.guild.id})` : 'Direct Message'}`);
  console.log(`   Content: "${msg.content}"`);
});

// === Login to Discord ===
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('📡 Discord bot logged in and ready.'))
  .catch(error => {
    console.error('❌ Discord login failed:', error);
    process.exit(1);
  });

// === Optional Error Handling ===
client.on('error', err => {
  console.error('💥 Discord client error:', err);
});

client.on('warn', warning => {
  console.warn('⚠️ Discord client warning:', warning);
});

// === Middleware ===
app.use(express.json()); // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies

// Routes
app.use('/', require('./routes/redirect'));

// Basic health check endpoint
app.get('/', (req, res) => {
  res.send('🤖 Discord Bot & Web Server Running!');
});

// Start web server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Web server running on port ${PORT}`);
  console.log(`🔗 Redirect endpoint available at /pay`);
});
