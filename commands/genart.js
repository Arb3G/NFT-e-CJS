//genart
const { SlashCommandBuilder } = require('discord.js');
const { getUser } = require('../services/db');
const checkTokenBalance = require('../services/tokenCheck');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('genart')
    .setDescription('Generate AI art using your $CJS tokens')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('Your Discord user ID (for verification)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.options.getString('userid');
    console.log(`[genart] Command triggered by ${interaction.user.tag}`);

    try {
      // 1. Defer reply immediately to avoid timeout
      await interaction.deferReply({ ephemeral: true });

      // 2. First follow-up (welcome prompt)
      await interaction.followUp(
        `👋🏾 Welcome to the **CJS Art Engine** — where your imagination meets the blockchain.\n\n` +
        `**Are you already registered with your Stellar wallet?**\n\n` +
        `**Why is registration important?**\n` +
        `- We need to link your Discord account to your Stellar wallet.\n` +
        `- This lets us verify your **$CJS token balance** (10 $CJS required to generate art).\n` +
        `- It ensures we can later offer you the option to mint your art as an **NFT**!\n\n` +
        `👉 Please reply with **Yes** or **No** to confirm your registration status.`
      );
    } catch (err) {
      console.error('❌ Error during followUp:', err);
      if (!interaction.replied) {
        await interaction.editReply({ content: '⚠️ Something went wrong. Please try again later.', ephemeral: true });
      }
      return; // Exit early on failure
    }

    // 3. Setup message collector for Yes/No registration check
    const filter = response =>
      response.author.id === interaction.user.id &&
      ['yes', 'no'].includes(response.content.toLowerCase());

    const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });

    collector.on('collect', async (message) => {
      const reply = message.content.toLowerCase();

      if (reply === 'yes') {
        const user = await getUser(userId);
        if (!user) {
          await interaction.followUp({
            content: `❗ No wallet found for this Discord ID. Please send your **Stellar public key**.`,
            ephemeral: true,
          });
          collector.stop();
          return;
        }

        const balance = await checkTokenBalance(user.public_key);
        if (balance < 10) {
          await interaction.followUp({
            content: `💸 You need **10 $CJS** to generate art.\nCurrent balance: ${balance}\nTop up: [https://yourdomain.com/buycjs](#)`,
            ephemeral: true,
          });
          collector.stop();
          return;
        }

        await interaction.followUp({
          content: `🧠 You're verified and have enough tokens!\n🎨 Now describe the art you want to create.`,
          ephemeral: true,
        });
        collector.stop();

      } else if (reply === 'no') {
        await interaction.followUp({
          content: `No problem! Please send your **Stellar public key** so we can register your wallet.`,
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
        }).catch(console.error); // Catch in case interaction is already replied
      }
    });
  },
};
