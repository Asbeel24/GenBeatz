const { chromium } = require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch(); const errs=[];
 for (const [w,h,name] of [[1440,900,'d'],[1100,900,'m'],[390,844,'p']]) { const page=await b.newPage({viewport:{width:w,height:h}}); page.on('pageerror',e=>errs.push(e.message));
 await page.route('https://cdnjs.cloudflare.com/**', r=>r.fulfill({body:'',contentType:'text/plain'}));
 await page.goto('file://'+path.resolve('../app/index.html')); await page.waitForTimeout(800);
 await page.setInputFiles('#dirInput','Library'); await page.waitForTimeout(300); await page.click('#genBtn'); await page.mouse.move(700,600); await page.waitForTimeout(300);
 await page.screenshot({path:`a_${name}.png`, fullPage: name!=='d'});
 const sw = await page.evaluate(()=>document.documentElement.scrollWidth); console.log(name,'scrollWidth',sw);
 if (name==='d') { await page.click('#viewSeg button[data-v="arrange"]'); await page.waitForTimeout(200); await page.screenshot({path:'a_arr.png'}); console.log('title', await page.textContent('#wsTitle')); }
 await page.close(); }
 console.log('errors', errs); await b.close(); })();
