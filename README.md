# GenBeatz

用你自己的采样库批量生成 beat demo，快速发给 artist 写歌；正式编曲之后在 DAW 里做。

Batch beat-demo generator that works from your own sample library. Browser-based app; audio processing stays local (no upload).

## 运行

直接用 Chrome / Edge / Safari 打开 `app/index.html`，点「选择采样库文件夹」。

## 功能（当前版本）

- 采样库：按文件夹/文件名识别包、乐器类别、BPM、调性；没写 loop 的 loop（Loops 文件夹、文件名带 BPM+调性）也能识别，没写 BPM 的按长度推算。
- 曲风：Trap、Trap Soul / R&B、Boom Bap、Pop、Drill。鼓型来自清洗过的 MIDI（Drill 暂用内置模板）。
- 7 条鼓轨（Kick、Snare/Clap、Hi-hat、Open hat、Perc、Rim、808）+ Loop + 可选 Loop 2。
- Pattern 模式：可编辑步进网格（点击开关、拖动力度、滚奏、翻页、复制、撤销）、播放光标；Swing / 密度 / 力度旋钮；每轨随机节奏、换音色、选择音色、锁定。
- Arrange 模式：4 种全曲结构、开头选项、按段落开关轨道、从任意段落播放。
- 混音台：音量、声像、M/S、3 段 EQ、低切；主输出限幅。
- 导出：WAV（24-bit）、MP3（320k）、分轨，打包成 zip；全曲批量导出每条一个 zip。

## 目录

- `app/index.html`：应用结构和音频引擎（JSZip 3.10.1、lamejs 1.2.1 从 cdnjs 加载）。
- `app/studio.css`：工作台视觉样式和响应式布局。
- `app/studio.js`：粒子场、樱花层和面板开关；不修改音频合成逻辑。
- `tools/midi/`：MIDI 清洗和鼓型提取脚本（`clean.py` → `build.py`），清洗报告见 `CLEANING_REPORT.md`。
- `tests/`：Playwright 测试。`python3 tests/mklib.py tests` 生成假采样库，`cd tests && python3 mkextra.py`，然后 `npm install && cd tests && node t9.js` 等。测试会把 cdnjs 请求转到本地 `node_modules`。

## Beat Lab 界面

参考 Portal 的粒子与青绿 / 紫色关系、SoniX 的音乐制作品牌气质，重新组织为采样库和主工作台。右上角可收起视觉区或采样库；混音台按需展开。Pattern / Arrange 继续共享同一条 demo。

粒子视觉随播放节拍脉动，指针可轻微扰动；樱花层可单独开启。动效可暂停，默认尊重系统减少动态效果设置，离屏或切到后台暂停动画。视觉交互不会改变音频。

直接打开 `app/index.html`（保留同目录 CSS / JS 文件），或运行 `npm start` 后访问 `http://127.0.0.1:4173/app/`。

### 验证

```sh
npm ci
npx playwright install chromium
npm run test:studio
```

覆盖内置包生成、播放、编排、步进编辑和撤销、面板切换、动效开关、减少动态效果、三个屏幕宽度，以及实际 WAV / MP3 / 分轨 ZIP 下载。测试将 CDN 音频导出依赖映射到本地安装包。

当前仍是浏览器应用，未制作桌面安装包。字体和导出依赖仍从外部服务加载；正式离线桌面发行前需将依赖本地化，并完成文件访问、安装打包与目标系统兼容验证。
