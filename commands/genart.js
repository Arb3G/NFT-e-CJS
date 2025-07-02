//genart.js for Discord
const { runGenArt } = require('../services/genartLogic');

async execute(interaction) {
  const userId = interaction.options.getString('userid');

  try {
    await interaction.deferReply({ ephemeral: true });

    // Call core logic but use Discord replies:
    const result = await runGenArt(userId, {
      sendReply: async (msg) => await interaction.followUp({ content: msg, ephemeral: true }),
      // ... any other Discord-specific hooks
    });

    await interaction.followUp(`🎨 Payment confirmed! Starting your art generation...`);
  } catch (error) {
    await interaction.followUp(`❌ Error: ${error.message}`);
  }
}
