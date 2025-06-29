//commands /genart.js
const {
  SlashCommandBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const { getUser } = require('../services/db'); // Function to get user info from Supabase
const { checkCJSBalance } = require('../services/tokenCheck'); // Function to check Stellar CJS token balance
const { generateArt } = require('../services/replicate'); // Function to call AI art generation API

const REQUIRED_TOKENS = 10; // Minimum tokens required to generate art

module.exports = {
  // Define the slash command and options
  data: new SlashCommandBuilder()
    .setName('genart')
    .setDescription('Generate AI art using your CJS tokens')
    .addStringOption(option =>
      option.setName('prompt') // User input describing the art
        .setDescription('Describe what you want to generate')
        .setRequired(true)
    ),

  // Command execution logic
  async execute(interaction) {
    const discordId = interaction.user.id; // Discord user ID
    const prompt = interaction.options.getString('prompt'); // The art prompt

    // STEP 1: Verify if user is registered in Supabase
    const user = await getUser(discordId);
    if (!user) {
      // If not registered, reply privately asking them to register
      return interaction.reply({
        content: '❗ You are not registered. Please use `/register` first.',
        ephemeral: true, // Visible only to user
      });
    }

    // STEP 2: Check if user has enough CJS tokens in their Stellar wallet
    const balance = await checkCJSBalance(user.public_key);
    if (balance < REQUIRED_TOKENS) {
      return interaction.reply({
        content: `💸 You need at least ${REQUIRED_TOKENS} CJS tokens. You currently have ${balance}.`,
        ephemeral: true,
      });
    }

    // STEP 3: Generate AI art using Replicate API
    await interaction.deferReply(); // Acknowledge command to avoid timeout, show 'thinking...'

    const imageUrl = await generateArt(prompt);
    if (!imageUrl) {
      // Handle generation failure
      return interaction.editReply('⚠️ Art generation failed. Try again.');
    }

    // STEP 4: Prepare image to send as Discord attachment
    const image = new AttachmentBuilder(imageUrl, { name: 'art.png' });

    // STEP 5: Add buttons for Download or Mint NFT
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('download_art') // Custom ID for button interaction handling
        .setLabel('Download')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('mint_art')
        .setLabel('Mint as NFT')
        .setStyle(ButtonStyle.Success)
    );

    // STEP 6: Send final reply with image and buttons
    await interaction.editReply({
      content: `🎨 Prompt: *${prompt}*`,
      files: [image],
      components: [buttons],
    });
  },
};

