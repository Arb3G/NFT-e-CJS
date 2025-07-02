//genart.js for Discord
// commands/genart.js
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const QRCode = require('qrcode');

const { getUser } = require('../services/db');
const { checkCJSBalance } = require('../services/tokenCheck');
const { startPaymentMonitor } = require('../services/paymentMonitor');

const PAYMENT_AMOUNT = '10';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('genart')
    .setDescription('Generate AI art using your $CJS tokens'),

  // Slash command execution (starts the flow by asking registration status)
  async execute(interaction) {
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
        `**Are you already registered with your Stellar wallet?**\n\n` +
        `**Why is registration important?**\n` +
        `- We link your CJS User ID to your Stellar wallet.\n` +
        `- This lets us verify your **$CJS token balance** (10 $CJS required to generate art).\n` +
        `- It ensures we can later offer you the option to mint your art as an **NFT**!\n\n` +
        `👉 Please click **Yes** if you're registered, or **No** to register your Stellar wallet.`,
      components: [row],
    });
  },

  // Button interaction handler (called by your interactionCreate event)
  async handleButton(interaction) {
    const userId = interaction.user.id; // or get userId from DB/other source if needed

    if (interaction.customId === 'yes_registered') {
      await interaction.deferReply({ ephemeral: true });

      const user = await getUser(userId);
      if (!user) {
        await interaction.editReply({
          content: `❗ No wallet found for your user ID. Please register your Stellar wallet first.`,
        });
        return;
      }

      const balance = await checkCJSBalance(user.public_key);
      if (balance < 10) {
        await interaction.editReply({
          content:
            `💸 You need at least **10 $CJS** in your wallet.\n` +
            `Current balance: **${balance}**\n` +
            `Top up here: [https://yourdomain.com/buycjs](#)`,
        });
        return;
      }

      const TREASURY_PUBLIC_KEY = process.env.TREASURY_PUBLIC_KEY;
      const STELLAR_ISSUER_ADDRESS = process.env.STELLAR_ISSUER_ADDRESS;

      if (!TREASURY_PUBLIC_KEY || !STELLAR_ISSUER_ADDRESS) {
        await interaction.editReply({
          content: '❌ Server config error: Payment system is not properly configured.',
        });
        return;
      }

      const memo = `genart-${userId}`;
      const paymentURI = `web+stellar:pay?destination=${TREASURY_PUBLIC_KEY}` +
        `&amount=${PAYMENT_AMOUNT}` +
        `&asset_code=CJS` +
        `&asset_issuer=${STELLAR_ISSUER_ADDRESS}` +
        `&memo=${encodeURIComponent(memo)}`;

      const qrCodeDataUrl = await QRCode.toDataURL(paymentURI);

      await interaction.editReply({
        content:
          `✅ You're verified and funded!\n\n` +
          `🧾 Please send **${PAYMENT_AMOUNT} $CJS** to proceed by scanning the QR code or clicking the link below:\n` +
          `${paymentURI}\n\n` +
          `We'll wait up to 90 seconds for payment confirmation...`,
        files: [{ attachment: qrCodeDataUrl, name: 'payment-qr.png' }],
      });

      const confirmed = await startPaymentMonitor(user.public_key, PAYMENT_AMOUNT, memo, 90000);
      if (!confirmed.success) {
        await interaction.followUp({
          content: `❌ Payment not detected within 90 seconds. Please try again.`,
          ephemeral: true,
        });
        return;
      }

      await interaction.followUp({
        content: `🎨 Payment received! Please describe your art idea (e.g., *“A futuristic Black utopia on Mars”*).`,
        ephemeral: true,
      });

    } else if (interaction.customId === 'no_not_registered') {
      await interaction.deferReply({ ephemeral: true });
      await interaction.editReply({
        content:
          `No problem! Please send your **Stellar public key** (e.g., GABC...1234) to link your wallet.`,
      });
    } else {
      await interaction.reply({ content: `⚠️ Unknown button: ${interaction.customId}`, ephemeral: true });
    }
  },
};
