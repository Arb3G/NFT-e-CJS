
module.exports = {
  name: 'interactionCreate',

  /**
   * @param {import('discord.js').Interaction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        console.warn(`[WARN] Command '${interaction.commandName}' not found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`❌ Error executing '${interaction.commandName}':`, error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: '⚠️ There was an error executing this command.', ephemeral: true });
        } else {
          await interaction.reply({ content: '⚠️ There was an error executing this command.', ephemeral: true });
        }
      }
    }

    // Handle button interactions
    if (interaction.isButton()) {
      const { customId } = interaction;

      if (customId === 'download_art') {
        await interaction.reply({
          content: '🖼️ Here’s your image — right-click and save it!',
          ephemeral: true
        });
      }

      else if (customId === 'mint_art') {
        await interaction.reply({
          content: '🛠️ NFT minting coming soon! You will need to confirm and pay via Stellar or Stripe.',
          ephemeral: true
        });

        // TODO: Add full mint logic here
        // Possibly call a function from `services/nftMint.js`
      }
    }
  }
};
