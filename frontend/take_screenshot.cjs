const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  // Log all errors
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  
  await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle2' });
  
  // Take screenshot of login page
  await page.screenshot({ path: '/home/tiago/Vite/Frota/frontend/login_screenshot.png' });
  console.log('Took login screenshot');
  
  // Clear local storage and unregister service workers just in case
  await page.evaluate(async () => {
    localStorage.clear();
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const r of registrations) {
      await r.unregister();
    }
  });

  await browser.close();
})();
