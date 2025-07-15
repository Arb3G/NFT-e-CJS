// login.js
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  // Launch Chrome with UI (not headless)
  const browser = await puppeteer.launch({
    headless: false,             // Let the user manually log in
    defaultViewport: null,       // Use full screen
    args: ['--start-maximized'], // Launch in maximized window
  });

  const page = await browser.newPage();

  // Go to Bing login page
  await page.goto('https://www.bing.com/');

  console.log('🔑 Please log into Bing manually in the opened browser window...');

  // Wait up to 2 minutes for manual login (you can adjust)
  await page.waitForTimeout(120000); // 2 minutes

  // Try to detect if the user is logged in by checking for profile icon
  const isLoggedIn = await page.evaluate(() => {
    return !!document.querySelector('a[id^="id_a"]'); // Typical MS profile anchor
  });

  if (!isLoggedIn) {
    console.warn('⚠️ Could not confirm login. Make sure you completed sign-in.');
  }

  // Extract all cookies
  const cookies = await page.cookies();

  // Save cookies to a file for later use in image generation
  fs.writeFileSync('bingCookies.json', JSON.stringify(cookies, null, 2));
  console.log('✅ Bing login cookies saved to bingCookies.json');

  await browser.close();
})();
