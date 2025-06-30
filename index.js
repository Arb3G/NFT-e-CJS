const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

console.log('Discord token:', process.env.DISCORD_TOKEN ? '[loaded]' : '[missing]');

if (!process.env.DISCORD_TOKEN) {
  console.error('ERROR: DISCORD_TOKEN environment variable not set. Please export it before running.');
  process.exit(1);
}

console.log('Starting bot...');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

// Load commands from /commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`Found ${commandFiles.length} command file(s).`);
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`Loaded command: ${command.data.name}`);
  } else {
    console.warn(`[WARN] Command ${filePath} is missing data or execute.`);
  }
}

// Load events from /events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

console.log(`Found ${eventFiles.length} event file(s).`);
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => {
      console.log(`Event (once) loaded: ${event.name}`);
      event.execute(...args, client);
    });
  } else {
    client.on(event.name, (...args) => {
      console.log(`Event loaded: ${event.name}`);
      event.execute(...args, client);
    });
  }
}

client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('Login request sent to Discord.'))
  .catch(error => {
    console.error('Login failed:', error);
    process.exit(1);
  });

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}! Bot is ready.`);
});

// Optional: global error and warning listeners
client.on('error', error => {
  console.error('Discord client error:', error);
});
client.on('warn', info => {
  console.warn('Discord client warning:', info);
});
