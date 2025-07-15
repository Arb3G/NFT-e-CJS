const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Helper function to sleep for given ms
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Random typing delay (50-150ms per character)
function getRandomTypingDelay() {
  return 50 + Math.random() * 100;
}

// Random pause between actions (1-3 seconds)
function getRandomPause() {
  return 1000 + Math.random() * 2000;
}

// Random viewport size (typical desktop)
function getRandomViewport() {
  return {
    width: 1200 + Math.floor(Math.random() * 200),
    height: 700 + Math.floor(Math.random() * 200)
  };
}

// Load cookies from a JSON file exported by login.js
async function loadCookies(page, cookiePath) {
  try {
    const cookiesString = await fs.readFile(cookiePath);
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
    console.log('✅ Cookies loaded successfully.');
  } catch (err) {
    console.error('❌ Failed to load cookies:', err.message);
  }
}

async function runBingImageBot(prompt, cookieFilePath) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set random viewport
  await page.setViewport(getRandomViewport());

  // Load cookies before navigation (so session is restored)
  await loadCookies(page, cookieFilePath);

  // Navigate to Bing Image Creator
  await page.goto('https://www.bing.com/images/create', { waitUntil: 'networkidle2' });

  // Wait random pause before typing
  await sleep(getRandomPause());

  // Type prompt with human-like delay
  await page.type('textarea[name="q"]', prompt, { delay: getRandomTypingDelay() });

  // Pause before clicking generate
  await sleep(getRandomPause());

  // Click generate button
  await page.click('button[type="submit"]');

  // Wait for results container or timeout after 30 seconds
  try {
    await page.waitForSelector('.image-result-container', { timeout: 30000 });
    console.log('✅ Images generated successfully!');
  } catch {
    console.log('⚠️ Timeout waiting for image results.');
  }

  // Take screenshot of results page (optional)
  await page.screenshot({ path: 'bing-image-results.png', fullPage: true });

  await browser.close();
}

// Usage example:
// Make sure your login.js saved cookies in 'cookies.json'
const prompt = 'A serene mountain lake at sunrise, photorealistic';
const cookieFilePath = path.resolve(__dirname, 'cookies.json');

runBingImageBot(prompt, cookieFilePath).catch(console.error);
