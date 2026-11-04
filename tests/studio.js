const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const JSZip = require('jszip');
(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // The app is fully offline now: any outside request is a bug.
    const outside = [];
    await page.route(/^https?:/, route => { outside.push(route.request().url()); route.abort(); });
    await page.addInitScript(() => { delete window.showDirectoryPicker; }); // headless has no folder dialog: use downloads
    await page.goto('file://' + path.resolve(__dirname, '../app/index.html'));
    await page.locator('#tabs button').first().waitFor();
    assert.equal(await page.locator('#tabs button').count(), 6);
    await page.locator('#countInput').fill('2');
    await page.locator('#genBtn').click();
    assert.equal(await page.locator('#tabs button').count(), 2);
    await page.locator('#playBtn').click();
    await page.waitForFunction(() => document.querySelector('#playBtn').getAttribute('aria-label') === '停止');
    await page.waitForTimeout(300);
    await page.locator('#playBtn').click();
    await page.locator('#viewSeg button[data-v=arrange]').click();
    assert.ok(await page.locator('.arr-grid .sec').count() > 0);
    await page.locator('#lenSeg button[data-v=loop]').click();
    const cell = page.locator('.steps .c').first();
    const before = await cell.getAttribute('class');
    await cell.click();
    assert.notEqual(await page.locator('.steps .c').first().getAttribute('class'), before);
    await page.getByRole('button', { name: '撤销', exact: true }).click();
    assert.equal(await page.locator('.steps .c').first().getAttribute('class'), before);
    await page.locator('#mixToggle').click();
    assert.ok(await page.locator('#mixerPanel').isVisible());
    await page.locator('#mixReset').click();
    await page.locator('#mixClose').click();
    await page.locator('#mixerPanel').waitFor({ state: 'hidden', timeout: 2000 }); // closes after its animation
    await page.locator('#libraryToggle').click();
    await page.locator('#libraryPanel').waitFor({ state: 'hidden', timeout: 2000 }); // closes after its animation
    await page.locator('#libraryToggle').click();
    await page.locator('#motionToggle').click();
    assert.equal(await page.locator('#motionToggle').getAttribute('aria-pressed'), 'false');
    await page.locator('#artToggle').click();
    await page.locator('#artStage').waitFor({ state: 'hidden', timeout: 2000 }); // closes after its animation
    await page.locator('#artToggle').click();
    // Exercise the real downloads: WAV and MP3 arrive as plain files, only stems are zipped.
    const got = [];
    page.on('download', d => got.push(d));
    await page.locator('#exportOne').click();
    await page.waitForFunction(() => document.querySelector('#exportOne').textContent === '导出当前', null, { timeout: 30000 });
    await page.waitForTimeout(500);
    const names = got.map(d => d.suggestedFilename());
    assert.ok(names.some(n => n.endsWith('.wav')), 'wav file');
    assert.ok(names.some(n => n.endsWith('.mp3')), 'mp3 file');
    const stems = got.find(d => d.suggestedFilename().endsWith('_stems.zip'));
    assert.ok(stems, 'stems zip');
    const wav = fs.readFileSync(await got.find(d => d.suggestedFilename().endsWith('.wav')).path());
    assert.equal(wav.slice(0, 4).toString(), 'RIFF');
    const zip = await JSZip.loadAsync(fs.readFileSync(await stems.path()));
    const entries = Object.keys(zip.files);
    assert.ok(entries.filter(n => n.endsWith('.wav')).length > 1, 'stems included');
    console.log('Export verified:', names.join(', '), '·', entries.length, 'stem-zip entries');
    // Pattern library: save, change, re-apply, undo; drum MIDI import.
    const firstCls = async () => page.locator('.steps .c').first().getAttribute('class');
    await page.keyboard.press('Control+s');
    assert.equal(await page.evaluate(() => window.__gb.myPatterns().length), 1);
    const saved = await page.evaluate(() => JSON.stringify(window.__gb.myPatterns()[0].ev.k));
    await page.keyboard.press('r');
    await page.getByRole('button', { name: 'Pattern 库' }).click();
    await page.locator('.pat-row .pick-row').first().click();
    assert.equal(await page.evaluate(() => JSON.stringify(window.__gb.current().groove.ev.k.slice(0, 3))), JSON.stringify(JSON.parse(saved).slice(0, 3)));
    const midi = await page.evaluate(() => Array.from(window.__gb.midiOf(window.__gb.myPatterns()[0])));
    const pat = await page.evaluate(m => { const p = window.__gb.patternFromMidi(new Uint8Array(m).buffer, 'rt'); return { k: p.ev.k.length, s: p.ev.s.length, h: p.ev.h.length }; }, midi);
    const orig = await page.evaluate(() => { const e = window.__gb.myPatterns()[0].ev; return { k: e.k.length, s: e.s.length, h: e.h.length }; });
    assert.deepEqual(pat, orig, 'MIDI round trip keeps kick/snare/hat hits');
    await page.locator('#pickOv').waitFor({ state: 'detached' }).catch(() => {});
    await page.getByRole('button', { name: 'Pattern 库' }).click();
    await page.locator('#pickOv input[type=file]').setInputFiles(path.resolve(__dirname, '../tools/midi/fixtures/TRAP01.mid'));
    await page.waitForFunction(() => /^MY:TRAP01/.test(window.__gb.current().groove.src));
    console.log('Pattern library verified: save, apply, MIDI round trip, MIDI import');
    // Shortcuts: number keys switch demos, ] raises BPM, ? opens the list.
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('2');
    assert.equal(await page.locator('#tabs button[aria-selected=true]').textContent(), '02');
    const bpm0 = +(await page.locator('#bpmInput').inputValue());
    await page.keyboard.press(']');
    assert.equal(+(await page.locator('#bpmInput').inputValue()), bpm0 + 1);
    await page.keyboard.press('Shift+?');
    assert.ok(await page.locator('.keys').isVisible());
    await page.keyboard.press('Escape');
    console.log('Shortcuts verified');
    for (const width of [1440, 1100, 390]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no page overflow at ' + width);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    assert.equal(await page.locator('#motionToggle').getAttribute('aria-pressed'), 'false');
    assert.deepEqual(errors, []);
    assert.deepEqual(outside, [], 'no network requests');
    console.log('PASS: generation, playback, arrangement, editing/undo, panels, visual controls, WAV/MP3/stems, responsive widths, reduced motion; no runtime errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
