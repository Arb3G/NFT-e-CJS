//commands/genart.js
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
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

    // ✅ YES: public message-based input
    if (customId === 'yes_registered') {
      await interaction.update({
        content: '🔑 Please enter your CJS User ID (not Discord ID) below in this channel:',
        components: [],
        ephemeral: false,
      });

      const filter = m => m.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

      collector.on('collect', async (msg) => {
        const userId = msg.content.trim();

        // 🧹 Delete the original message
        try {
          await msg.delete();
        } catch (err) {
          console.warn('⚠️ Could not delete message:', err.message);
        }

        await msg.channel.send(`✅ Thanks, ${interaction.user.username}. Verifying your registration...`);

        const result = await runGenartFlow(userId, async (response) => {
          await msg.channel.send(response);
        });

        if (!result.success) {
          console.warn(`❌ GenArt flow failed: ${result.reason}`);
        }
      });

      collector.on('end', async (collected, reason) => {
        if (collected.size === 0) {
          await interaction.followUp({
            content: '⏰ You took too long to respond. Please try `/genart` again.',
            ephemeral: true,
          });
        }
      });
    }

    // ❌ NO: open registration modal
    if (customId === 'no_not_registered') {
      const modal = new ModalBuilder()
        .setCustomId('register_modal')
        .setTitle('Register Your Wallet');

      const cjsIdInput = new TextInputBuilder()
        .setCustomId('reg_cjs_id')
        .setLabel('Preferred CJS ID')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const walletInput = new TextInputBuilder()
        .setCustomId('reg_wallet')
        .setLabel('Stellar Wallet Address (CJS Address)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(cjsIdInput),
        new ActionRowBuilder().addComponents(walletInput)
      );

      await interaction.showModal(modal);
    }
  },
};
