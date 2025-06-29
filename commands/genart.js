//commands /genart.js
const { SlashCommandBuilder } = require('discord.js');
const { getUser } = require('../services/db'); // Database handler to fetch user info
const checkTokenBalance = require('../services/tokenCheck'); // Token balance checker
const generateImage = require('../services/replicate'); // AI image generation service

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

    // Step 1: Ask if user is registered
    await interaction.reply({
      content: `👋🏾 Welcome to the **CJS Art Engine** — where your imagination meets the blockchain.\n\n**Are you already registered with your Stellar wallet?**\n\n**Why is registration important?**\n- We need to link your Discord account to your Stellar wallet.\n- This lets us verify your **$CJS token balance** (10 $CJS required to generate art).\n- It ensures we can later offer you the option to mint your art as an **NFT**!\n\n👉 Please reply with **Yes** or **No** to confirm your registration status.`,
      ephemeral: true
    });

    // Wait for user's reply
    const filter = response => response.author.id === interaction.user.id && (response.content.toLowerCase() === 'yes' || response.content.toLowerCase() === 'no');
    const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });

    collector.on('collect', async (message) => {
      const reply = message.content.toLowerCase();

      // If "Yes", check user registration
      if (reply === 'yes') {
        const user = await getUser(userId);

        if (!user) {
          return interaction.reply({
            content: `❗ We couldn’t find your wallet linked to this Discord ID.\n\nTo generate art, we first need to link your **Stellar wallet**.\n\nPlease send your **Stellar public key** (e.g., GABC...1234) so I can register your wallet and get started.`,
            ephemeral: true
          });
        }

        // Check token balance
        const balance = await checkTokenBalance(user.public_key);
        if (balance < 10) {
          return interaction.reply({
            content: `💸 You need at least **10 $CJS** in your wallet to generate art.\nYour current balance is **${balance}**.\nPlease top up your wallet here: [https://yourdomain.com/buycjs](#)\nOnce your balance reaches 10 $CJS, come back and run \`/genart\` again.`,
            ephemeral: true
          });
        }

        // If user is registered and has enough tokens
        await interaction.reply({
          content: `🧠 Registration confirmed!\n🎨 You have enough **$CJS** tokens to create art!\nPlease type the description of the art you want to create (e.g., *“A futuristic Black city on Mars”*).`,
          ephemeral: true
        });
      }

      // If "No", prompt for registration
      else if (reply === 'no') {
        await interaction.reply({
          content: `No worries! Let’s get you registered so we can start creating your artwork.\nPlease send your **Stellar public key** (e.g., GABC...1234) so we can link your wallet.`,
          ephemeral: true
        });
      }

      collector.stop();
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        interaction.reply({ content: '❗ You took too long to respond. Please run the command again and reply with "Yes" or "No".', ephemeral: true });
      }
    });
  },
};
