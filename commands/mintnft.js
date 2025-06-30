// mintnft.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mintnft')
    .setDescription('Mint your AI art as an NFT (placeholder for now)'),

  async execute(interaction) {
    await interaction.reply({
      content: '🚧 NFT minting is not available yet. Stay tuned!',
      ephemeral: true
    });
  }
};

