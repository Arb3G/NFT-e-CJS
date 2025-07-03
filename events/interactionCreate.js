// events/interactionCreate.js
module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {
    // ✅ Handle slash commands like /genart, /register, etc.
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

    // ✅ Handle button interactions (currently all routed to genart handler)
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
      return;
    }

    // ✅ Handle modal submissions
    if (interaction.isModalSubmit()) {
      // 🔹 Optional: YES flow via modal (not currently used, safe to keep)
      if (interaction.customId === 'cjs_id_modal') {
        const userId = interaction.fields.getTextInputValue('cjs_user_id_input').trim();

        await interaction.reply({
          content: '✅ Verifying your registration and balance...',
          ephemeral: true,
        });

        const result = await require('../services/genartFlow').runGenartFlow(userId, async (msg) => {
          await interaction.followUp({ content: msg, ephemeral: true });
        });

        if (!result.success) {
          console.warn(`⚠️ GenArt flow failed for ${userId}:`, result.reason);
        }
        return;
      }

      // 🔹 Registration modal from "No" button
      if (interaction.customId === 'register_modal') {
        const userId = interaction.fields.getTextInputValue('reg_cjs_id').trim();
        const wallet = interaction.fields.getTextInputValue('reg_wallet').trim();

        // 🔧 TODO: Save to DB (Supabase, Firebase, etc.)
        console.log(`📝 Registration received: ${userId} → ${wallet}`);

        await interaction.reply({
          content:
            `✅ Registration complete!\n**CJS ID**: \`${userId}\`\n**Wallet**: \`${wallet}\`\n\nWelcome, ${interaction.user.username}!`,
          ephemeral: true,
        });

        await interaction.followUp({
          content: `🎨 You can now run \`/genart\` to generate your first image.`,
          ephemeral: true,
        });
        return;
      }
    }
  },
};
