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
    await page.route('https://cdnjs.cloudflare.com/**', route => route.fulfill({
      body: fs.readFileSync(require.resolve(route.request().url().includes('jszip') ? 'jszip/dist/jszip.min.js' : 'lamejs/lame.min.js')),
      contentType: 'application/javascript'
    }));
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
    // Exercise the real download and inspect its archive, not just enabled buttons.
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#exportOne').click();
    const download = await downloadPromise;
    const zip = await JSZip.loadAsync(fs.readFileSync(await download.path()));
    const names = Object.keys(zip.files);
    assert.ok(names.some(n => n.endsWith('.wav')));
    assert.ok(names.some(n => n.endsWith('.mp3')));
    assert.ok(names.filter(n => n.endsWith('.wav')).length > 1, 'stems included');
    console.log('Export verified:', names.length, 'archive entries');
    for (const width of [1440, 1100, 390]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no page overflow at ' + width);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    assert.equal(await page.locator('#motionToggle').getAttribute('aria-pressed'), 'false');
    assert.deepEqual(errors, []);
    console.log('PASS: generation, playback, arrangement, editing/undo, panels, visual controls, WAV/MP3/stems, responsive widths, reduced motion; no runtime errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
