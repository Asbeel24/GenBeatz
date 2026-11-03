const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
(async()=>{ const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']}); const page=await b.newPage({viewport:{width:1440,height:900}});
 const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await page.route('https://**', r=>r.fulfill({body:'',contentType:'text/plain'}));
 await page.goto('file://'+path.resolve('../app/index.html')); await page.waitForTimeout(300);
 await page.setInputFiles('#dirInput','Library'); await page.waitForTimeout(300); await page.click('#genBtn');
 // force the 136 bpm pad as loop
 await page.evaluate(()=>{const g=window.__gb; const d=g.current(); d.slots.loop=g.lib.samples.find(s=>/136bpm/.test(s.name)); g.setBpm(140,false);}); await page.click('#viewSeg button[data-v="pattern"]');
 console.log('tag', await page.locator('.loopname .lm-tag').first().textContent());
 await page.click('#playBtn'); await page.waitForTimeout(300);
 await page.locator('.loopname').first().click(); await page.waitForTimeout(100);
 console.log('dialog', (await page.locator('.picker').textContent()).slice(0,220));
 await page.locator('.lm-opt').nth(+process.argv[2]).click(); await page.click('.picker .pick-foot button.primary'); await page.waitForTimeout(400);
 console.log('tag2', await page.locator('.loopname .lm-tag').first().textContent(), 'playing', await page.textContent('#playBtn'));
 const r = await page.evaluate(async()=>{const g=window.__gb, d=g.current(); const st=await g.renderStems(d); const L=st.find(x=>x[0]==='loop')[1].getChannelData(0);
   // estimate pitch via zero crossings over 1s
   let zc=0; for(let i=44100;i<88200;i++) if((L[i-1]<0)!==(L[i]<0)) zc++; return zc/2; });
 console.log('loop freq (varispeed, src 261.6 Hz @136→140)', r.toFixed(1), 'expected', (261.6*140/136).toFixed(1));
 console.log('errors', errs); await b.close(); })();
