const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const root = path.resolve(__dirname, '..');
  const out = path.join(root, 'smoke-output');
  if (!fs.existsSync(out)) fs.mkdirSync(out);

  const serverPort = 8000;
  const pages = ['index.html', 'category-food.html', 'category-school-supplies.html'];

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 800 });

  const allLogs = [];
  page.on('console', msg => {
    try {
      const text = msg.text();
      allLogs.push(text);
      console.log('PAGE LOG:', text);
    } catch (e) {}
  });

  for (const p of pages) {
    const url = `http://localhost:${serverPort}/${p}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
      await page.waitForTimeout(500);
      // take screenshot of the page
      const shotPath = path.join(out, p.replace('.html', '') + '.png');
      await page.screenshot({ path: shotPath, fullPage: true });

      // try click the first tile if exists
      try {
        await page.evaluate(() => {
          const first = document.querySelector('#category-products div, #hot-deals-container div, .brand-tile');
          if (first) first.click();
        });
        await page.waitForTimeout(800);
        const shot2 = path.join(out, p.replace('.html', '') + '-after-click.png');
        await page.screenshot({ path: shot2, fullPage: true });
      } catch (e) {
        allLogs.push(`click-error:${p}:${String(e)}`);
      }

    } catch (err) {
      allLogs.push(`goto-error:${p}:${String(err)}`);
    }
  }

  await browser.close();

  // write logs
  fs.writeFileSync(path.join(out, 'console.log'), allLogs.join('\n'));
  console.log('Smoke test complete. Output in', out);
})();
