const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const fs = require('fs-extra');

const BING_URL = 'https://www.bing.com/images/create';

async function getAuthCookies() {
  const browser = await puppeteer.launch({ headless: false }); // Visible browser to log in
  const page = await browser.newPage();
  await page.goto('https://www.bing.com');

  console.log('🔑 Please log into Bing manually...');
  await page.waitForTimeout(60000); // wait 60s for manual login

  const cookies = await page.cookies();
  await browser.close();

  const cookieMap = {};
  cookies.forEach(cookie => {
    if (cookie.name === '_U' || cookie.name === 'KievRPSSecAuth') {
      cookieMap[cookie.name] = cookie.value;
    }
  });

  if (!cookieMap._U) {
    throw new Error('❌ _U cookie not found. You must log into Bing manually.');
  }

  await fs.writeJSON('./bingCookies.json', cookieMap, { spaces: 2 });
  console.log('✅ Saved cookies to bingCookies.json');
  return cookieMap;
}

async function generateImage(prompt, cookies) {
  const cookieHeader = `_U=${cookies._U}; KievRPSSecAuth=${cookies.KievRPSSecAuth || ''};`;
  const headers = {
    'User-Agent': 'Mozilla/5.0',
    'Referer': BING_URL,
    'Cookie': cookieHeader,
  };

  const response = await fetch(`${BING_URL}?q=${encodeURIComponent(prompt)}&rt=3&FORM=GENCRE`, {
    method: 'GET',
    headers,
  });

  const text = await response.text();

  const idMatch = text.match(/;id=([^"]+)"/);
  const IGMatch = text.match(/IG:"([^"]+)"/);

  if (!idMatch || !IGMatch) {
    throw new Error('❌ Failed to get image session tokens (possibly rejected prompt or cookies expired).');
  }

  const id = idMatch[1];
  const IG = IGMatch[1];
  const query = `q=${encodeURIComponent(prompt)}&IG=${IG}&IID=images.as`;

  // Now fetch the image results
  const asyncUrl = `https://www.bing.com/images/create/async/results/${id}?${query}`;
  const result = await fetch(asyncUrl, { headers });
  const html = await result.text();

  const imageUrls = [...html.matchAll(/src="([^"]+?\?pid=ImgGn)"/g)].map(m => m[1]);
  return imageUrls;
}

(async () => {
  const prompt = 'a futuristic African city at sunset in cinematic style';
  let cookies;

  if (fs.existsSync('./bingCookies.json')) {
    cookies = await fs.readJSON('./bingCookies.json');
  } else {
    cookies = await getAuthCookies(); // manual login flow
  }

  try {
    const urls = await generateImage(prompt, cookies);
    console.log(`🎨 Prompt: "${prompt}"`);
    urls.forEach((url, i) => console.log(`🖼️ Image ${i + 1}: ${url}`));
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
