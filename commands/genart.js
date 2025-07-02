//genart.js for Discord
// commands/genart.js
const { SlashCommandBuilder } = require('discord.js');
const { runGenartFlow } = require('../services/genartFlow');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('genart')
    .setDescription('Generate AI art using your $CJS tokens')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('Your CJS User ID (NOT Discord ID)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.options.getString('userid');

    try {
      await interaction.deferReply({ ephemeral: true });

      await runGenartFlow({
        userId,
        send: async (msg, options = {}) => {
          return interaction.followUp({ content: msg, ephemeral: true, ...options });
        },
      });

      await interaction.followUp({
        content: `🎨 Payment confirmed! Starting your art generation...`,
        ephemeral: true,
      });

    } catch (error) {
      await interaction.followUp({
        content: `❌ Error: ${error.message || 'Unexpected failure.'}`,
        ephemeral: true,
      });
    }
  },
};

