## 导言与数据方法

DeepSeek Harness（`dsh`）是 DeepSeek 推出的开源 agent harness，采用**"一切皆插件"**的架构，运行在 vendored 的 Cordis 框架之上（Cordis 的设计见论文 *A Programming Paradigm for Spatiotemporal Composability*）。本文档从 git 历史出发，完整还原该项目从 2026-06-10 建仓到 2026-08-13 npm 公开发布约 65 天的开发历程。

> [!NOTE]
> 本文档由多个分析 agent 并行剖析仓库 git 历史后汇总撰写。**所有日期均为提交日期（author date）**，所有 commit hash 均可直接 `git show <hash>` 复核。统计口径：master 分支全历史，HEAD = `47f943859b`（2026-08-13 19:38）。

### 数据与方法

| 项 | 值 |
|---|---|
| 分析范围 | `git log` 全历史（master，截至 HEAD `47f943859b`，2026-08-13） |
| 总提交数 | 12,293 |
| 合并提交数 | 5,610（占比 45.6%；PR 编号至 #2521） |
| 非合并提交数 | 6,683 |
| 包体量 | 44+ 包组，**219 个 workspace 包**（`@deepseek-ai/dsh-*`） |
| 文档体量 | docs/ 7 个子目录 215 个 md；**1,078 个 .zh.md + 1,078 个 .i18n.yaml**（全量双语） |
| 决策记录 | `.agents/notes/` 1,372 条（implemented 1,012 / archived 285 / proposed 50 / rejected 22） |
| 周提交峰值 | 2026-W31（7/27–8/2）：3,542 |
| 日提交峰值 | 2026-07-30：887 |
| 主要分支工作流 | GitHub 官方 stacked-PR（worktree-* 210 个 PR）+ Codex 辅助开发（codex-* 209 个 PR；约 1,886 条提交消息提及 codex） |
| 发布 | 无 tag；8/11–8/13 连发 0.0.1-rc.1 → 0.1.0-rc.5 共 9 个 `release(dsh)` 提交，8/13 全部公开到 npm |

### 提交量月度分布

| 月份 | 提交数 | 占比 | 主题 |
|---|---|---|---|
| 2026-06 | 581 | 4.7% | 冷启动、微内核、质量门禁、首批能力缝 |
| 2026-07 | 8,273 | 67.3% | 能力井喷 + Web GUI 战役（含 7/30 单日 887 峰值） |
| 2026-08 | 3,439 | 28.0% | 产品收口、命名契约、发布工程、npm 公开 |

### 提交类型分布（非合并提交，按 conventional-commit 前缀）

| 类型 | 数量 | 说明 |
|---|---|---|
| `fix` | 2,252 | 修复（约占非合并提交的 1/3） |
| `docs` | 1,356 | 文档（"文档即产品"的真实写照） |
| `test` | 950 | 测试 |
| `feat` | 693 | 新功能 |
| `refactor` | 454 | 重构 |
| `ci` | 184 | CI 配置 |
| `chore` | 162 | 杂务 |
| `cleanup` / `style` / `perf` / `build` / `release` 等 | 632 | 其余类型 |
| 其他（无前缀/非标准） | ~360 | 含部分早期英文短句提交 |

> [!TIP]
> 观察：`docs` + `test` 合计 2,306，超过 `feat`（693）的 3 倍——这个仓库把"文档与测试随代码同行"执行到了极致。

### 分析方法

```text
git log 全量抽取
      │
      ├─ 1. 时间线与阶段划分  → 按周/月/日聚合提交密度，定位结构性里程碑
      ├─ 2. 包与能力演进      → 每包组首个提交 + 219 个 workspace 包盘点
      ├─ 3. 架构决策与治理    → docs/adr|rfc → .agents/notes 迁移、verify-* 门禁
      ├─ 4. 工程基础设施      → 构建/测试/CI/vendoring/发布流水线
      └─ 5. 文档生态与发布    → docs/website/examples/python/native/README/论文
              │
              └─ 汇总 → 交叉校验 → 本主文档（个别数字二次核验，如命名契约实际 3,281 个文件）
```

各分析 agent 产出的原始章节保存在 `.analysis/sections/`，本主文档是其汇总与扩充版本。
