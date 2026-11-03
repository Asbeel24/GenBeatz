# GENBEAT 鼓组整理报告

整理日期：2026-11-03。共 34 条 MIDI，33 条可用，VINTAGE02 无法识别。

`cleaned/` 里是整理后的 MIDI：只保留 kick (36)、snare (38)、hi-hat (42)，删掉了力度极低的误识别音符和与 kick 重叠的疑似误识别 snare，量化到 16 分音符，hi-hat roll 保留 32 分和三连音位置，原有 swing 按检测值写回。原文件没有改动。

## 律动家族（相当于去重结果）

同一家族的鼓型 kick 和 snare 骨架基本一样（2 小节片段相似度 ≥ 85%），差别主要在 hi-hat 和个别 kick。没有完全重复的文件，所以都保留了，GenBeatz 会把同家族的当作同一个律动的变体来混用。

| 家族 | 曲风 | 文件 |
| --- | --- | --- |
| A | Trap | TRAP01、TRAP02、TRAP03、TRAP04、TRAP05、TRAP10 |
| B | Trap | TRAP012 |
| C | Trap | TRAP06、TRAP07 |
| D | Trap | TRAP08 |
| E | Trap | TRAP09 |
| F | Trap | TRAP11 |
| G | Trap | TRAP13 |
| H | Trap Soul / R&B | TRAP17 |
| I | Trap Soul / R&B | TRAPSOUL14 |
| J | Trap Soul / R&B | TRAPSOUL15 |
| K | Trap Soul / R&B | TRAPSOUL16 |
| L | Boom Bap / Pop | VINTAGE01、VINTAGE09、VINTAGE16 |
| M | Boom Bap / Pop | VINTAGE03 |
| N | Boom Bap / Pop | VINTAGE04 |
| O | Boom Bap / Pop | VINTAGE05、VINTAGE10、VINTAGE11、VINTAGE14 |
| P | Boom Bap / Pop | VINTAGE06 |
| Q | Boom Bap / Pop | VINTAGE07、VINTAGE12 |
| R | Boom Bap / Pop | VINTAGE08 |
| S | Boom Bap / Pop | VINTAGE13 |
| T | Boom Bap / Pop | VINTAGE15 |
| U | Boom Bap / Pop | VINTAGE17 |

## 每条文件的处理

