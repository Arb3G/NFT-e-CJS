const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const fs = require('fs-extra');

const BING_URL = 'https://www.bing.com/images/create';

/**
 * Launches a browser window so the user can manually log into Bing,
 * then extracts and saves the _U and KievRPSSecAuth cookies for future use.
 */
async function getAuthCookies() {
  const browser = await puppeteer.launch({ headless: false }); // Show the browser so user can log in
  const page = await browser.newPage();
  await page.goto('https://www.bing.com');

  console.log('🔑 Please log into Bing manually in the browser window...');

  // Give the user 60 seconds to log in
  await page.waitForTimeout(60000);

  // Get cookies after login
  const cookies = await page.cookies();
  await browser.close();

  // Extract the required cookies
  const cookieMap = {};
  cookies.forEach(cookie => {
    if (cookie.name === '_U' || cookie.name === 'KievRPSSecAuth') {
      cookieMap[cookie.name] = cookie.value;
    }
  });

  // Make sure we have at least the _U cookie (Kiev may be optional)
  if (!cookieMap._U) {
    throw new Error('❌ _U cookie not found. You must log into Bing manually.');
  }

  // Save cookies to a local JSON file for future use
  await fs.writeJSON('./bingCookies.json', cookieMap, { spaces: 2 });
  console.log('✅ Saved cookies to bingCookies.json');
  return cookieMap;
}

/**
 * Sends a prompt to Bing's image creator and fetches resulting image URLs.
 * @param {string} prompt - The image prompt
 * @param {object} cookies - Auth cookies for Bing
 */
async function generateImage(prompt, cookies) {
  // Format the cookies for the request header
  const cookieHeader = `_U=${cookies._U}; KievRPSSecAuth=${cookies.KievRPSSecAuth || ''};`;
  const headers = {
    'User-Agent': 'Mozilla/5.0',
    'Referer': BING_URL,
    'Cookie': cookieHeader,
  };

  // Send the initial request to trigger image generation
  const response = await fetch(`${BING_URL}?q=${encodeURIComponent(prompt)}&rt=3&FORM=GENCRE`, {
    method: 'GET',
    headers,
  });

  const text = await response.text();

  // Extract the session ID and IG token from the response HTML
  const idMatch = text.match(/;id=([^"]+)"/);
  const IGMatch = text.match(/IG:"([^"]+)"/);

  if (!idMatch || !IGMatch) {
    throw new Error('❌ Failed to get image session tokens (possibly rejected prompt or cookies expired).');
  }

  const id = idMatch[1];
  const IG = IGMatch[1];
  const query = `q=${encodeURIComponent(prompt)}&IG=${IG}&IID=images.as`;

  // Poll the async results endpoint for the images
  const asyncUrl = `https://www.bing.com/images/create/async/results/${id}?${query}`;
  const result = await fetch(asyncUrl, { headers });
  const html = await result.text();

  // Parse out the image URLs from the response HTML
  const imageUrls = [...html.matchAll(/src="([^"]+?\?pid=ImgGn)"/g)].map(m => m[1]);
  return imageUrls;
}

/**
 * Main runner: loads cookies, sends prompt, logs image URLs
 */
(async () => {
  const prompt = 'a futuristic African city at sunset in cinematic style';
  let cookies;

  // Load cookies if available, or ask the user to log in manually
  if (fs.existsSync('./bingCookies.json')) {
    cookies = await fs.readJSON('./bingCookies.json');
  } else {
    cookies = await getAuthCookies();
  }

  try {
    const urls = await generateImage(prompt, cookies);
    console.log(`🎨 Prompt: "${prompt}"`);
    urls.forEach((url, i) => console.log(`🖼️ Image ${i + 1}: ${url}`));
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();

