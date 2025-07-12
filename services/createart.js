const puppeteer = require('puppeteer');
const fetch = require('node-fetch'); // Make sure this is installed: npm i node-fetch
const fs = require('fs');
//const open = require('open');

//require('dotenv').config();

const tryCraiyon = async (prompt) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  try {
    console.log('Starting Craiyon...');
    await page.goto('https://www.craiyon.com/', { waitUntil: 'networkidle2' });
    console.log('Craiyon page loaded');

    // Wait for the input field to render
    await page.waitForSelector('input[placeholder="Enter your prompt"]', { timeout: 15000 });

    console.log('Typing prompt:', prompt);
    await page.type('input[placeholder="Enter your prompt"]', prompt);

    console.log('Clicking Draw...');
    await page.click('button:has-text("Draw")');

    console.log('Waiting for image...');
    await page.waitForSelector('img[src^="data:image/jpeg;base64,"]', { timeout: 60000 });

    const base64Image = await page.$eval(
      'img[src^="data:image/jpeg;base64,"]',
      (img) => img.src
    );
    const buffer = Buffer.from(base64Image.split(',')[1], 'base64');

    await browser.close();
    console.log('✅ Craiyon image generated successfully');
    return buffer;
  } catch (err) {
    console.warn('[Craiyon failed]', err.message);
    await browser.close();
    throw err;
  }
};


const tryHuggingFace = async (prompt) => {
  const HF_TOKEN = process.env.HF_TOKEN;
  const model = 'black-forest-labs/flux-dev'; // Using black forest flux

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

    // Check if response is successful and contains the image data
    if (response.ok) {
      const result = await response.json();
      
      // Extract the base64 image string
      const base64Image = result.images[0].image;
      const buffer = Buffer.from(base64Image, 'base64');

      // Save image to disk
      fs.writeFileSync('testoutput.png', buffer);
      console.log('✅ Image saved as testoutput.png');

      return buffer; // Return the buffer if needed
    }

    // If it's not an image, log error
    const errorText = await response.text();
    const errorJson = JSON.parse(errorText);
    console.error('🚨 API Error:', errorJson);
    throw new Error(`Hugging Face API Error: ${errorJson.message || 'Unknown error'}`);
    
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
