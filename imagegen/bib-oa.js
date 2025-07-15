const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');

puppeteer.use(StealthPlugin());

// Sleep helper
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// Random typing/pause delays
function getRandomTypingDelay() { return 50 + Math.random() * 100; }
function getRandomPause() { return 1000 + Math.random() * 2000; }

// Simulate a typical desktop viewport
function getRandomViewport() {
  return { width: 1200 + Math.floor(Math.random() * 200), height: 700 + Math.floor(Math.random() * 200) };
}

// Load cookies (adjust structure as needed)
async function loadCookies(page, cookiePath) {
  try {
    const cookieData = await fs.readFile(cookiePath, 'utf8');
    const cookies = JSON.parse(cookieData);
    await page.setCookie(...cookies);
    console.log('✅ Cookies injected.');
  } catch (err) {
    console.error('❌ Cookie load failed:', err.message);
  }
}

async function runOpenArtBot(prompt, cookieFilePath) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport(getRandomViewport());

  // Inject existing session cookies
  await loadCookies(page, cookieFilePath);

  // Navigate to OpenArt creation panel
  await page.goto('https://openart.ai/create', { waitUntil: 'networkidle2' });

  // Choose the prompt input field
  await sleep(getRandomPause());
  await page.type('textarea[placeholder="Enter your prompt"]', prompt, { delay: getRandomTypingDelay() });

  await sleep(getRandomPause());

  // Click the "Create" or "Generate" button — update selector if necessary
  try {
    await page.waitForSelector('button:has-text("Create Image"), button:has-text("Generate")', { timeout: 10000 });
    await page.click('button:has-text("Create Image"), button:has-text("Generate")');
    console.log('🖱️ Prompt submitted.');
  } catch (err) {
    console.error('❌ Generate button not found:', err.message);
    await fs.writeFile('openart-debug.html', await page.content());
    await browser.close();
    return;
  }

  // Wait for your image to appear (adjust selector to match Live DOM)
  try {
    await page.waitForSelector('.result-image-selector', { timeout: 60000 });
    console.log('✅ Image generated!');
  } catch {
    console.warn('⚠️ Timeout waiting for image.');
  }

  // Save a snapshot of the result
  await page.screenshot({ path: 'openart-results.png', fullPage: true });
  await browser.close();
}

// Customize your prompt and cookie JSON output
const myPrompt = 'A surreal landscape with floating islands and watercolor style';
const myCookies = path.resolve(__dirname, 'openart-cookies.json');

runOpenArtBot(myPrompt, myCookies).catch(console.error);
