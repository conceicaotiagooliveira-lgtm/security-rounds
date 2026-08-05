const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle2' });
  
  // Try to login
  await page.type('input[type="email"]', 'admin@florestal.com');
  await page.type('input[type="password"]', 'admin123'); // Assuming default admin pass
  
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]).catch(e => console.log('NAV ERROR:', e.message));

  console.log('Current URL:', page.url());
  
  // Wait a bit to let React crash if it's going to
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
