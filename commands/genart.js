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
    await interaction.reply({
      content:
        `👋🏾 Welcome to the **CJS Art Engine** — where your imagination meets the blockchain.\n\n` +
        `**Are you already registered with your Stellar wallet?**\n\n` +
        `**Why is registration important?**\n` +
        `- It links your CJS User ID to your Stellar wallet.\n` +
        `- We verify your **$CJS balance** (10 required to generate art).\n` +
        `- It allows us to mint your art as an **NFT** later.\n\n` +
        `👉 Click **Yes** if you're registered, or **No** to register now.`,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('yes_registered')
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('no_not_registered')
            .setLabel('No')
            .setStyle(ButtonStyle.Secondary),
        ),
      ],
      ephemeral: true,
    });
  },

  async handleButton(interaction) {
    const { customId } = interaction;

    if (customId === 'yes_registered') {
      // Update message to prompt for CJS User ID and remove buttons
      await interaction.update({ content: '🔑 Please enter your CJS User ID (not Discord ID):', components: [] });

      const filter = m => m.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

      collector.on('collect', async (message) => {
        const userId = message.content.trim();

        // Use interaction.followUp to keep messages ephemeral and in context
        await interaction.followUp({ content: '✅ Verifying your registration and balance...', ephemeral: true });

        const result = await runGenartFlow(userId, async (msg) => {
          await interaction.followUp({ content: msg, ephemeral: true });
        });

        if (!result.success) {
          console.warn(`Flow failed:`, result.reason);
        }
      });

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          await interaction.followUp({
            content: `⏰ You took too long. Please run \`/genart\` again.`,
            ephemeral: true,
          });
        }
      });
    }

    if (customId === 'no_not_registered') {
      await interaction.update({
        content: `📥 To register, please run the \`/register\` command and include your Stellar public key.`,
        components: [],
      });
    }
  },
};
