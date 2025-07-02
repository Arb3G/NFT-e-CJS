//genart.js for Discord
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
        `- We link your CJS User ID to your Stellar wallet.\n` +
        `- This lets us verify your **$CJS token balance** (10 $CJS required to generate art).\n` +
        `- It ensures we can later offer you the option to mint your art as an **NFT**!\n\n` +
        `👉 Please click **Yes** if you're registered, or **No** to register your Stellar wallet.`,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('yes_registered')
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('no_not_registered')
            .setLabel('No')
            .setStyle(ButtonStyle.Secondary)
        ),
      ],
      ephemeral: true,
    });
  },

  // Handles button clicks from the initial interaction
  async handleButton(interaction) {
    if (interaction.customId === 'yes_registered') {
      await interaction.reply({
        content: '🔑 Please enter your **CJS User ID** (not Discord ID):',
        ephemeral: true,
      });

      const collector = interaction.channel.createMessageCollector({
        filter: m => m.author.id === interaction.user.id,
        time: 60000,
        max: 1,
      });

      collector.on('collect', async msg => {
        const userId = msg.content.trim();

        await msg.reply({ content: '🔍 Checking your registration and token balance...', ephemeral: true });

        const result = await runGenartFlow(userId, async message => {
          await msg.reply({ content: message, ephemeral: true });
        });

        if (!result.success) {
          console.warn(`Genart flow ended with reason: ${result.reason}`);
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.followUp({
            content: '⏰ You took too long to enter your user ID. Please run `/genart` again.',
            ephemeral: true,
          });
        }
      });

    } else if (interaction.customId === 'no_not_registered') {
      await interaction.reply({
        content:
          `📝 No problem! Please register your Stellar wallet by running the \`/register\` command first.\n\n` +
          `You’ll need to provide your Stellar public key and CJS User ID.`,
        ephemeral: true,
      });
    }
  },
};
