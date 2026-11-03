const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
(async()=>{ const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']}); const page=await b.newPage({viewport:{width:1440,height:900}});
 const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await page.route('https://cdnjs.cloudflare.com/**', r => { const u=r.request().url(); r.fulfill({ body: fs.readFileSync(u.includes('jszip')?'../node_modules/jszip/dist/jszip.min.js':'../node_modules/lamejs/lame.min.js'), contentType:'application/javascript' }); });
 await page.route('https://fonts.googleapis.com/**', r=>r.fulfill({body:'',contentType:'text/css'}));
 await page.goto('file://'+path.resolve('../app/index.html')); await page.waitForTimeout(400);
 for (const lib of ['builtin','Library']) {
  if (lib==='Library') { await page.setInputFiles('#dirInput','Library'); await page.waitForTimeout(300); }
  for (const gen of ['trap','drill','trapsoul','boombap','pop']) {
   await page.selectOption('#genreSel', gen); await page.click('#genBtn'); await page.waitForTimeout(100);
   const r = await page.evaluate(()=>window.__gb.demos().map(d=>['o','p','r'].map(k=>(d.groove.ev[k]||[]).length).join('/')+(d.slots.rim?'R':'-')+(d.slots.perc?'P':'-')+(d.slots.ohat?'O':'-')));
   console.log(lib, gen, r.join(' '));
  }
 }
 console.log('rows', await page.locator('#ws .slot-lab').allTextContents());
 console.log('names', (await page.locator('#ws .slot-name').allTextContents()).map(s=>s.slice(0,60)));
 console.log('mixer', await page.locator('.strip .nm').allTextContents());
 await page.click('#playBtn'); await page.waitForTimeout(400);
 for (const lab of ['Open hat','Perc','Rim']) {
   const i = (await page.locator('#ws .slot-lab').allTextContents()).indexOf(lab);
   const btn = page.locator('#ws .slot-btns').nth(i).locator('button',{hasText:'随机节奏'});
   if (await btn.count()) { await btn.click(); await page.waitForTimeout(250); }
   console.log('reroll', lab, await page.evaluate(k=>JSON.stringify(window.__gb.current().groove.ev[k]).slice(0,120), {['Open hat']:'o',Perc:'p',Rim:'r'}[lab]));
 }
 console.log('grid rows', await page.locator('.steps .lab').allTextContents(), 'playing', await page.textContent('#playBtn'));
 const d = await page.evaluate(async()=>{ const d=window.__gb.current(); const b=await window.__gb.renderDemo(d); return b.duration; }); console.log('render ok', d.toFixed(2));
 await page.screenshot({path:'shot4.png'});
 console.log('errors', errs); await b.close(); })();
