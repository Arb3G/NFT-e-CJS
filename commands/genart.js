//genart
// commands/genart.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUser } = require('../services/db');
const checkTokenBalance = require('../services/tokenCheck');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('genart')
    .setDescription('Generate AI art using your $CJS tokens'),

  async execute(interaction) {
    const discordId = interaction.user.id;

    // Defer reply so we can show ephemeral follow-ups
    await interaction.deferReply({ ephemeral: true });

    // Create the Yes/No button row
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

    // Initial onboarding message
    await interaction.editReply({
      content:
        `👋🏾 Welcome to the **CJS Art Engine** — where your imagination meets the blockchain.\n\n` +
        `**Are you already registered with your Stellar wallet?**\n\n` +
        `**Why is registration important?**\n` +
        `- We need to link your Discord account to your Stellar wallet.\n` +
        `- This lets us verify your **$CJS token balance** (10 $CJS required to generate art).\n` +
        `- It ensures we can later offer you the option to mint your art as an **NFT**!\n\n` +
        `👉 Please click **Yes** or **No** below.`,
      components: [row],
    });

    // Set up a component collector for the buttons
    const collector = interaction.channel.createMessageComponentCollector({
      time: 60000,
      filter: i => i.user.id === discordId,
    });

    collector.on('collect', async i => {
      if (i.customId === 'yes_registered') {
        const user = await getUser(discordId);

        if (!user) {
          await i.reply({
            content: `❗ We couldn’t find your wallet linked to this Discord ID.\n\nPlease send your **Stellar public key** (e.g., GABC...1234) to get started.`,
            ephemeral: true,
          });
        } else {
          const balance = await checkTokenBalance(user.public_key);
          if (balance < 10) {
            await i.reply({
              content: `💸 You need at least **10 $CJS** to generate art.\nYour current balance is **${balance}**.\nTop up here: [https://yourdomain.com/buycjs](#)`,
              ephemeral: true,
            });
          } else {
            await i.reply({
              content: `🧠 Registration confirmed!\n🎨 You have enough **$CJS** tokens to create art!\nPlease type your art prompt (e.g., *“A futuristic Black city on Mars”*).`,
              ephemeral: true,
            });

            // You can add another collector here to get the art description if needed
          }
        }
        collector.stop();
      }

      if (i.customId === 'no_not_registered') {
        await i.reply({
          content: `No worries! Let’s get you registered.\nPlease send your **Stellar public key** (e.g., GABC...1234) so we can link your wallet.`,
          ephemeral: true,
        });
        collector.stop();
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.followUp({
          content: '❗ You took too long to respond. Please run the command again.',
          ephemeral: true,
        });
      }
    });
  },
};
