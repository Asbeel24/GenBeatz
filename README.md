# GenBeatz

用你自己的采样库批量生成 beat demo，快速发给 artist 写歌；正式编曲之后在 DAW 里做。

Batch beat-demo generator that works from your own sample library. Single-file web app, everything runs in the browser (no upload).

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

- `app/index.html`：整个应用（JSZip 3.10.1、lamejs 1.2.1 从 cdnjs 加载）。
- `tools/midi/`：MIDI 清洗和鼓型提取脚本（`clean.py` → `build.py`），清洗报告见 `CLEANING_REPORT.md`。
- `tests/`：Playwright 测试。`python3 tests/mklib.py tests` 生成假采样库，`cd tests && python3 mkextra.py`，然后 `npm install && cd tests && node t9.js` 等。测试会把 cdnjs 请求转到本地 `node_modules`。
