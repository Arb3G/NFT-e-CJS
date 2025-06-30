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
//const checkTokenBalance = require('../services/tokenCheck');
const { checkCJSBalance } = require('../services/tokenCheck');
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

    // Acknowledge command to avoid timeout
    await interaction.deferReply({ ephemeral: true });

    // Build Yes/No buttons
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

    // Send intro message with buttons
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

    // Collect button clicks
    const collector = interaction.channel.createMessageComponentCollector({
      time: 60000,
      filter: i => i.user.id === interaction.user.id,
    });

    collector.on('collect', async i => {
      if (i.customId === 'yes_registered') {
        await i.deferReply({ ephemeral: true });

        const user = await getUser(userId);

        if (!user) {
          await i.editReply({
            content: `❗ No wallet found for ID \`${userId}\`. Please send your **Stellar public key** to register.`,
          });
          collector.stop();
          return;
        }

      //  const balance = await checkCJSBalance(user.public_key);
        const balance = await checkCJSBalance(user.public_key);

        if (balance < 10) {
          await i.editReply({
            content:
              `💸 You need at least **10 $CJS** in your wallet.\n` +
              `Current balance: **${balance}**\n` +
              `Top up here: [https://yourdomain.com/buycjs](#)`,
          });
        } else {
          await i.editReply({
            content:
              `✅ You're verified and funded!\n🎨 Please describe your art idea (e.g., *“A futuristic Black utopia on Mars”*).`,
          });
          // Future: Start collector for prompt
        }

        collector.stop();
      }

      if (i.customId === 'no_not_registered') {
        await i.deferReply({ ephemeral: true });

        await i.editReply({
          content:
            `No problem! Please send your **Stellar public key** (e.g., GABC...1234) to link your wallet to ID \`${userId}\`.`,
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
