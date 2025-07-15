// login.js
const puppeteer = require('puppeteer');
const fs = require('fs');

// This script opens a browser for the user to manually log in to Bing.
// After login, it collects the session cookies and saves them to a file.
(async () => {
  const browser = await puppeteer.launch({
    headless: false, // Set to false so the user can interact with the browser
    defaultViewport: null, // Use full screen for better UX
  });

  const page = await browser.newPage();
  await page.goto('https://www.bing.com/'); // Navigate to Bing

  console.log('🔑 Please log into Bing manually in the opened browser window...');

  // Wait for the user to finish logging in
  await page.waitForTimeout(60000); // Wait 60 seconds for login (adjustable)

  const cookies = await page.cookies(); // Extract all session cookies

  // Save cookies to a local file for later use in headless generation
  fs.writeFileSync('bingCookies.json', JSON.stringify(cookies, null, 2));
  console.log('✅ Bing login cookies saved to bingCookies.json');

  await browser.close(); // Close the browser
})();
