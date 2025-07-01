const fetch = require('node-fetch');

const CLIENT_ID = '1389044616896184471';
const GUILD_ID = '504452991139577869';
const TOKEN = 'YOUR_BOT_TOKEN';

(async () => {
  const response = await fetch(
    `https://discord.com/api/v10/applications/${CLIENT_ID}/guilds/${GUILD_ID}/commands`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bot ${TOKEN}`,
      },
    }
  );
  const data = await response.json();
  console.log(data);
})();
