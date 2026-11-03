const { chromium } = require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch(); const page=await b.newPage();
 await page.route('https://**', r=>r.fulfill({body:'',contentType:'text/plain'}));
 await page.goto('file://'+path.resolve('../app/index.html')); await page.waitForTimeout(300);
 const cases=[
  [['Loops','Dreamy Night 140 Cmin.wav'],'X'],[['Loops','Dreamy Night.wav'],'X'],[['Melodies','Cold Keys F#m 150.wav'],'X'],
  [['Dark Bells 140 Am.wav'],'X'],[['Dreamy C#min 132.wav'],'X'],[['Kicks','Kick 01.wav'],'Trap Loops & One Shots'],
  [['Kick 01.wav'],'Trap Loops & One Shots'],[['Night Piano 120 Cm.wav'],'Midnight Loops'],[['Untitled 3.wav'],'Midnight Loops'],
  [['808s','808 Boom 150 F#.wav'],'X'],[['Drum Loops','Groove 140.wav'],'X'],[['Loops','Hat Loop 140.wav'],'X'],[['One Shots','Snare 12 C.wav'],'X']];
 const r=await page.evaluate(cs=>cs.map(([p,pk])=>{const c=window.__gb.classifyPath(p,pk); return p.join('/')+' ['+pk+'] → '+c.cat+' '+(c.bpm||'-')+' '+(c.key?window.__gb.parseKey(p[p.length-1],false)&&JSON.stringify(c.key):'-');}),cases);
 console.log(r.join('\n')); await b.close(); })();
