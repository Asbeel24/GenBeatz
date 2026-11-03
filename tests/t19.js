const { chromium } = require('playwright'); const path=require('path'), fs=require('fs');
(async()=>{ const b=await chromium.launch(); 
 for (const ui of ['a','b','c']) { const page=await b.newPage({viewport:{width:1440,height:900}, deviceScaleFactor:1});
 await page.route('https://cdnjs.cloudflare.com/**', r=>r.fulfill({body:'',contentType:'text/plain'}));
 await page.goto('file://'+path.resolve('../app/index.html')); await page.waitForTimeout(800);
 await page.click(`.ui-switch button[data-ui="${ui}"]`);
 await page.setInputFiles('#dirInput','Library'); await page.waitForTimeout(300); await page.click('#genBtn'); await page.waitForTimeout(200);
 await page.screenshot({path:`ui_${ui}.png`}); await page.close(); }
 await b.close(); })();
