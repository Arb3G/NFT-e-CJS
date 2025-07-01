// events/interactionCreate.js
// events/interactionCreate.js
module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        console.error(`❌ No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`❌ Error executing ${interaction.commandName}:`, error);
        const reply = { content: 'There was an error executing this command!', ephemeral: true };
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
      return;
    }

    // Handle button interactions (optional routing if buttons live inside commands)
    if (interaction.isButton()) {
      try {
        const command = client.commands.get('genart'); // or dynamically route if needed
        if (command && typeof command.handleButton === 'function') {
          await command.handleButton(interaction);
        } else {
          console.warn(`⚠️ No button handler found for: ${interaction.customId}`);
        }
      } catch (error) {
        console.error(`❌ Error handling button interaction:`, error);
        if (!interaction.replied) {
          await interaction.reply({ content: '❌ Button error.', ephemeral: true });
        }
      }
    }
  },
};
