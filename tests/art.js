const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({viewport:{width:1280,height:800}});
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.route('https://**', route => route.fulfill({body:'',contentType:'text/plain'}));
    await page.goto('file://' + path.resolve(__dirname, '../app/index.html'));
    assert.equal(await page.locator('#artStage').getAttribute('data-renderer'), 'pbr');
    assert.equal(await page.locator('.signal-backdrop').count(), 1, 'ambient signal field is present');
    const shape = page.locator('.pbr-art');
    const first = await shape.screenshot();
    await page.waitForTimeout(600);
    assert.equal((await shape.screenshot()).equals(first), false, 'shape animates');
    console.log('Animation verified');
    const beforePointer = await shape.screenshot();
    await page.mouse.move(1030, 115);
    await page.waitForTimeout(250);
    const afterPointer = await shape.screenshot();
    assert.equal(afterPointer.equals(beforePointer), false, 'pointer strongly deforms the sculpture');
    await page.mouse.down();
    await page.waitForTimeout(120);
    const afterPress = await shape.screenshot();
    await page.mouse.up();
    assert.equal(afterPress.equals(afterPointer), false, 'pointer press creates a deformation impulse');
    console.log('Pointer pull and press impulse verified');
    await page.locator('#motionToggle').click();
    assert.equal(await page.locator('#motionToggle').getAttribute('aria-pressed'), 'false', 'motion control pauses animation');
    await page.waitForTimeout(300);
    const pausedFrame = await page.locator('#artStage').getAttribute('data-art-frame');
    await page.waitForTimeout(250);
    assert.equal(await page.locator('#artStage').getAttribute('data-art-frame'), pausedFrame, 'paused shape stops rendering');
    console.log('Pause verified');
    require('node:fs').mkdirSync(path.resolve(__dirname, '../output'), { recursive: true });
    await page.screenshot({path:path.resolve(__dirname, '../output/studio-pbr.png')});
    // Context loss must recover even when animation is paused.
    await page.evaluate(() => {
      const canvas = document.querySelector('.pbr-art');
      canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext();
    });
    await page.waitForFunction(() => document.querySelector('#artStage').dataset.renderer === 'fallback');
    assert.equal(await shape.isVisible(), false);
    await page.locator('#genBtn').click();
    assert.equal(await page.locator('#tabs button').count(), 6);
    const fallback = await browser.newPage();
    fallback.on('pageerror', e => errors.push(e.message));
    await fallback.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type === 'webgl2' ? null : original.call(this, type, ...args); };
    });
    await fallback.route('https://**', route => route.fulfill({body:'',contentType:'text/plain'}));
    await fallback.goto('file://' + path.resolve(__dirname, '../app/index.html'));
    assert.equal(await fallback.locator('#artStage').getAttribute('data-renderer'), 'fallback');
    assert.equal(await fallback.locator('.pbr-art').count(), 0);
    await fallback.locator('#libraryToggle').click();
    assert.equal(await fallback.locator('#libraryPanel').isVisible(), false);
    assert.deepEqual(errors, []);
    console.log('PASS: PBR active, changing frames, exact pause, context-loss fallback, unavailable-WebGL fallback, working controls; no runtime errors.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
