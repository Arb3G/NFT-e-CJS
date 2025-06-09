import os
import discord
from discord.ext import commands
from dotenv import load_dotenv

load_dotenv()  # Loads variables from .env

TOKEN = os.getenv("DISCORD_TOKEN")
bot = commands.Bot(command_prefix="!")

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}")

@bot.command()
async def ping(ctx):
    await ctx.send("Pong!")

bot.run(TOKEN)
