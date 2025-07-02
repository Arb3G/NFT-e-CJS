// events/interactionCreate.js
module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
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

    if (interaction.isButton()) {
      try {
        const command = client.commands.get('genart');
        if (command && typeof command.handleButton === 'function') {
          await command.handleButton(interaction);
        } else {
          console.warn(`⚠️ No button handler found for: ${interaction.customId}`);
        }
      } catch (error) {
        console.error('❌ Error handling button interaction:', error);
        if (!interaction.replied) {
          await interaction.reply({ content: '❌ Button error.', ephemeral: true });
        }
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      try {
        const command = client.commands.get('genart');
        if (command && typeof command.handleModalSubmit === 'function') {
          await command.handleModalSubmit(interaction);
        }
      } catch (error) {
        console.error('❌ Error handling modal submit:', error);
        if (!interaction.replied) {
          await interaction.reply({ content: '❌ Modal error.', ephemeral: true });
        }
      }
    }
  },
};
