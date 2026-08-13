# DSH 开发历程分析

> DeepSeek Harness（`dsh`）开发史的完整复盘 —— 基于 git 全量历史的仓库级分析项目。
>
> 覆盖时间：**2026-06-10 建仓 → 2026-08-13 npm 公开发布**（65 天 · 12,293 次提交）。

本仓库不包含 `dsh` 源码，而是**对 `dsh` 仓库 git 历史的研究与分析产物**：由多个分析 agent 并行剖析提交历史、包结构、架构决策与工程实践后，汇总为一份长篇中文主文档，并保留全部原始数据与章节草稿，供复核与复现。

## 主要产出

### `DEVELOPMENT-HISTORY.md` —— 主文档

一份 5,572 行（约 480 KB）的中文开发史长文，完整还原 `dsh` 从空仓库到 npm 公开的 65 天弧线，内容要点：

| 维度 | 关键数据 |
|---|---|
| 时间跨度 | 65 天（2026-06-10 → 2026-08-13） |
| 提交规模 | 12,293 提交 / 5,610 合并（45.6%）/ ≈2,500 PR / 40+ 贡献者 |
| 代码体量 | 219 个 workspace 包（44+ 包组）、1,372 条 Agent Note、1,078 组双语文档 |
| 峰值节奏 | 周峰值 3,542（W31）、单日峰值 887（2026-07-30） |
| 终点形态 | `npx @deepseek-ai/dsh web` 即用的 Web GUI 产品 + 3 条 npm 发布序列 |

**文档统计**（由 `check-doc.ps1` 校验）：2,206 行表格、38 个 callout（NOTE 17 / TIP 10 / IMPORTANT 6 / WARNING 5）、22 个 Mermaid 图、35 组代码围栏。

**章节结构**（9 章）：

1. 导言与数据方法
2. 时间线与阶段划分
3. 包与能力演进
4. 架构决策与治理
5. 工程基础设施与研发实践
6. 文档、示例与发布
7. 贡献者与团队演化
8. 总结
9. 附录（含复现所用的 git 命令清单）

## 目录结构

```text
DSH-dev-history-analysis/
├── README.md                    # 本文件
├── DEVELOPMENT-HISTORY.md       # 主文档（汇总与扩充版）
└── .analysis/                   # 分析支撑材料
    ├── check-doc.ps1            # 主文档格式/统计校验脚本
    ├── *.txt                    # 从 git 历史抽取的原始数据（8 个）
    └── sections/                # 各分析 agent 产出的章节草稿（10 个）
```

## 分析方法论

```text
git log 全量抽取
      │
      ├─ 1. 时间线与阶段划分  → 按周/月/日聚合提交密度，定位结构性里程碑
      ├─ 2. 包与能力演进      → 每包组首个提交 + 219 个 workspace 包盘点
      ├─ 3. 架构决策与治理    → docs/adr|rfc → .agents/notes 迁移、verify-* 门禁
      ├─ 4. 工程基础设施      → 构建/测试/CI/vendoring/发布流水线
      └─ 5. 文档生态与发布    → docs/website/examples/python/native/README/论文
              │
              └─ 汇总 → 交叉校验 → 本主文档
```

- **统计口径**：`master` 分支全历史，HEAD = `47f943859b`（2026-08-13）；所有日期为提交日期（author date）。
- **可复核性**：文中所有 commit hash 均可直接 `git show <hash>` 验证；附录 A 列出了复现分析所用的全部 git 命令。
- **生成方式**：多个分析 agent 并行剖析 → 产出章节草稿（`.analysis/sections/`）→ 汇总、交叉校验后合入主文档（个别数字二次核验）。

## 分析支撑材料

### 原始数据（`.analysis/*.txt`）

| 文件 | 内容 |
|---|---|
| `workspace-packages.txt` | 219 个 workspace 包名清单（`@deepseek-ai/dsh-*`） |
| `packages-first-commit.txt` | 各包组首个提交 hash、日期与累计提交数 |
| `contrib-monthly.txt` | 按贡献者 × 月份的提交数矩阵 |
| `root-scripts.txt` | 根 package.json 脚本展开（build/test 等 123 行） |
| `workflows.txt` | GitHub Actions 工作流清单（ci / docs-pages / e2e 等） |
| `doc-sync-gates.txt` | 文档同步质量门禁清单（doc-typecheck、cordis-catalog 等） |
| `examples.txt` | 官方示例清单（acp-agent、headless-agent、jsonrpc-agent、mcp-memory） |

### 章节草稿（`.analysis/sections/*.md`）

各分析 agent 的原始输出，与主文档章节一一对应，是主文档的**底稿与依据**：

| 草稿 | 对应主文档章节 | 规模 |
|---|---|---|
| `intro.md` | 导言与数据方法 | 63 行 |
| `timeline.md` | 时间线与阶段划分 | 980 行 |
| `packages.md` | 包与能力演进 | 559 行 |
| `architecture.md` | 架构决策与治理 | 688 行 |
| `infrastructure.md` | 工程基础设施与研发实践 | 966 行 |
| `docs-ecosystem.md` | 文档、示例与发布 | 916 行 |
| `contributors.md` | 贡献者与团队演化 | 59 行 |
| `conclusion.md` | 总结 | 28 行 |
| `appendix.md` | 附录（git 复现命令） | 61 行 |
| `header.md` | 文档头部（项目速览） | 24 行 |

## 校验脚本

`check-doc.ps1` 从仓库根目录运行（脚本内以相对路径读取主文档），输出主文档的统计指标并检测超长散文段落：

```powershell
pwsh .\.analysis\check-doc.ps1
```

示例输出（2026-08-13 版本）：

```text
bytes: 479747
lines: 5572
table-lines: 2206
callouts: NOTE=17 TIP=10 IMPORTANT=6 WARNING=5
mermaid-blocks: 22
code-fence-pairs: 35
long-prose-paragraphs(>8行): 1
```

## 快速导航

- 想了解 `dsh` 是什么、整体开发节奏 → [主文档项目速览](DEVELOPMENT-HISTORY.md)
- 想核对具体数字与提交 → 主文档中按 hash `git show <hash>` 复核，或直接查 `.analysis/` 对应原始数据
- 想复现整套分析 → 主文档[附录](#附录)中的 git 命令清单 + `.analysis/sections/` 草稿

> [!NOTE]
> 本项目仅包含对 `dsh` 仓库历史的分析产物（分析文档与数据），**不包含 `dsh` 源码本身**。`dsh` 源码与使用方式请见 DeepSeek 官方发布（`npx @deepseek-ai/dsh web`）。
