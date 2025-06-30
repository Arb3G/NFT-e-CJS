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

    // Defer reply to have more time and make reply ephemeral
    await interaction.deferReply({ ephemeral: true });

    await interaction.followUp(
      `👋🏾 Welcome to the **CJS Art Engine** — where your imagination meets the blockchain.\n\n` +
      `**Are you already registered with your Stellar wallet?**\n\n` +
      `**Why is registration important?**\n` +
      `- We need to link your Discord account to your Stellar wallet.\n` +
      `- This lets us verify your **$CJS token balance** (10 $CJS required to generate art).\n` +
      `- It ensures we can later offer you the option to mint your art as an **NFT**!\n\n` +
      `👉 Please reply with **Yes** or **No** to confirm your registration status.`
    );

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
            content: `❗ We couldn’t find your wallet linked to this Discord ID.\n` +
              `Please send your **Stellar public key** (e.g., GABC...1234) to register.`,
            ephemeral: true,
          });
          collector.stop();
          return;
        }

        const balance = await checkTokenBalance(user.public_key);
        if (balance < 10) {
          await interaction.followUp({
            content: `💸 You need at least **10 $CJS** to generate art.\n` +
              `Your current balance is **${balance}**.\n` +
              `Top up here: [https://yourdomain.com/buycjs](#)\n` +
              `Once topped up, run \`/genart\` again.`,
            ephemeral: true,
          });
          collector.stop();
          return;
        }

        await interaction.followUp({
          content: `🧠 Registration confirmed!\n🎨 You have enough **$CJS** tokens to create art!\n` +
            `Please type the description of the art you want to create (e.g., *“A futuristic Black city on Mars”*).`,
          ephemeral: true,
        });

        collector.stop();
      } else if (reply === 'no') {
        await interaction.followUp({
          content: `No worries! Let’s get you registered.\n` +
            `Please send your **Stellar public key** (e.g., GABC...1234) to link your wallet.`,
          ephemeral: true,
        });
        collector.stop();
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.followUp({
          content: '❗ You took too long to respond. Please run the command again and reply with "Yes" or "No".',
          ephemeral: true,
        });
      }
    });
  },
};
