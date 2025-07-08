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
const { generateArt } = require('../services/replicate'); // your Replicate API wrapper

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
      ephemeral: false,
    });
  },

  async handleButton(interaction) {
    const { customId } = interaction;

    if (customId === 'yes_registered') {
      await interaction.update({ components: [] });

      await interaction.followUp({
        content: '🔑 Please enter your **CJS User ID** (not Discord ID) in this channel:',
        ephemeral: false,
      });

      const filter = (m) => m.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({
        filter,
        max: 1,
        time: 60000,
      });

      collector.on('collect', async (msg) => {
        const raw = msg.content;
        const cleanUserId = raw.replace(/<@!?(\d+)>/g, '').trim();

        if (!/^[a-zA-Z0-9_-]{3,30}$/.test(cleanUserId)) {
          await msg.channel.send(
            '❌ Invalid CJS ID. It must be 3–30 characters long and contain only letters, numbers, `_`, or `-`.'
          );
          return;
        }

        try {
          await msg.delete();
        } catch {
          // ignore deletion failure
        }

        await msg.channel.send(`✅ Thanks, ${interaction.user.username}. Verifying your registration and payment...`);

        // Run payment flow
        const result = await runGenartFlow(cleanUserId, async (response) => {
          if (typeof response === 'string') {
            await interaction.followUp({ content: response, ephemeral: true });
          } else {
            await interaction.followUp({ ...response, ephemeral: true });
          }
        });

        if (!result.success) {
          console.warn(`❌ GenArt flow failed: ${result.reason}`);
          return;
        }

        // Payment successful — now collect art prompt
        await msg.channel.send(
          `${interaction.user}, 🎨 Payment verified! Please describe your art idea (e.g., *"Afrofuturist utopia on Mars"*).\n` +
          `You have 2 minutes to reply.`
        );

        const promptFilter = (m) => m.author.id === interaction.user.id;
        const promptCollector = interaction.channel.createMessageCollector({
          filter: promptFilter,
          max: 1,
          time: 120000,
        });

        promptCollector.on('collect', async (promptMsg) => {
          const prompt = promptMsg.content.trim();
          await promptMsg.channel.send('🎨 Generating your art... Please wait.');

          try {
            const imageUrl = await generateArt(prompt);

            if (!imageUrl) {
              await promptMsg.channel.send('❌ Sorry, I couldn\'t generate the image. Please try again.');
            } else {
              await promptMsg.channel.send({ content: `Here is your art for: "${prompt}"`, files: [imageUrl] });
            }
          } catch (error) {
            console.error('Error generating art:', error);
            await promptMsg.channel.send('❌ Something went wrong while generating your art.');
          }
        });

        promptCollector.on('end', async (collected, reason) => {
          if (collected.size === 0) {
            await interaction.followUp({
              content: '⏰ You took too long to respond with your art idea. Please try the command again.',
              ephemeral: true,
            });
          }
        });
      });

      collector.on('end', async (collected, reason) => {
        if (collected.size === 0) {
          await interaction.followUp({
            content: '⏰ You took too long to provide your CJS User ID. Please run `/genart` again.',
            ephemeral: true,
          });
        }
      });
    }

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
