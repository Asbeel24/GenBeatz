const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
(async()=>{ const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']}); 
 for (const vw of [1280, 900]) { const page=await b.newPage({viewport:{width:vw,height:900}});
 await page.route('https://**', r=>r.fulfill({body:'',contentType:'text/plain'}));
 await page.goto('file://'+path.resolve('../app/index.html')); await page.waitForTimeout(300);
 await page.setInputFiles('#dirInput','Library'); await page.waitForTimeout(300); await page.click('#genBtn');
 await page.click('#viewSeg button[data-v="arrange"]'); await page.waitForTimeout(200);
 for (const form of ['std','short','bridge']) {
  await page.selectOption('.gridbar select >> nth=0', form); await page.waitForTimeout(200);
  const n = await page.locator('.arr-grid .sec').count(); const out=[];
  for (let i=0;i<n;i++) { await page.locator('.arr-grid .sec').nth(i).click(); await page.waitForTimeout(250);
    await page.evaluate(()=>{const w=document.querySelector('.arr-wrap'); w.scrollLeft=w.scrollWidth;}); const r = await page.evaluate(()=>{ const ph=document.querySelector('.arr-ph').getBoundingClientRect(); const secs=[...document.querySelectorAll('.arr-grid .sec')].map(e=>e.getBoundingClientRect().left); return {ph:ph.left, secs}; });
    out.push((r.ph - r.secs[i]).toFixed(1)); }
  console.log(vw, form, 'ph - sectionLeft (px) after ~0.2s:', out.join(' '));
 }
 await page.close(); }
 await b.close(); })();
