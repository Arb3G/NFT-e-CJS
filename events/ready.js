// events/ready.js
module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`🎉 Logged in as ${client.user.tag}! Bot is ready.`);
    console.log(`🔗 Bot is in ${client.guilds.cache.size} server(s):`);
    client.guilds.cache.forEach(guild => {
      console.log(` - ${guild.name} (ID: ${guild.id})`);
    });
  },
};
