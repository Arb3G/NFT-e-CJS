import discord
import os

intents = discord.Intents.default()
intents.message_content = True  # Make sure this is enabled on the bot page too

client = discord.Client(intents=intents)

@client.event
async def on_ready():
    print(f'We have logged in as {client.user}')

@client.event
async def on_message(message):
    if message.author == client.user:
        return

    if message.content.startswith('!hello'):
        await message.channel.send('Hello! 👋')

client.run(os.getenv("DISCORD_TOKEN"))
