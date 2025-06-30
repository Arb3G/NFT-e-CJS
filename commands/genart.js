//genart
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUser } = require('../services/db');
const checkTokenBalance = require('../services/tokenCheck');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('genart')
    .setDescription('Generate AI art using your $CJS tokens'),

  async execute(interaction) {
    console.log(`[genart] Command triggered by ${interaction.user.tag}`);

    // Defer reply to acknowledge interaction and allow more time
    await interaction.deferReply({ ephemeral: true });

    // Create Yes / No buttons for registration question
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('genart_yes')
        .setLabel('Yes')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('genart_no')
        .setLabel('No')
        .setStyle(ButtonStyle.Danger)
    );

    // Send the prompt with buttons
    await interaction.editReply({
      content:
        `👋🏾 Welcome to the **CJS Art Engine** — where your imagination meets the blockchain.\n\n` +
        `**Are you already registered with your Stellar wallet?**\n\n` +
        `**Why is registration important?**\n` +
        `- We need to link your Discord account to your Stellar wallet.\n` +
        `- This lets us verify your **$CJS token balance** (10 $CJS required to generate art).\n` +
        `- It ensures we can later offer you the option to mint your art as an **NFT**!\n\n` +
        `👉 Please click **Yes** or **No** below to confirm your registration status.`,
      components: [row],
    });

    // Filter for buttons: only from the original user, and only for genart_yes or genart_no
    const filter = (btnInteraction) =>
      ['genart_yes', 'genart_no'].includes(btnInteraction.customId) &&
      btnInteraction.user.id === interaction.user.id;

    // Create a collector for button interactions, max 1 response, timeout 60 seconds
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      max: 1,
      time: 60000,
    });

    collector.on('collect', async (btnInteraction) => {
      if (btnInteraction.customId === 'genart_yes') {
        await btnInteraction.update({ content: 'Great! Checking your registration...', components: [] });

        // Check user registration and token balance
        try {
          const user = await getUser(btnInteraction.user.id);
          if (!user) {
            await btnInteraction.followUp({
              content:
                '❗ We couldn’t find your wallet linked to this Discord ID.\n' +
                'Please send your **Stellar public key** (e.g., GABC...1234) to register.',
              ephemeral: true,
            });
            return;
          }

          const balance = await checkTokenBalance(user.public_key);
          if (balance < 10) {
            await btnInteraction.followUp({
              content:
                `💸 You need at least **10 $CJS** tokens to generate art.\n` +
                `Your current balance is **${balance}**.\n` +
                `Please top up here: [https://yourdomain.com/buycjs](#)\n` +
                `Once topped up, run \`/genart\` again.`,
              ephemeral: true,
            });
            return;
          }

          await btnInteraction.followUp({
            content:
              '🧠 Registration confirmed! 🎨 You have enough **$CJS** tokens to create art!\n' +
              'Please type the description of the art you want to create (e.g., "A futuristic Black city on Mars").',
            ephemeral: true,
          });

          // TODO: Add next step to collect art description here

        } catch (error) {
          console.error('[genart] Error during registration/token check:', error);
          await btnInteraction.followUp({
            content: '⚠️ Sorry, something went wrong checking your registration. Please try again later.',
            ephemeral: true,
          });
        }
      } else if (btnInteraction.customId === 'genart_no') {
        await btnInteraction.update({
          content: 'No problem! Please send your **Stellar public key** so we can link your wallet.',
          components: [],
          ephemeral: true,
        });
      }
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        interaction.editReply({ content: 'You did not respond in time. Please run the command again.', components: [] });
      }
    });
  },
};
