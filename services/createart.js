const puppeteer = require('puppeteer');
const fetch = require('node-fetch'); // Make sure this is installed: npm i node-fetch
//require('dotenv').config();

const tryCraiyon = async (prompt) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.craiyon.com/', { waitUntil: 'networkidle2' });

    await page.type('textarea', prompt);
    await page.click('button:has-text("Draw")');

    await page.waitForSelector('img[src^="data:image/jpeg;base64,"]', {
      timeout: 60000,
    });

    const base64Image = await page.$eval(
      'img[src^="data:image/jpeg;base64,"]',
      (img) => img.src
    );
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
  const url = 'https://router.huggingface.co/hyperbolic/v1/images/generations';

  if (!HF_TOKEN) {
    console.error('❌ Missing Hugging Face token. Set HF_TOKEN in .env or CLI.');
    throw new Error('HF_TOKEN not set');
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        model_name: model,
        num_images: 1,
        guidance_scale: 7.5,
        num_inference_steps: 50,
        height: 512,
        width: 512,
        seed: null
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  } catch (err) {
    console.warn('[Hugging Face failed]', err.message);
    throw err;
  }
};

const generateArt = async (prompt) => {
  try {
    return await tryCraiyon(prompt);
  } catch {
    console.log('⚠️ Falling back to Hugging Face...');
    return await tryHuggingFace(prompt);
  }
};

module.exports = generateArt;