| 文件 | 归类 | 小节 | swing | 处理 |
| --- | --- | --- | --- | --- |
| TRAP01 | Trap · 家族 A | 4 | 50% | 删除 1 个力度极低的误识别音符；删除 1 个和 kick 重叠的疑似误识别 snare |
| TRAP012 | Trap · 家族 B | 4 | 50% | 无需修正 |
| TRAP02 | Trap · 家族 A | 4 | 50% | 删除 1 个力度极低的误识别音符 |
| TRAP03 | Trap · 家族 A | 4 | 50% | 无需修正 |
| TRAP04 | Trap · 家族 A | 4 | 56% | 删除 3 个力度极低的误识别音符；修正 9 个量化偏差较大的音符；删除 1 个和 kick 重叠的疑似误识别 snare |
| TRAP05 | Trap · 家族 A | 4 | 60% | 修正 18 个量化偏差较大的音符 |
| TRAP06 | Trap · 家族 C | 4 | 50% | 无需修正 |
| TRAP07 | Trap · 家族 C | 4 | 50% | 删除 1 个和 kick 重叠的疑似误识别 snare |
| TRAP08 | Trap · 家族 D | 4 | 52% | 删除 3 个力度极低的误识别音符；修正 3 个量化偏差较大的音符 |
| TRAP09 | Trap · 家族 E | 4 | 62% | 删除 2 个力度极低的误识别音符；修正 20 个量化偏差较大的音符 |
| TRAP10 | Trap · 家族 A | 4 | 50% | 删除 12 个力度极低的误识别音符 |
| TRAP11 | Trap · 家族 F | 4 | 51% | 删除 2 个力度极低的误识别音符；修正 4 个量化偏差较大的音符；删除 1 个和 kick 重叠的疑似误识别 snare |
| TRAP13 | Trap · 家族 G | 4 | 53% | 删除 2 个力度极低的误识别音符 |
| TRAP17 | Trap Soul / R&B · 家族 H | 4 | 66% | 整体时值偏移 2 tick，已对齐；snare 每 2 小节一次，按双倍网格写的，已按半速换算 |
| TRAPSOUL14 | Trap Soul / R&B · 家族 I | 4 | 50% | 整体时值偏移 2 tick，已对齐；删除 1 个和 kick 重叠的疑似误识别 snare；snare 每 2 小节一次，按双倍网格写的，已按半速换算 |
| TRAPSOUL15 | Trap Soul / R&B · 家族 J | 4 | 50% | 无需修正 |
| TRAPSOUL16 | Trap Soul / R&B · 家族 K | 4 | 50% | 删除 5 个力度极低的误识别音符 |
| VINTAGE01 | Boom Bap / Pop · 家族 L | 8 | 50% | 删除 5 个力度极低的误识别音符；修正 2 个量化偏差较大的音符 |
| VINTAGE02 | - | - | - | 音高不是标准鼓映射（36/38/42），无法识别，已跳过 |
| VINTAGE03 | Boom Bap / Pop · 家族 M | 8 | 50% | 删除 3 个力度极低的误识别音符；修正 4 个量化偏差较大的音符 |
| VINTAGE04 | Boom Bap / Pop · 家族 N | 8 | 50% | 删除 4 个力度极低的误识别音符；修正 4 个量化偏差较大的音符 |
| VINTAGE05 | Boom Bap / Pop · 家族 O | 8 | 50% | 删除 20 个力度极低的误识别音符；修正 9 个量化偏差较大的音符；删除 4 个和 kick 重叠的疑似误识别 snare |
| VINTAGE06 | Boom Bap / Pop · 家族 P | 8 | 50% | 删除 6 个力度极低的误识别音符；修正 8 个量化偏差较大的音符；删除 5 个和 kick 重叠的疑似误识别 snare |
| VINTAGE07 | Boom Bap / Pop · 家族 Q | 8 | 50% | 删除 31 个力度极低的误识别音符；删除 7 个和 kick 重叠的疑似误识别 snare |
| VINTAGE08 | Boom Bap / Pop · 家族 R | 8 | 50% | 删除 7 个力度极低的误识别音符 |
| VINTAGE09 | Boom Bap / Pop · 家族 L | 8 | 50% | 删除 1 个力度极低的误识别音符；修正 2 个量化偏差较大的音符 |
| VINTAGE10 | Boom Bap / Pop · 家族 O | 8 | 50% | 删除 22 个力度极低的误识别音符；修正 20 个量化偏差较大的音符 |
| VINTAGE11 | Boom Bap / Pop · 家族 O | 8 | 50% | 删除 9 个力度极低的误识别音符；修正 8 个量化偏差较大的音符；删除 15 个和 kick 重叠的疑似误识别 snare |
| VINTAGE12 | Boom Bap / Pop · 家族 Q | 8 | 50% | 删除 11 个力度极低的误识别音符；修正 12 个量化偏差较大的音符；删除 3 个和 kick 重叠的疑似误识别 snare |
| VINTAGE13 | Boom Bap / Pop · 家族 S | 8 | 58% | 删除 31 个力度极低的误识别音符 |
| VINTAGE14 | Boom Bap / Pop · 家族 O | 8 | 50% | 删除 16 个力度极低的误识别音符；删除 6 个和 kick 重叠的疑似误识别 snare |
| VINTAGE15 | Boom Bap / Pop · 家族 T | 8 | 50% | 删除 37 个力度极低的误识别音符；修正 15 个量化偏差较大的音符；删除 6 个和 kick 重叠的疑似误识别 snare |
| VINTAGE16 | Boom Bap / Pop · 家族 L | 8 | 50% | 删除 6 个力度极低的误识别音符；修正 6 个量化偏差较大的音符；删除 3 个和 kick 重叠的疑似误识别 snare |
| VINTAGE17 | Boom Bap / Pop · 家族 U | 8 | 50% | 删除 6 个力度极低的误识别音符；修正 2 个量化偏差较大的音符；删除 3 个和 kick 重叠的疑似误识别 snare |

## 需要你确认

- 哪几条是 Memphis？从 MIDI 里分不出来，告诉我编号我就单独做一个 Memphis 曲风。
- VINTAGE02 用的音高是 30/31/94，不是标准鼓映射，可能是转换失败，需要的话重新导出一次。
- TRAP17 的 snare 每 2 小节才出现一次，我把它归到了 Trap Soul，如果不对告诉我。
- 所有文件都是音频转 MIDI 的结果，只有 kick、snare、hi-hat 三种鼓，没有 open hat 和 808，808 目前按 kick 的位置自动跟随。
