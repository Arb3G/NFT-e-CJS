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

// Load manual cookies (just _U and KievRPSSecAuth) from a JSON file
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

// Main bot to generate images on Bing using a prompt
async function runBingImageBot(prompt, cookieFilePath) {
  const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.setViewport(getRandomViewport());

  // Inject session cookies
  await loadCookies(page, cookieFilePath);

  // Go to Bing Image Creator
  await page.goto('https://www.bing.com/images/create', { waitUntil: 'networkidle2' });

  // Wait a moment before typing
  await sleep(getRandomPause());

  // Type prompt into the input field
  await page.type('textarea[name="q"]', prompt, { delay: getRandomTypingDelay() });

  await sleep(getRandomPause());

  // Click the generate button
  await page.click('button[type="submit"]');

  // Wait for images to load or timeout
  try {
    await page.waitForSelector('.image-result-container', { timeout: 30000 });
    console.log('✅ Images generated successfully!');
  } catch {
    console.warn('⚠️ Timeout waiting for image results.');
  }

  // Screenshot result page
  await page.screenshot({ path: 'bing-image-results.png', fullPage: true });

  await browser.close();
}

// Example usage
const prompt = 'A cyberpunk city skyline at night, highly detailed, futuristic';
const cookieFilePath = path.resolve(__dirname, 'cookies.json'); // Manual cookies file

runBingImageBot(prompt, cookieFilePath).catch(console.error);
