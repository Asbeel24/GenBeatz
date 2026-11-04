# GenBeatz

用你自己的采样库批量生成 beat demo，快速发给 artist 写歌；正式编曲之后在 DAW 里做。

Batch beat-demo generator that works from your own sample library. Browser-based app; audio processing stays local (no upload).

## 运行

- **桌面版（Windows / Mac）**：在 GitHub 的 Actions 页打开最新一次「Desktop build」，下载 `GenBeatz-macOS`（.dmg）或 `GenBeatz-Windows`（.msi / .exe）。安装包还没签名：Mac 第一次打开要在「应用程序」里右键 GenBeatz → 打开；Windows 出现 SmartScreen 时点「更多信息 → 仍要运行」。
- **浏览器**：直接用 Chrome / Edge / Safari 打开 `app/index.html`，或 `npm start` 后访问 `http://127.0.0.1:4173/app/`。不需要联网。

## 功能（当前版本）

- 采样库：按文件夹/文件名识别包、乐器类别、BPM、调性；没写 loop 的 loop（Loops 文件夹、文件名带 BPM+调性）也能识别，没写 BPM 的按长度推算。
- 曲风：Trap、Trap Soul / R&B、Boom Bap、Pop、Drill。鼓型来自清洗过的 MIDI（Drill 暂用内置模板）。
- 7 条鼓轨（Kick、Snare/Clap、Hi-hat、Open hat、Perc、Rim、808）+ Loop + 可选 Loop 2。
- Pattern 模式：可编辑步进网格（点击开关、拖动力度、滚奏、翻页、复制、撤销）、播放光标；Swing / 密度 / 力度旋钮；每轨随机节奏、换音色、选择音色、锁定。
- Arrange 模式：4 种全曲结构、开头选项、按段落开关轨道、从任意段落播放。
- 混音台：音量、声像、M/S、3 段 EQ、低切；主输出限幅。
- 导出：WAV（24-bit）、MP3（320k）直接出文件，只有分轨每条打包成一个 zip；全部导出时一批放进一个带时间的文件夹。桌面版写进你选的导出文件夹（底部可更改、打开）；Chrome / Edge 选一次文件夹后直接写入；Safari 逐个下载。
- Pattern 库：Ctrl/⌘+S 或「Pattern 库 → 保存当前」把鼓型存起来，以后点一下套到任意一条（可撤销）；可导入鼓 MIDI（GM 音高：36 kick、38/39 snare/clap、42 hat、46 open hat、37 rim、其余打击乐算 perc）或 `.gbpattern.json`，也可导出 MIDI 和 pattern 文件。
- 快捷键：空格播放、G 生成、R 重新生成当前、1–9 切换、←/→ 上下一条、[ / ] 调 BPM（Shift ±5）、P / A、M 混音台、L 采样库、E 导出当前、Shift+E 全部导出、? 看全部。
- 桌面版会记住采样库文件夹，每次打开自动重新扫描并生成一批。

## 目录

- `app/index.html`：应用结构和音频引擎（JSZip 3.10.1、lamejs 1.2.1 从 cdnjs 加载）。
- `app/studio.css`：工作台视觉样式和响应式布局。
- `app/studio.js`：粒子场和面板开关；不修改音频合成逻辑。
- `app/io.js`：采样库来源、导出去向（桌面文件夹 / 浏览器）和 Pattern 库。
- `app/vendor/`：本地字体（OFL）、JSZip、lamejs。
- `src-tauri/`：Tauri 2 桌面壳，只负责扫描文件夹、读样本、写导出文件。`npm run desktop:dev` 本地运行，`npm run desktop:build` 打包（需要 Rust）。
- `tools/midi/`：MIDI 清洗和鼓型提取脚本（`clean.py` → `build.py`），清洗报告见 `CLEANING_REPORT.md`。
- `tests/`：Playwright 测试。`python3 tests/mklib.py tests` 生成假采样库，`cd tests && python3 mkextra.py`，然后 `npm install && cd tests && node t9.js` 等。测试会把 cdnjs 请求转到本地 `node_modules`。

## Beat Lab 界面

参考 Portal 的粒子空间感、SoniX 的音乐制作品牌气质，重新组织为采样库和主工作台。右上角可收起视觉区或采样库；混音台按需展开。Pattern / Arrange 继续共享同一条 demo。

动态雕塑随播放节拍脉动。指针会拉伸邻近曲面并改变旋转姿态，按下时产生一次形变冲击，离开后惯性回弹。背板和文字保留正常亮度。Three.js / WebGL2 的 PBR 金属带具有三次半扭转、带夹点的时变曲率和折面高光，以官网的细线、低亮背景与集中高光为视觉参考。雕塑背后另有低亮度坐标网格、等高线、节点和缓慢扫描光带，使用 CSS / SVG 渲染且不响应鼠标。无樱花、大面积背光、实时阴影或后期泛光。渲染分辨率上限为 1.5 倍，约 30 帧/秒；连续慢帧会降低分辨率并降至 20 帧/秒。WebGL 不可用或上下文丢失时回退到 Canvas 线网。动效可暂停，默认尊重系统减少动态效果设置，离屏或切到后台暂停动画。视觉交互不会改变音频。

直接打开 `app/index.html`（保留同目录 CSS / JS 文件），或运行 `npm start` 后访问 `http://127.0.0.1:4173/app/`。

### 界面细节

- 间距统一为 4 / 8 / 12 / 16 / 24 / 32 px；顶部参数栏所有控件同高 36px，标签对齐在一条线上。
- 英文大写标签保留字距，中文正文字距收到接近 0；数字用等宽数字（BPM、旋钮、dB）。
- 采样库面板在滚动时停留在可视区内。
- 动画：弹窗（选择音色、Loop 设置、Instrument 设置）淡入 + 轻微放大，关闭更快；混音台上浮出现、下沉收起；采样库从左滑入滑出；视觉区折叠高度；提示条淡入淡出；切换 demo / Pattern / Arrange 时内容轻微落定。打开用 ease-out 约 220ms，关闭用 ease-in 约 150ms；系统开启「减少动态效果」时全部即时切换。

### 验证

```sh
npm ci
npx playwright install chromium
npm run test:studio
npm run test:art
```

覆盖内置包生成、播放、编排、步进编辑和撤销、面板切换、动效开关、减少动态效果、三个屏幕宽度，以及实际 WAV / MP3 / 分轨 ZIP 下载。测试将 CDN 音频导出依赖映射到本地安装包。

字体和导出依赖已经本地化，运行时不联网。`npm run test:desktop` 用模拟的桌面接口验证采样库重扫和批量导出。

### 动态视觉构建

`app/src/art-pbr.js` 是 PBR 源码，`app/art-pbr.bundle.js` 是随仓库提交的本地构建产物，包含 Three.js 许可证说明。修改后运行 `npm run build:art`。视觉运行无需 CDN、HDR 图片或在线纹理。首次初始化会生成一张小型环境反射贴图；尚未在所有低端设备上实测性能。
