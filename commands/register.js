// commands/register.js
const { SlashCommandBuilder } = require('discord.js');
const { getUser, addUser } = require('../services/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register your wallet to use the bot')
    .addStringOption(option =>
      option.setName('publickey')
        .setDescription('Your Stellar wallet public key')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const publicKey = interaction.options.getString('publickey');

    // Check if user already registered
    try {
      const existingUser = await getUser(userId);

      if (existingUser) {
        return interaction.reply({
          content: '✅ You are already registered.',
          ephemeral: true,
        });
      }

      // Register the new user
      await addUser(userId, publicKey);

      return interaction.reply({
        content: `🎉 Registration complete! Your wallet \`${publicKey}\` is now linked.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('❌ Registration failed:', error);
      return interaction.reply({
        content: '⚠️ Something went wrong while registering.',
        ephemeral: true,
      });
    }
  }
};
