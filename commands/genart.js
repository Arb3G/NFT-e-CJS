//genart.js for Discord
// commands/genart.js
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const { runGenartFlow } = require('../services/genartFlow');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('genart')
    .setDescription('Generate AI art using your $CJS tokens'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('yes_registered')
        .setLabel('Yes')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('no_not_registered')
        .setLabel('No')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({
      content:
        `👋🏾 Welcome to the **CJS Art Engine** — where your imagination meets the blockchain.\n\n` +
        `Are you already registered with your Stellar wallet?\n\n` +
        `**Why is registration important?**\n` +
        `- It links your CJS User ID to your Stellar wallet.\n` +
        `- We verify your **$CJS balance** (10 required to generate art).\n` +
        `- It allows us to mint your art as an **NFT** later.\n\n` +
        `👉 Click **Yes** if you're registered, or **No** to register now.`,
      components: [row],
    });

    const collector = interaction.channel.createMessageComponentCollector({
      time: 60000,
      filter: i => i.user.id === interaction.user.id,
    });

    collector.on('collect', async i => {
      if (i.customId === 'yes_registered') {
        await i.reply({
          content: '🔑 Please enter your **CJS User ID** (not Discord ID):',
          ephemeral: true,
        });

        const messageCollector = interaction.channel.createMessageCollector({
          time: 60000,
          filter: m => m.author.id === interaction.user.id,
        });

        messageCollector.on('collect', async m => {
          const userId = m.content.trim();
          messageCollector.stop();

          await i.followUp({ content: `🔍 Looking up ID \`${userId}\`...`, ephemeral: true });

          const result = await runGenartFlow(userId, async msg => {
            await i.followUp({ content: msg, ephemeral: true });
          });

          if (!result.success) {
            console.warn(`⚠️ genart flow failed:`, result.reason);
          }
        });
      }

      if (i.customId === 'no_not_registered') {
        await i.reply({
          content: '📝 Please send your **Stellar public key** to register. You can run `/register` to begin.',
          ephemeral: true,
        });
        collector.stop();
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.followUp({
          content: `⏰ You took too long to respond. Please run \`/genart\` again.`,
          ephemeral: true,
        });
      }
    });
  },
};
