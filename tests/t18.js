const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
(async()=>{ const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']}); const page=await b.newPage({viewport:{width:1440,height:900}});
 const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{if(m.type()==='error' && !/Failed to load resource/.test(m.text()))errs.push(m.text())});
 await page.route('https://**', r=>r.fulfill({body:'',contentType:'text/plain'}));
 await page.goto('file://'+path.resolve('../app/index.html')); await page.waitForTimeout(300);
 // builtin first
 await page.locator('#ws .slot-btns button',{hasText:'+ 随机加一个'}).last().click(); await page.waitForTimeout(400);
 console.log('builtin inst', await page.evaluate(()=>{const d=window.__gb.current(); return d.slots.inst&&d.slots.inst.name+' + '+d.instMidi.name+' oct '+d.instOct;}));
 await page.setInputFiles('#dirInput','Library'); await page.waitForTimeout(400);
 console.log('cats', await page.evaluate(()=>window.__gb.lib.samples.filter(s=>/mid$|One Shots/.test(s.path||'')).map(s=>s.name+':'+s.cat+(s.drumMidi?'(drum)':'')+(s.key?' '+JSON.stringify(s.key):''))));
 await page.selectOption('#genreSel','trap'); await page.click('#genBtn'); await page.waitForTimeout(100);
 console.log('inst row', await page.locator('#ws .slot-name').last().textContent());
 await page.click('#playBtn'); await page.waitForTimeout(200);
 await page.locator('#ws .slot-btns button',{hasText:'+ 随机加一个'}).last().click(); await page.waitForTimeout(500);
 const info = await page.evaluate(()=>{const g=window.__gb,d=g.current(); const loopKey=d.slots.loop&&d.slots.loop.key; return {midi:d.instMidi.name, shot:d.slots.inst.name, oct:d.instOct, loopKey};}); console.log('inst', JSON.stringify(info));
 console.log('row', await page.locator('#ws .loopname').last().textContent(), 'mixer', (await page.locator('.strip .nm').allTextContents()).join(','));
 const ev = await page.evaluate(async()=>{const g=window.__gb,d=g.current(); const st=await g.renderStems(d); const x=st.find(s=>s[0]==='inst'); if(!x) return 'no inst stem'; const c=x[1].getChannelData(0); let pk=0; for(let i=0;i<c.length;i+=3) pk=Math.max(pk,Math.abs(c[i])); return 'inst stem peak '+pk.toFixed(2)+' stems '+st.map(s=>s[0]).join(',');}); console.log(ev);
 // settings dialog: transpose +2
 await page.locator('#ws .loopname').last().click(); await page.waitForTimeout(100);
 console.log('dialog', (await page.locator('.picker').textContent()).slice(0,200));
 await page.fill('.picker input[type=number]','2'); await page.click('.picker .pick-foot button.primary'); await page.waitForTimeout(300);
 console.log('row after', await page.locator('#ws .loopname').last().textContent(), 'playing', await page.textContent('#playBtn'));
 // pick midi via picker
 await page.locator('#ws .loopname').last().click(); await page.locator('.picker button',{hasText:'选择 MIDI'}).click(); await page.waitForTimeout(100);
 console.log('midi picker', await page.locator('.pick-row').allTextContents());
 await page.locator('.pick-row').first().click(); await page.waitForTimeout(100); await page.click('.pick-foot button.primary'); await page.waitForTimeout(100);
 console.log('back in settings', await page.locator('.picker strong').first().textContent());
 await page.click('.picker .pick-foot button.primary'); await page.waitForTimeout(200);
 await page.click('#viewSeg button[data-v="arrange"]'); await page.waitForTimeout(200); console.log('arr', await page.locator('.arr-grid .lab').allTextContents());
 console.log(await page.evaluate(()=>window.__gb.notes(window.__gb.current()).split('\n').filter(l=>/MIDI|Instrument/.test(l)).join(' | ')));
 console.log('errors', errs); await b.close(); })();
