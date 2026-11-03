const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
(async()=>{ const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']}); const page=await b.newPage({viewport:{width:1440,height:900}});
 const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await page.route('https://cdnjs.cloudflare.com/**', r => { const u=r.request().url(); r.fulfill({ body: fs.readFileSync(u.includes('jszip')?'../node_modules/jszip/dist/jszip.min.js':'../node_modules/lamejs/lame.min.js'), contentType:'application/javascript' }); });
 await page.route('https://fonts.googleapis.com/**', r=>r.fulfill({body:'',contentType:'text/css'}));
 await page.goto('file://'+path.resolve('../app/index.html')); await page.waitForTimeout(400);
 await page.setInputFiles('#dirInput','Library'); await page.waitForTimeout(300); await page.click('#genBtn'); await page.waitForTimeout(100);
 await page.click('#playBtn');
 for (let i=0;i<4;i++){ await page.waitForTimeout(700); console.log('ph col', await page.locator('.steps .c.ph').first().getAttribute('data-c').catch(()=>null), 'lit', await page.locator('.steps .c.ph.on, .steps .c.ph.roll').count(), 'page', await page.locator('.gridbar button.on').first().textContent()); }
 await page.screenshot({path:'shot6.png'});
 await page.evaluate(()=>{}); await page.waitForTimeout(4000);
 console.log('after 4s col', await page.locator('.steps .c.ph').first().getAttribute('data-c'), 'page', await page.locator('.gridbar button.on').first().textContent());
 await page.locator('.gridbar button',{hasText:'1–4 小节'}).click(); await page.waitForTimeout(3000);
 console.log('manual page stays', await page.locator('.gridbar button.on').allTextContents());
 await page.click('#playBtn'); await page.waitForTimeout(100); console.log('ph after stop', await page.locator('.steps .c.ph').count());
 console.log('errors', errs); await b.close(); })();
