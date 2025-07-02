//genart
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
    .setDescription('Generate AI art using your $CJS tokens')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('Your CJS User ID (NOT Discord ID)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.options.getString('userid');

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
        await i.deferReply({ ephemeral: true });

        const user = await getUser(userId);
        if (!user) {
          await i.editReply({
            content: `❗ No wallet found for ID \`${userId}\`. Please send your **Stellar public key** to register.`,
          });
          collector.stop();
          return;
        }

        const balance = await checkCJSBalance(user.public_key);
        if (balance < 10) {
          await i.editReply({
            content:
              `💸 You need at least **10 $CJS** in your wallet.\n` +
              `Current balance: **${balance}**\n` +
              `Top up here: [https://yourdomain.com/buycjs](#)`,
          });
          collector.stop();
          return;
        }

        // Generate payment URI and QR code
        const TREASURY_PUBLIC_KEY = process.env.TREASURY_PUBLIC_KEY || 'G...YOUR_TREASURY_ACCOUNT_PUBLIC_KEY';
        const CJS_ISSUER_PUBLIC_KEY = process.env.CJS_ISSUER_PUBLIC_KEY || 'G...YOUR_CJS_ISSUER_PUBLIC_KEY';
        const memo = `genart-${userId}`;
        const paymentURI = `web+stellar:pay?destination=${TREASURY_PUBLIC_KEY}` +
          `&amount=${PAYMENT_AMOUNT}` +
          `&asset_code=CJS` +
          `&asset_issuer=${CJS_ISSUER_PUBLIC_KEY}` +
          `&memo=${encodeURIComponent(memo)}`;

        const qrCodeDataUrl = await QRCode.toDataURL(paymentURI);

        await i.editReply({
          content:
            `✅ You're verified and funded!\n\n` +
            `🧾 Please send **${PAYMENT_AMOUNT} $CJS** to proceed by scanning the QR code or clicking the link below:\n` +
            `${paymentURI}\n\n` +
            `We'll wait up to 90 seconds for payment confirmation...`,
          files: [{ attachment: qrCodeDataUrl, name: 'payment-qr.png' }],
        });

        // Check config now, after payment info sent
        if (!TREASURY_PUBLIC_KEY || !CJS_ISSUER_PUBLIC_KEY) {
          await i.followUp({
            content:
              '❌ Server config error: Payment system is not properly configured. Please contact the admin.',
            ephemeral: true,
          });
          collector.stop();
          return;
        }

        // Wait for payment confirmation
        const confirmed = await startPaymentMonitor(user.public_key, PAYMENT_AMOUNT, memo, 90000);

        if (!confirmed.success) {
          await i.followUp({
            content: `❌ Payment not detected within 90 seconds. Please rerun the command once complete.`,
            ephemeral: true,
          });
          collector.stop();
          return;
        }

        await i.followUp({
          content: `🎨 Payment received! Please describe your art idea (e.g., *“A futuristic Black utopia on Mars”*).`,
          ephemeral: true,
        });

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
