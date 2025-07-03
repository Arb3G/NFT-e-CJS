// events/interactionCreate.js
module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {
    // Slash commands: /genart, /register, etc.
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

    // Button interactions (Yes / No in /genart)
    if (interaction.isButton()) {
      try {
        const command = client.commands.get('genart');
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

    // Modal submission for registration
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'register_modal') {
        const { addUser } = require('../services/db');

        const userId = interaction.fields.getTextInputValue('reg_cjs_id').trim();
        const wallet = interaction.fields.getTextInputValue('reg_wallet').trim();

        if (!/^[a-zA-Z0-9_-]{3,30}$/.test(userId)) {
          await interaction.reply({
            content: '❌ Invalid CJS ID. Use 3–30 letters, numbers, dashes or underscores.',
            ephemeral: true,
          });
          return;
        }

        if (!/^G[A-Z2-7]{55}$/.test(wallet)) {
          await interaction.reply({
            content: '❌ Invalid Stellar wallet address.',
            ephemeral: true,
          });
          return;
        }

        const saved = await addUser(userId, wallet);
        if (!saved) {
          await interaction.reply({
            content: '❌ Registration failed. Please try again later.',
            ephemeral: true,
          });
          return;
        }

        await interaction.reply({
          content:
            `✅ Registered!\n**CJS ID**: \`${userId}\`\n**Wallet**: \`${wallet}\`\n\nYou may now run \`/genart\`.`,
          ephemeral: true,
        });
      }
    }
  },
};
