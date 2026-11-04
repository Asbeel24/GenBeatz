/* GenBeatz I/O: where samples come from, where exports go, and the Pattern library.
   Desktop (Tauri) uses real folders on disk; the browser falls back to a folder picker or plain downloads.
   Loaded after the main script, so it can use its globals (store, toast, el, demos, ...). */
'use strict';
const TAURI = window.__TAURI__;
const DESKTOP = !!(TAURI && TAURI.core);
const tInvoke = DESKTOP ? TAURI.core.invoke : null;
const joinPath = (a, b) => a.replace(/[\\/]+$/, '') + (/^[A-Za-z]:\\/.test(a) ? '\\' : '/') + b;
if (DESKTOP) document.documentElement.classList.add('desktop');

async function asBytes(x) {
  if (x instanceof Blob) return new Uint8Array(await x.arrayBuffer());
  if (x instanceof ArrayBuffer) return new Uint8Array(x);
  if (ArrayBuffer.isView(x)) return new Uint8Array(x.buffer, x.byteOffset, x.byteLength);
  return new TextEncoder().encode(String(x));
}
async function pickFolder(title) {
  if (!DESKTOP) return null;
  const r = await TAURI.dialog.open({ directory: true, multiple: false, title });
  return Array.isArray(r) ? r[0] : r || null;
}

// ---------- export destination
let exportHandle = null; // browser: a folder picked once per session (Chrome / Edge)
async function openSink(sub) {
  if (DESKTOP) {
    let dir = store.get('gb.exportDir', null);
    if (!dir) { dir = await pickFolder('选择导出文件夹'); if (!dir) return null; store.set('gb.exportDir', dir); renderExportDir(); }
    const root = sub ? joinPath(dir, sub) : dir;
    return {
      where: root,
      async write(name, data) { await tInvoke('write_file', await asBytes(data), { headers: { path: encodeURIComponent(joinPath(root, name)) } }); }
    };
  }
  if (window.showDirectoryPicker && !(window.claude && window.claude.use)) {
    try { if (!exportHandle) exportHandle = await window.showDirectoryPicker({ id: 'gb-export', mode: 'readwrite' }); }
    catch (e) { if (e && e.name === 'AbortError') return null; exportHandle = null; }
    if (exportHandle) {
      const dirH = sub ? await exportHandle.getDirectoryHandle(sub, { create: true }) : exportHandle;
      return {
        where: exportHandle.name + (sub ? '/' + sub : ''),
        async write(name, data) { const w = await (await dirH.getFileHandle(name, { create: true })).createWritable(); await w.write(data instanceof Blob ? data : new Blob([data])); await w.close(); }
      };
    }
  }
  // Safari and embedded previews: one download per file
  return { where: '下载文件夹', async write(name, data) { await saveFile(name, data instanceof Blob ? data : new Blob([data])); await new Promise(r => setTimeout(r, 300)); } };
}
function renderExportDir() {
  const box = $('#exportDir'); if (!box) return;
  const dir = store.get('gb.exportDir', null);
  box.replaceChildren(...[
    el('span', { class: 'hint', title: dir || '' }, dir ? '导出到 ' + shortPath(dir) : '第一次导出时选择文件夹'),
    el('button', { class: 'small', onclick: async () => { const d = await pickFolder('选择导出文件夹'); if (d) { store.set('gb.exportDir', d); renderExportDir(); } } }, dir ? '更改' : '选择'),
    dir ? el('button', { class: 'small', onclick: () => tInvoke('open_folder', { path: dir }).catch(e => toast('打不开：' + e)) }, '打开') : null].filter(Boolean));
}
const shortPath = p => p.length > 42 ? '…' + p.slice(-40) : p;

// ---------- desktop sample library: remember the folder, rescan it on every launch
async function loadLibraryDir(dir, quiet) {
  if (!quiet) toast('扫描采样库中…', 60000);
  let list;
  try { list = await tInvoke('scan_dir', { path: dir }); }
  catch (e) { toast('读不到采样库文件夹：' + e); return false; }
  const items = list.map(([rel, abs, size]) => ({
    path: rel,
    file: { name: rel.split('/').pop(), size, arrayBuffer: () => tInvoke('read_file', { path: abs }) }
  }));
  importFiles(items);
  renderLibDir();
  return true;
}
function renderLibDir() {
  const box = $('#libDir'); if (!box) return;
  const dir = store.get('gb.libDir', null);
  box.hidden = !dir;
  if (dir) box.replaceChildren(el('span', { class: 'hint', title: dir }, shortPath(dir)), el('button', { class: 'small', onclick: () => loadLibraryDir(dir) }, '重新扫描'));
}
if (DESKTOP) {
  const label = $('label[for=dirInput]');
  label.addEventListener('click', async e => {
    e.preventDefault();
    const dir = await pickFolder('选择采样库文件夹'); if (!dir) return;
    store.set('gb.libDir', dir); loadLibraryDir(dir);
  });
  label.insertAdjacentElement('afterend', el('div', { id: 'libDir', class: 'libdir' }));
  $('.exportbar .spacer').insertAdjacentElement('beforebegin', el('div', { id: 'exportDir', class: 'exportdir' }));
  renderLibDir(); renderExportDir();
  const dir = store.get('gb.libDir', null);
  if (dir) loadLibraryDir(dir, true).then(ok => { if (ok) generate(); });
}

