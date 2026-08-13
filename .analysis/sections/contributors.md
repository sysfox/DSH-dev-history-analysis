## 贡献者与团队演化

### 总览

按 git 作者统计，仓库有 40+ 位署名贡献者，其中 12 位提交数过百。**Tianyi Cui（陈天懿）**以 5,235 次提交（约占总提交 43%）从建仓第一天主导到发布日，是项目的创始人与架构师。团队扩张节奏与提交曲线高度吻合：6 月小团队精耕，7 月下旬随 Web GUI 战役大批涌入。

> [!NOTE]
> 提交数含合并提交，按作者邮箱归一。部分作者存在多个邮箱（如 imccyu 有 3 个邮箱、ZiyaZhang 有 3 个），下表已合并计数。

### 贡献者排名表

| # | 贡献者 | 活跃区间 | 提交数 | 备注 |
|---|---|---|---|---|
| 1 | Tianyi Cui | 6/10 → 8/13 | 5,235 | 创始人/架构师，全程主导；docs 提交 755 条（docs 总量一半） |
| 2 | Yichen Jiang | 6/19 → 8/13 | 1,361 | 6 月中旬加入；8 月最活跃（713 条） |
| 3 | imccyu | 6/17 → 8/13 | 1,297 | 早期加入；发布工程与 CI 主力 |
| 4 | Chinesezjc | 7/21 → 8/13 | 587 | 7 月下旬加入；CI/平台（Windows、runner、failover） |
| 5 | Turtle | 7/09 → 8/13 | 585 | 文档与站点 |
| 6 | Hypatia May | 6/12 → 8/13 | 478 | 早期加入 |
| 7 | _Kerman | 7/22 → 8/13 | 477 | Web 前端（client/ui-*） |
| 8 | creatixchu | 7/24 → 8/13 | 457 | Web 前端（onboarding、本地化） |
| 9 | ZiyaZhang | 6/25 → 8/13 | 295 | i18n 双语体系主要建立者（07-02 双语契约） |
| 10 | kingwl | 6/30 → 8/11 | 260 | |
| 11 | Huanqi Cao | 6/19 → 8/12 | 232 | |
| 12 | Dudu-0223 | 6/22 → 8/11 | 190 | |
| 13 | NI0317 | 7 月中旬 → 8/13 | 180 | Web/交互 |
| 14 | pku-xht | 7/13 → 8/13 | 163 | |
| 15 | 07akioni | 7 月 → 8/13 | 79 | |

### 月度提交矩阵（前 14 名，按 %an 精确匹配）

| 贡献者 | 2026-06 | 2026-07 | 2026-08 | 合计 |
|---|---|---|---|---|
| Tianyi Cui | 497 | 4,036 | 682 | 5,215 |
| Yichen Jiang | 21 | 627 | 713 | 1,361 |
| imccyu | 17 | 822 | 453 | 1,292 |
| Chinesezjc | 0 | 372 | 212 | 584 |
| Turtle | 0 | 353 | 223 | 576 |
| Hypatia May | 46 | 331 | 101 | 478 |
| _Kerman | 0 | 231 | 245 | 476 |
| creatixchu | 0 | 326 | 155 | 481 |
| kingwl | 1 | 211 | 48 | 260 |
| ZiyaZhang | 2 | 161 | 79 | 242 |
| Huanqi Cao | 0 | 19 | 195 | 214 |
| Dudu-0223 | 26 | 94 | 70 | 190 |
| NI0317 | 0 | 157 | 23 | 180 |
| pku-xht | 0 | 29 | 144 | 173 |

> [!IMPORTANT]
> 7 月是绝对主战场（8,273 提交，占 67%）：Tianyi Cui 一人 7 月 4,036 条，imccyu 822 条。8 月角色轮换——Yichen Jiang（713）与 Tianyi Cui（682）双核，Chinesezjc 转向 CI 平台，_Kerman/creatixchu 深耕 Web 前端。

### 团队扩张轨迹

- **6 月（小团队精耕）**：约 5–6 人——Tianyi Cui、Hypatia May、imccyu、Yichen Jiang、Huanqi Cao、Dudu-0223
- **7 月初**：kingwl（6/30）、Turtle（7/9）、pku-xht（7/13）加入
- **7 月下旬（Web GUI 战役）**：Chinesezjc（7/21）、_Kerman（7/22）、creatixchu（7/24）等大批涌入，对应 W30 2,169 → W31 3,542 的提交井喷
- **组织归属**：6 月中旬属 `deepseek-ai` 组织，约 6/27 迁至 `deepseek-harness` 组织（首个 deepseek-harness PR #115 于 6/27 合入）

### 开发模式的独特性：agent-first

这是本文档贯穿始终的底色：

```text
agent-first 仓库的三大表征
├─ 提交消息：约 1,886 条提及 codex（15%）；"address Codex review (PR N)" 是 6 月高频句式
├─ 分支模式：codex-* PR 209 个、worktree-* PR 210 个（GitHub 官方 stacked-PR 工作流）
└─ 治理响应：ADR 0007 明言"agent 遵守机器强制 gate 远比散文约定可靠"
              → 100% 覆盖率、doc-sync、verify-*、Agent Note 强制制度全部由此而生
```

- **产品代码、文档、测试、Agent Note 四者同 PR 演进**：每个非平凡变更必须同步更新 Agent Note（7/19 起）
- **栈式 PR 文化**：6/21 的 `worktree-simplify-*` 八连（prune-seam、llm-surface、branded-ids、agent-stop、trace-events、snapshot-goldens、extract-examples、lessons-learned）是成型标志
- **质量门禁对抗 AI 幻觉**：doc-typecheck 曾当场揪出文档代码块里 5 个编造的事件名（7/16）
