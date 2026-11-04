// Desktop (Tauri) flow with the native side mocked: remembered library folder is rescanned on launch,
// exports and pattern MIDI are written as plain files into the chosen folder.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [], writes = [];
    page.on('pageerror', e => errors.push(e.message));
    const lib = path.resolve(__dirname, 'Library');
    const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
    await page.exposeFunction('nativeScan', p => walk(p).filter(f => /\.(wav|mid)$/i.test(f)).map(f => [path.basename(p) + '/' + path.relative(p, f).split(path.sep).join('/'), f, fs.statSync(f).size]));
    await page.exposeFunction('nativeRead', p => [...fs.readFileSync(p)]);
    await page.exposeFunction('nativeWrite', (p, n) => { writes.push([decodeURIComponent(p), n]); });
    await page.addInitScript(libDir => {
      localStorage.setItem('gb.libDir', JSON.stringify(libDir));
      localStorage.setItem('gb.exportDir', JSON.stringify('/out'));
      window.__TAURI__ = {
        dialog: { open: async () => '/out' },
        core: { invoke: async (cmd, args, opt) => {
          if (cmd === 'scan_dir') return window.nativeScan(args.path);
          if (cmd === 'read_file') return new Uint8Array(await window.nativeRead(args.path)).buffer;
          if (cmd === 'write_file') return window.nativeWrite(opt.headers.path, args.length);
          if (cmd === 'open_folder') return null;
          throw new Error('unknown ' + cmd);
        } }
      };
    }, lib);
    await page.goto('file://' + path.resolve(__dirname, '../app/index.html'));
    await page.waitForFunction(() => window.__gb.lib.samples.some(s => !s.builtin), null, { timeout: 15000 });
    assert.ok(await page.locator('#libDir').isVisible(), 'library folder shown');
    await page.waitForFunction(() => window.__gb.current() && window.__gb.current().slots.kick && !window.__gb.current().slots.kick.builtin, null, { timeout: 15000 });
    console.log('Library rescanned on launch:', await page.evaluate(() => window.__gb.lib.samples.filter(s => !s.builtin).length), 'files; demos use it');
    assert.ok((await page.locator('#exportDir').textContent()).includes('/out'));
    await page.locator('#exportAll').click();
    await page.waitForFunction(() => document.querySelector('#exportAll').textContent === '全部导出', null, { timeout: 120000 });
    const names = writes.map(w => w[0]);
    assert.ok(names.length >= 18, 'wav + mp3 + stems for 6 demos, got ' + names.length);
    assert.ok(names.every(n => /^\/out\/GenBeatz_[^/]+\/GenBeatz_.+\.(wav|mp3|zip)$/.test(n)), names[0]);
    assert.ok(writes.every(w => w[1] > 1000), 'non-empty files');
    console.log('Batch export wrote', names.length, 'files, e.g.', names.slice(0, 3).join(' | '));
    writes.length = 0;
    await page.getByRole('button', { name: 'Pattern 库' }).click();
    await page.getByRole('button', { name: '导出 MIDI' }).click();
    await page.waitForFunction(() => document.querySelector('#toast').textContent.includes('/out'));
    assert.match(writes[0][0], /^\/out\/.+_drums\.mid$/);
    assert.deepEqual(errors, []);
    console.log('PASS: desktop library rescan, batch export as plain files, MIDI export to folder');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
