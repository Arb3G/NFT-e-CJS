//index.js
const fs = require('node:fs'); // File system module to read command/event files
const path = require('node:path'); // To handle file paths
const { Client, Collection, GatewayIntentBits } = require('discord.js'); // Discord.js library

// Check if the Discord token is loaded in environment variables and log status
console.log('Discord token:', process.env.DISCORD_TOKEN ? '[loaded]' : '[missing]');

// Exit early if no token to avoid mysterious login errors
if (!process.env.DISCORD_TOKEN) {
  console.error('ERROR: DISCORD_TOKEN environment variable not set. Please export it before running.');
  process.exit(1);
}

console.log('Starting bot...');

// Create a new Discord client instance with the intents we need (Guilds for slash commands)
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Create a collection (map) to hold all commands
client.commands = new Collection();

// -----------------
// Load commands
// -----------------
const commandsPath = path.join(__dirname, 'commands');
// Read all files in the commands directory ending with .js
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`Found ${commandFiles.length} command file(s).`);

// For each command file, require it and add it to the commands collection
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  // Validate that command file exports 'data' and 'execute' properties
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`Loaded command: ${command.data.name}`);
  } else {
    console.warn(`[WARN] Command ${filePath} is missing data or execute.`);
  }
}

// -----------------
// Load events
// -----------------
const eventsPath = path.join(__dirname, 'events');
// Read all event files ending with .js
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

console.log(`Found ${eventFiles.length} event file(s).`);

// For each event file, require it and register event handlers on the client
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  // If event should fire once, use client.once; otherwise use client.on
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

// -----------------
// Login to Discord
// -----------------
// This must only be called once per bot instance
// The promise resolves when the login request is sent
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('Login request sent to Discord.'))
  .catch(error => {
    console.error('Login failed:', error);
    process.exit(1); // Exit if login fails
  });

// -----------------
// Ready event handler
// -----------------
// Listen for the client 'ready' event once the bot has successfully connected and cached data
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}! Bot is ready.`);
});

// -----------------
// Optional global error and warning listeners
// -----------------
// Catch unexpected Discord client errors to prevent crashes and help debugging
client.on('error', error => {
  console.error('Discord client error:', error);
});

client.on('warn', info => {
  console.warn('Discord client warning:', info);
});
