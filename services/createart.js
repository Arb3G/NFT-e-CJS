const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const fs = require('fs');

const tryCraiyon = async (prompt) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    console.log('Starting Craiyon...');
    await page.goto('https://www.craiyon.com/', { waitUntil: 'domcontentloaded' });
    console.log('Craiyon page loaded');

    await new Promise(resolve => setTimeout(resolve, 4000));

    await page.mouse.click(600, 300);
    await page.keyboard.type(prompt);

    console.log('Clicking Draw...');
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      const drawBtn = btns.find(btn => btn.textContent?.toLowerCase().includes('draw'));
      if (drawBtn) drawBtn.click();
    });

    console.log('Waiting for image...');
    await page.waitForSelector('img[src^="data:image/jpeg;base64,"]', { timeout: 90000 });

    const base64Image = await page.$eval(
      'img[src^="data:image/jpeg;base64,"]',
      (img) => img.src
    );

    const buffer = Buffer.from(base64Image.split(',')[1], 'base64');

    await browser.close();
    console.log('✅ Craiyon image retrieved');
    return buffer;
  } catch (err) {
    console.warn('[Craiyon failed]', err.message);
    await page.screenshot({ path: 'craiyon_debug.png' });
    console.log('📸 Saved debug screenshot as craiyon_debug.png');
    await browser.close();
    throw err;
  }
};

const tryHuggingFace = async (prompt) => {
  const HF_TOKEN = process.env.HF_TOKEN;
  const model = 'black-forest-labs/flux-dev';

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
        prompt,
        model_name: model,
        num_images: 1,
        guidance_scale: 7.5,
        num_inference_steps: 50,
        height: 1024,
        width: 1024,
        seed: null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${errorText}`);
    }

    const result = await response.json();

    const base64Image = result.images[0].image;
    const buffer = Buffer.from(base64Image, 'base64');

    fs.writeFileSync('testoutput.png', buffer);
    console.log('✅ Image saved as testoutput.png');

    return buffer;
  } catch (err) {
    console.warn('[Hugging Face failed]', err.message);
    throw err;
  }
};

const generateArt = async (prompt) => {
  try {
    return await tryCraiyon(prompt);
  } catch (err) {
    console.log('⚠️ Craiyon failed:', err.message);
    try {
      console.log('⚠️ Falling back to Hugging Face...');
      return await tryHuggingFace(prompt);
    } catch (err) {
      console.log('⚠️ Hugging Face failed:', err.message);
      throw new Error('Both Craiyon and Hugging Face failed');
    }
  }
};

module.exports = generateArt;
