//genart
// commands/genart.js
// commands/genart.js
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const { getUser } = require('../services/db');
const checkTokenBalance = require('../services/tokenCheck');

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

    // Defer reply to allow time
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
        `**Are you already registered with your Stellar wallet using the user ID: \`${userId}\`?**\n\n` +
        `**Why is registration important?**\n` +
        `- We link your CJS User ID to your Stellar wallet.\n` +
        `- This lets us verify your **$CJS token balance** (10 $CJS required to generate art).\n` +
        `- It ensures we can later offer you the option to mint your art as an **NFT**!\n\n` +
        `👉 Please click **Yes** if you're registered, or **No** to register your Stellar wallet.`,
      components: [row],
    });

    const collector = interaction.channel.createMessageComponentCollector({
      time: 60000,
      filter: i => i.user.id === interaction.user.id,
    });

    collector.on('collect', async i => {
      if (i.customId === 'yes_registered') {
        const user = await getUser(userId);

        if (!user) {
          await i.reply({
            content: `❗ We couldn’t find a wallet linked to your ID: \`${userId}\`\nPlease send your **Stellar public key** to register.`,
            ephemeral: true,
          });
        } else {
          const balance = await checkTokenBalance(user.public_key);
          if (balance < 10) {
            await i.reply({
              content:
                `💸 You need at least **10 $CJS** to generate art.\n` +
                `Current balance: **${balance}**\n` +
                `Top up at: [https://yourdomain.com/buycjs](#)`,
              ephemeral: true,
            });
          } else {
            await i.reply({
              content:
                `✅ You're verified with enough tokens!\n` +
                `Please describe your art idea (e.g., *“A futuristic Black utopia on Mars”*).`,
              ephemeral: true,
            });
            // Setup another collector for art prompt if needed
          }
        }
        collector.stop();
      }

      if (i.customId === 'no_not_registered') {
        await i.reply({
          content: `Let's get you registered. Please reply with your **Stellar public key**.`,
          ephemeral: true,
        });
        collector.stop();
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.followUp({
          content: `⏰ You took too long. Please run \`/genart\` again.`,
          ephemeral: true,
        });
      }
    });
  },
};
