import discord
from discord.ext import commands
import os

from discord.ext import commands
from discord import app_commands

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}")
    try:
        synced = await bot.tree.sync()
        print(f"Synced {len(synced)} commands.")
    except Exception as e:
        print(f"Sync error: {e}")

@bot.tree.command(name="buycjs", description="Buy a specific amount of CJS tokens")
async def buycjs(interaction: discord.Interaction, amount: float):
    user_id = interaction.user.id
    payment_url = f"https://yourapp.web.app/pay?discord_id={user_id}&amount={amount}"

    message = (
        f"👋 Hello, **{interaction.user.name}**! You're initiating a purchase of **{amount} CJS**.\n\n"
        f"Before proceeding, please note:\n"
        f"1️⃣ You will be redirected to a **Google Pay checkout page** to complete your payment securely.\n"
        f"2️⃣ You must **register your Stellar wallet public address** with `/registerwallet` *before* paying.\n"
        f"3️⃣ Once payment is confirmed, your **CJS tokens will be automatically sent** to your registered wallet.\n\n"
        f"🔗 Click below to proceed:\n{payment_url}\n\n"
        f"✅ This transaction complies with Discord’s guidance on financial bots:\n"
        f"• No deceptive practices or false promises\n"
        f"• No market manipulation or pump-and-dump schemes\n"
        f"• Clear, transparent delivery of tokens on payment confirmation\n\n"
        f"Let us know if you have any questions before continuing."
    )

    await interaction.response.send_message(message, ephemeral=True)

# Optional: Register wallet command
wallets = {}  # Use a real database in production

@bot.tree.command(name="registerwallet", description="Register your Stellar wallet for receiving CJS")
async def registerwallet(interaction: discord.Interaction, wallet: str):
    wallets[interaction.user.id] = wallet
    await interaction.response.send_message(
        "✅ Your wallet has been registered successfully.",
        ephemeral=True
    )

bot.run(os.getenv("DISCORD_TOKEN"))
