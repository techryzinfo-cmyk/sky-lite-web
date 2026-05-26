const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'dashboard.png', fullPage: true });
  const html = await page.content();
  const fs = require('fs');
  fs.writeFileSync('dashboard.html', html);
  console.log('Snapshot taken');
  await browser.close();
})();
