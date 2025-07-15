const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Random typing delay per character
function getRandomTypingDelay() {
  return 50 + Math.random() * 100;
}

// Random pause between actions
function getRandomPause() {
  return 1000 + Math.random() * 2000;
}

// Random viewport (simulate human screen size)
function getRandomViewport() {
  return {
    width: 1200 + Math.floor(Math.random() * 200),
    height: 700 + Math.floor(Math.random() * 200)
  };
}

// Load manual cookies (_U and KievRPSSecAuth only)
async function loadCookies(page, cookiePath) {
  try {
    const cookieData = await fs.readFile(cookiePath, 'utf8');
    const { _U, KievRPSSecAuth } = JSON.parse(cookieData);

    const cookies = [
      {
        name: '_U',
        value: _U,
        domain: '.bing.com',
        path: '/',
        httpOnly: true,
        secure: true,
      },
      {
        name: 'KievRPSSecAuth',
        value: KievRPSSecAuth,
        domain: '.bing.com',
        path: '/',
        httpOnly: true,
        secure: true,
      }
    ];

    await page.setCookie(...cookies);
    console.log('✅ Manual cookies injected successfully.');
  } catch (err) {
    console.error('❌ Failed to load or apply cookies:', err.message);
  }
}

// Main Bing image bot function
async function runBingImageBot(prompt, cookieFilePath) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport(getRandomViewport());

  // Load cookies before navigating to Bing
  await loadCookies(page, cookieFilePath);

  // Navigate to Bing Image Creator
  await page.goto('https://www.bing.com/images/create', { waitUntil: 'networkidle2' });

  // Simulate human pause before interacting
  await sleep(getRandomPause());

  // Type prompt like a human
  await page.type('textarea[name="q"]', prompt, { delay: getRandomTypingDelay() });

  await sleep(getRandomPause());

  // Try to find and click the "Create" button
  try {
    // Wait for and click the "Create" button
    await page.waitForSelector('#create_btn_c', { timeout: 10000 });
    await page.click('#create_btn_c');

    // Add small wait to let post-click scripts engage
    await sleep(5000);

    console.log('🖱️ Clicked the "Create" button.');
  } catch (clickErr) {
    console.error('❌ Could not find or click the "Create" button:', clickErr.message);

    // Dump page HTML for debugging
    const html = await page.content();
    await fs.writeFile('bing-debug.html', html);
    console.log('📄 Saved page HTML to bing-debug.html for inspection.');

    await browser.close();
    return;
  }

  // Wait for either image results or a known error screen
  try {
    await Promise.race([
      // Image result thumbnail selector
      page.waitForSelector('#gil_img_results .img_cont img', { timeout: 60000 }),
      // Catch common Bing error panels if image generation fails
      page.waitForSelector('#gilen_son, #gilen_stsqn, #gilen_crns, #gilen_cnectr', { timeout: 60000 }),
    ]);
  } catch (err) {
    console.warn('⚠️ Timeout waiting for any post-create response.');
  }

  // Determine what happened: success, failure banner, or unknown state
  const resultExists = await page.$('#gil_img_results .img_cont img');
  const errorBanner = await page.evaluate(() => {
    const banners = [
      '#gilen_son',
      '#gilen_stsqn',
      '#gilen_crns',
      '#gilen_cnectr'
    ];
    for (let sel of banners) {
      const el = document.querySelector(sel);
      if (el && el.innerText) return el.innerText;
    }
    return null;
  });

  // ✅ Success
  if (resultExists) {
    console.log('✅ Images generated successfully!');
    await page.screenshot({ path: 'bing-image-results.png', fullPage: true });

  // ❌ Known Bing error banners (rate limit, region restriction, etc.)
  } else if (errorBanner) {
    console.warn('❌ Bing returned an error banner:', errorBanner);

  // ⚠️ Unknown state — neither image results nor error message
  } else {
    console.warn('⚠️ No image results or error banners found — unknown state.');

    // Save page HTML for inspection
    const html = await page.content();
    await fs.writeFile('bing-debug.html', html);

    // Save full page screenshot
    await page.screenshot({ path: 'bing-timeout.png', fullPage: true });

    // Log partial page text to console
    const text = await page.evaluate(() => document.body.innerText);
    console.log('🔎 Partial visible page text:\n', text.slice(0, 1000));
  }

  await browser.close();
}

// Example usage
const prompt = 'A cyberpunk city skyline at night, highly detailed, futuristic';
const cookieFilePath = path.resolve(__dirname, 'cookies.json'); // JSON with _U and KievRPSSecAuth

runBingImageBot(prompt, cookieFilePath).catch(console.error);