// ---------- Pattern library: save the drum pattern you like, bring it back later, import drum MIDI
const PAT_KEY = 'gb.patterns';
const GM_OUT = { k: 36, s: 38, h: 42, o: 46, p: 56, r: 37 }; // 808 follows the kick, so it is not written
const GM_IN = n => n === 35 || n === 36 ? 'k' : n === 38 || n === 40 || n === 39 ? 's' : n === 37 ? 'r' : n === 42 || n === 44 ? 'h' : n === 46 ? 'o'
  : [49, 51, 52, 53, 55, 57, 59].includes(n) ? null : (n >= 41 && n <= 81) ? 'p' : null;
const myPatterns = () => store.get(PAT_KEY, []);
function patternOf(d, name) {
  const g = GENRES[d.genre];
  return { format: 'genbeatz-pattern', v: 1, name, genre: d.genre, bpm: d.bpm, len: d.groove.len, swing: d.swing != null ? d.swing : d.groove.swing,
    ev: JSON.parse(JSON.stringify(shapedLines(d))), from: d.groove.src, saved: Date.now(), genreName: g.name };
}
function savePattern(d, quiet) {
  const list = myPatterns();
  const name = `${GENRES[d.genre].name} ${d.bpm} · ${String(d.groove.src).replace(/^MY:/, '')} · ${stamp().slice(4, 13).replace('-', ' ')}`;
  list.unshift(patternOf(d, name)); store.set(PAT_KEY, list.slice(0, 300));
  if (!quiet) toast('已存进 Pattern 库：' + name);
  return list[0];
}
// tile or cut a pattern to the demo's length, then put it on the grid (undo brings the old one back)
function applyPattern(d, pat) {
  const len = d.groove.len, src = pat.len || 128, ev = {};
  for (const ln of ['k', 's', 'h', 'o', 'p', 'r', 'b']) {
    const out = [];
    for (let o = 0; o < len; o += src) for (const [q, v] of pat.ev[ln] || []) if (q + o < len) out.push([+(q + o).toFixed(3), v]);
    ev[ln] = out;
  }
  if (!pat.ev.b && !GENRES[d.genre].no808) ev.b = ev.k.filter(([q, v]) => v >= 80 || q % 16 === 0);
  pushHist(d);
  d.groove.ev = ev; d.groove.edited = true; d.groove.src = 'MY:' + (pat.name || '导入').slice(0, 40); d.density = 50;
  if (pat.swing != null) d.swing = pat.swing;
  const pl = pools(d.params || P);
  for (const [ln, slot] of LINES) if (ev[ln].length && !d.slots[slot]) d.slots[slot] = pickSlot(slot, pl, Math.random, null, d.genre);
  refreshDemo(d);
}
const snapQ = q => { const a = Math.round(q * 4) / 4, b = Math.round(q * 3) / 3, r = Math.abs(a - q) <= Math.abs(b - q) ? a : b; return Math.abs(r - Math.round(r)) < 0.13 ? Math.round(r) : +r.toFixed(3); };
function patternFromMidi(ab, name) {
  const m = parseMidi(ab, { drums: true }), ev = { k: [], s: [], h: [], o: [], p: [], r: [] };
  for (const n of m.notes) { const ln = GM_IN(n.p); if (ln) ev[ln].push([snapQ(n.s * 4), n.v]); }
  const used = Object.values(ev).reduce((a, l) => a + l.length, 0);
  if (!used) throw new Error('这个 MIDI 里没有鼓的音符（需要 36 kick / 38 snare / 42 hat 这类 GM 鼓音高）');
  for (const ln in ev) { const seen = new Set(); ev[ln] = ev[ln].sort((a, b) => a[0] - b[0]).filter(([q]) => !seen.has(q) && seen.add(q)); }
  return { format: 'genbeatz-pattern', v: 1, name, len: m.bars * 16, ev, saved: Date.now() };
}
function midiOf(pat) {
  const ppq = 96, ev = [];
  for (const [ln, note] of Object.entries(GM_OUT)) for (const [q, v] of pat.ev[ln] || []) { const t = Math.round(q * ppq / 4); ev.push([t, 0x99, note, Math.max(1, Math.min(127, Math.round(v)))], [t + ppq / 8, 0x89, note, 0]); }
  ev.sort((a, b) => a[0] - b[0] || (a[1] === 0x89 ? -1 : 1));
  const bytes = [], vlq = n => { const o = [n & 127]; while ((n >>= 7)) o.unshift((n & 127) | 128); return o; };
  const tempo = Math.round(60000000 / (pat.bpm || 140));
  bytes.push(0, 0xff, 0x51, 3, tempo >> 16 & 255, tempo >> 8 & 255, tempo & 255);
  let last = 0; for (const [t, st, a, b] of ev) { bytes.push(...vlq(t - last), st, a, b); last = t; }
  const end = Math.max(last, Math.round((pat.len || 128) * ppq / 4)); bytes.push(...vlq(end - last), 0xff, 0x2f, 0);
  const u32 = n => [n >>> 24, n >> 16 & 255, n >> 8 & 255, n & 255];
  return new Uint8Array([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 0, ppq, 0x4d, 0x54, 0x72, 0x6b, ...u32(bytes.length), ...bytes]);
}
async function importPatternFiles(d, files) {
  let n = 0, lastPat = null;
  for (const f of files) {
    try {
      const name = f.name.replace(/\.(mid|midi|json)$/i, '');
      const pat = /\.json$/i.test(f.name) ? JSON.parse(await f.text()) : patternFromMidi(await f.arrayBuffer(), name);
      if (pat.format !== 'genbeatz-pattern' || !pat.ev) throw new Error('不是 GenBeatz pattern 文件');
      pat.name = pat.name || name;
      const list = myPatterns(); list.unshift(pat); store.set(PAT_KEY, list.slice(0, 300)); lastPat = pat; n++;
    } catch (e) { toast(`${f.name}：${e.message}`, 4000); }
  }
  if (lastPat) { applyPattern(d, lastPat); toast(n > 1 ? `导入了 ${n} 个 pattern，已用上最后一个` : '已导入并用上：' + lastPat.name); }
}
function openPatterns(d) {
  closePicker();
  const list = el('div', { class: 'pick-list', role: 'listbox', 'aria-label': '我的 Pattern' });
  const draw = () => {
    const pats = myPatterns(); list.replaceChildren();
    if (!pats.length) list.append(el('div', { class: 'hint', style: 'padding:16px' }, '还没有保存的 pattern。喜欢哪条鼓型就点「保存当前」，或者导入鼓 MIDI。'));
    pats.forEach((p, i) => {
      const use = el('button', { class: 'pick-row', role: 'option', title: '用到当前这条' }, el('span', { class: 'pn' }, p.name), el('span', { class: 'pp' }, `${(p.len || 128) / 16} 小节${p.bpm ? ' · ' + p.bpm + ' BPM' : ''}`),
        el('span', { class: 'pt' }, new Date(p.saved || 0).toLocaleDateString()));
      use.addEventListener('click', () => { applyPattern(d, p); closePicker(); toast('已用上：' + p.name); });
      const del = el('button', { class: 'small pat-del', 'aria-label': '删除 ' + p.name, title: '删除' }, '✕');
      del.addEventListener('click', () => { const l = myPatterns(); l.splice(i, 1); store.set(PAT_KEY, l); draw(); });
      list.append(el('div', { class: 'pat-row' }, use, del));
    });
  };
  const fileIn = el('input', { type: 'file', accept: '.mid,.midi,.json', multiple: true, class: 'vh' });
  fileIn.addEventListener('change', () => { const fs = [...fileIn.files]; closePicker(); importPatternFiles(d, fs); });
  const btn = (txt, fn, cls) => { const b = el('button', { class: cls || '' }, txt); b.addEventListener('click', fn); return b; };
  const close = btn('✕', closePicker, 'small'); close.setAttribute('aria-label', '关闭');
  const box = el('div', { class: 'picker', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Pattern 库' },
    el('div', { class: 'pick-head' }, el('strong', {}, 'Pattern 库'), el('span', { class: 'hint' }, '点一行把鼓型用到当前这条，可以撤销'), el('span', { class: 'spacer' }), close),
    list,
    el('div', { class: 'pick-foot' },
      btn('导入 MIDI / 文件…', () => fileIn.click()), fileIn,
      btn('导出 MIDI', async () => { const p = patternOf(d, baseName(d)); const sink = await openSink(null); if (sink) { await sink.write(baseName(d) + '_drums.mid', new Blob([midiOf(p)], { type: 'audio/midi' })); toast('已导出到 ' + sink.where); } }),
      btn('导出 pattern 文件', async () => { const p = patternOf(d, baseName(d)); const sink = await openSink(null); if (sink) { await sink.write(baseName(d) + '.gbpattern.json', new Blob([JSON.stringify(p)], { type: 'application/json' })); toast('已导出到 ' + sink.where); } }),
      el('span', { class: 'spacer' }),
      btn('保存当前', () => { savePattern(d); draw(); }, 'primary')));
  const ov = el('div', { class: 'pick-ov', id: 'pickOv' }, box);
  ov.addEventListener('pointerdown', e => { if (e.target === ov) closePicker(); });
  ov.addEventListener('keydown', e => { if (e.key === 'Escape') closePicker(); e.stopPropagation(); });
  document.body.append(ov); draw(); close.focus();
}
Object.assign(window.__gb || {}, { savePattern, applyPattern, patternFromMidi, midiOf, myPatterns, openPatterns, openSink, importPatternFiles });
