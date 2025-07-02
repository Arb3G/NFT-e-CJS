//genart.js for Discord
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
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

  async execute(interaction) {
    // Initial message with buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('yes_registered')
        .setLabel('Yes')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('no_not_registered')
        .setLabel('No')
        .setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({
      content:
        `👋🏾 Welcome to the **CJS Art Engine** — where your imagination meets the blockchain.\n\n` +
        `**Are you already registered with your Stellar wallet?**\n\n` +
        `**Why is registration important?**\n` +
        `- We link your CJS User ID to your Stellar wallet.\n` +
        `- This lets us verify your **$CJS token balance** (10 $CJS required to generate art).\n` +
        `- It ensures we can later offer you the option to mint your art as an **NFT**!\n\n` +
        `👉 Please click **Yes** if you're registered, or **No** to register your Stellar wallet.`,
      components: [row],
      ephemeral: true,
    });
  },

  async handleButton(interaction) {
    if (interaction.customId === 'yes_registered') {
      // Show modal to collect CJS User ID
      const modal = new ModalBuilder()
        .setCustomId('cjsUserIdModal')
        .setTitle('Enter your CJS User ID');

      const userIdInput = new TextInputBuilder()
        .setCustomId('cjsUserIdInput')
        .setLabel('Your CJS User ID (NOT Discord ID)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const firstActionRow = new ActionRowBuilder().addComponents(userIdInput);
      modal.addComponents(firstActionRow);

      await interaction.showModal(modal);
    }

    if (interaction.customId === 'no_not_registered') {
      // Simple message asking user to register their wallet
      await interaction.reply({
        content:
          `No worries! Please register your Stellar wallet by using the `/register` command or visit [https://yourdomain.com/register](https://yourdomain.com/register).`,
        ephemeral: true,
      });
    }
  },

  async handleModalSubmit(interaction) {
    if (interaction.customId === 'cjsUserIdModal') {
      const userId = interaction.fields.getTextInputValue('cjsUserIdInput');

      // Check user in DB
      const user = await getUser(userId);
      if (!user) {
        await interaction.reply({
          content: `❗ No wallet found for your user ID \`${userId}\`. Please register your Stellar wallet first.`,
          ephemeral: true,
        });
        return;
      }

      // Check balance
      const balance = await checkCJSBalance(user.public_key);
      if (balance < 10) {
        await interaction.reply({
          content:
            `💸 You need at least **10 $CJS** in your wallet.\n` +
            `Current balance: **${balance}**\n` +
            `Top up here: [https://yourdomain.com/buycjs](https://yourdomain.com/buycjs)`,
          ephemeral: true,
        });
        return;
      }

      // Payment setup
      const TREASURY_PUBLIC_KEY = process.env.TREASURY_PUBLIC_KEY;
      const STELLAR_ISSUER_ADDRESS = process.env.STELLAR_ISSUER_ADDRESS;

      if (!TREASURY_PUBLIC_KEY || !STELLAR_ISSUER_ADDRESS) {
        await interaction.reply({
          content: '❌ Server config error: Payment system not properly configured.',
          ephemeral: true,
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

      await interaction.reply({
        content:
          `✅ You're verified and funded!\n\n` +
          `🧾 Please send **${PAYMENT_AMOUNT} $CJS** to proceed by scanning the QR code or clicking the link below:\n` +
          `${paymentURI}\n\n` +
          `Monitoring for payment for up to 90 seconds...`,
        files: [{ attachment: qrCodeDataUrl, name: 'payment-qr.png' }],
        ephemeral: true,
      });

      // Wait for payment confirmation
      const confirmed = await startPaymentMonitor(user.public_key, PAYMENT_AMOUNT, memo, 90000);

      if (!confirmed.success) {
        await interaction.followUp({
          content: '❌ Payment not detected within 90 seconds. Please try again later.',
          ephemeral: true,
        });
        return;
      }

      await interaction.followUp({
        content:
          '🎨 Payment received! Please describe your art idea (e.g., *“A futuristic Black utopia on Mars”*).',
        ephemeral: true,
      });
    }
  },
};
