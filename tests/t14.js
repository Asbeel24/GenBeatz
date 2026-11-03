const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
(async()=>{ const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']}); const page=await b.newPage({viewport:{width:1440,height:900}});
 const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await page.route('https://cdnjs.cloudflare.com/**', r => { const u=r.request().url(); r.fulfill({ body: fs.readFileSync(u.includes('jszip')?'../node_modules/jszip/dist/jszip.min.js':'../node_modules/lamejs/lame.min.js'), contentType:'application/javascript' }); });
 await page.route('https://fonts.googleapis.com/**', r=>r.fulfill({body:'',contentType:'text/css'}));
 await page.goto('file://'+path.resolve('../app/index.html')); await page.waitForTimeout(400);
 await page.setInputFiles('#dirInput','Library'); await page.waitForTimeout(300); await page.click('#genBtn'); await page.waitForTimeout(100);
 console.log('mixer', await page.locator('.strip .nm').allTextContents());
 console.log('loop2 row', await page.locator('#ws .slot-lab').allTextContents());
 await page.click('#playBtn'); await page.waitForTimeout(300);
 // pick kick
 const labs = await page.locator('#ws .slot-lab').allTextContents();
 await page.locator('#ws .slot-btns').nth(labs.indexOf('Kick')).locator('button',{hasText:'选择音色'}).click(); await page.waitForTimeout(150);
 console.log('picker rows', await page.locator('.pick-row .pn').allTextContents());
 await page.locator('.pick-row').nth(1).click(); await page.waitForTimeout(200); console.log('still playing', await page.textContent('#playBtn'));
 const name = await page.locator('.pick-row.sel .pn').textContent();
 await page.click('.pick-foot button.primary'); await page.waitForTimeout(200);
 console.log('kick now', name, await page.evaluate(()=>window.__gb.current().slots.kick.name), 'overlay', await page.locator('#pickOv').count());
 // loop2 random add
 await page.locator('#ws .slot-btns button',{hasText:'+ 随机加一个'}).first().click(); await page.waitForTimeout(300);
 console.log('loop2', await page.evaluate(()=>{const d=window.__gb.current(); return d.slots.loop2&&d.slots.loop2.name+' / loop '+d.slots.loop.name;}), 'toast', await page.textContent('#toast'));
 // loop2 from computer
 const labs2 = await page.locator('#ws .slot-lab').allTextContents();
 await page.locator('#ws .slot-btns').nth(labs2.indexOf('Loop 2')).locator('button',{hasText:'选择音色'}).click();
 console.log('loop picker', (await page.locator('.pick-row').allTextContents()).slice(0,4));
 await page.setInputFiles('.pick-foot input[type=file]','ext_layer.wav'); await page.waitForTimeout(800);
 console.log('loop2 ext', await page.evaluate(()=>{const s=window.__gb.current().slots.loop2; return s.name+' '+s.bpm+(s.bpmGuess?'≈':'')+' '+s.pack;}));
 console.log('mixer2', await page.locator('.strip .nm').allTextContents());
 const ev = await page.evaluate(async()=>{const d=window.__gb.current(); const r=window.__gb.buildEvents(d); return r.ranges.map(x=>x[2]).join(',');}); console.log('ranges', ev);
 await page.click('#viewSeg button[data-v="arrange"]'); await page.waitForTimeout(300);
 console.log('arr labs', await page.locator('.arr-grid .lab').allTextContents());
 const st = await page.evaluate(async()=>{const d=window.__gb.current(); const s=await window.__gb.renderStems(d); return s.map(x=>x[0]).join(',');}); console.log('stems', st);
 // escape closes
 await page.locator('#ws .slot-btns button',{hasText:'选择音色'}).first().click(); await page.keyboard.press('Escape'); console.log('esc closed', await page.locator('#pickOv').count()===0);
 await page.screenshot({path:'shot8.png'});
 // remove loop2
 await page.click('#viewSeg button[data-v="pattern"]'); await page.locator('#ws .slot-btns button',{hasText:'移除'}).click(); await page.waitForTimeout(100);
 console.log('after remove', await page.evaluate(()=>window.__gb.current().slots.loop2), await page.locator('.strip .nm').allTextContents());
 console.log('errors', errs); await b.close(); })();
