const puppeteer = require('puppeteer');
const axios = require('axios');
//require('dotenv').config();

const tryCraiyon = async (prompt) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.craiyon.com/', { waitUntil: 'networkidle2' });

    await page.type('textarea', prompt);
    await page.click('button:has-text("Draw")');

    await page.waitForSelector('img[src^="data:image/jpeg;base64,"]', {
      timeout: 60000
    });

    const base64Image = await page.$eval('img[src^="data:image/jpeg;base64,"]', img => img.src);
    const buffer = Buffer.from(base64Image.split(',')[1], 'base64');

    await browser.close();
    return buffer;
  } catch (err) {
    console.warn('[Craiyon failed]', err.message);
    await browser.close();
    throw err;
  }
};

const tryHuggingFace = async (prompt) => {
  const HF_TOKEN = process.env.HF_TOKEN;
  const model = 'stabilityai/stable-diffusion-2';

  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/${model}`,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`
        },
        responseType: 'arraybuffer',
        timeout: 90000
      }
    );

    return Buffer.from(response.data, 'binary');
  } catch (err) {
    console.warn('[Hugging Face failed]', err.response?.data || err.message);
    throw err;
  }
};

const generateArt = async (prompt) => {
  try {
    return await tryCraiyon(prompt);
  } catch {
    console.log('Falling back to Hugging Face...');
    return await tryHuggingFace(prompt);
  }
};

module.exports = generateArt;
