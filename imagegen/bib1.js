const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');

puppeteer.use(StealthPlugin());

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
    height: 700 + Math.floor(Math.random() * 200),
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
      },
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
    headless: true, // Stick to true for Codespaces/Replit
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport(getRandomViewport());

  await loadCookies(page, cookieFilePath);

  await page.goto('https://www.bing.com/images/create', { waitUntil: 'domcontentloaded' });

  await sleep(getRandomPause());

  try {
    await page.type('textarea[name="q"]', prompt, { delay: getRandomTypingDelay() });
    await sleep(getRandomPause());

    await page.waitForSelector('#create_btn_c', { timeout: 10000 });
    await page.click('#create_btn_c');
    await sleep(5000);
    console.log('🖱️ Clicked the "Create" button.');
  } catch (clickErr) {
    console.error('❌ Could not find or click the "Create" button:', clickErr.message);
    const html = await page.content();
    await fs.writeFile('bing-debug.html', html);
    console.log('📄 Saved page HTML to bing-debug.html for inspection.');
    await browser.close();
    return;
  }

  // Wait for image results
  try {
    await page.waitForSelector('#gil_img_results .img_cont img', { timeout: 60000 });
    console.log('✅ Images generated successfully!');
  } catch {
    // Check for common Bing errors
    const errorText = await page.evaluate(() => {
      const err = document.querySelector('.gilen_t1');
      return err ? err.textContent : null;
    });

    if (errorText) {
      console.warn('❌ Bing returned an error banner:', errorText);
    } else {
      console.warn('⚠️ Timeout waiting for image results.');
    }
  }

  await page.screenshot({ path: 'bing-image-results.png', fullPage: true });
  await browser.close();
}

// Example usage
const prompt = 'A cyberpunk city skyline at night, highly detailed, futuristic';
const cookieFilePath = path.resolve(__dirname, 'cookies.json');

runBingImageBot(prompt, cookieFilePath).catch(console.error);
