const { chromium } = require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch(); const page=await b.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
 await page.route('https://**', r=>r.fulfill({body:'',contentType:'text/plain'}));
 await page.goto('file://'+path.resolve('../app/index.html')); await page.waitForTimeout(300);
 await page.setInputFiles('#dirInput','L2/Lib'); await page.waitForTimeout(1500);
 console.log(await page.evaluate(()=>window.__gb.lib.samples.filter(s=>!s.builtin).map(s=>s.name+' → '+s.cat+' '+s.bpm+(s.bpmGuess?'≈':''))));
 console.log(await page.locator('.toast, #toast').allTextContents().catch(()=>[]), errs); await b.close(); })();
