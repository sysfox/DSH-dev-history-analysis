# DSH 开发历程分析

> DeepSeek Harness（`dsh`）开发史的完整复盘 —— 基于 git 全量历史的仓库级分析项目。
>
> 覆盖时间：**2026-06-10 建仓 → 2026-08-13 npm 公开发布**（65 天 · 12,293 次提交）。
>
> **研究与开发：DSH + DeepSeek V4 Flash**

本仓库不包含 `dsh` 源码，而是**对 `dsh` 仓库 git 历史的研究与分析产物**：由多个分析 agent 并行剖析提交历史、包结构、架构决策与工程实践后，汇总为一份长篇中文主文档。

## 主要产出

### `DEVELOPMENT-HISTORY.md` —— 主文档

一份 5,567 行的中文开发史长文，完整还原 `dsh` 从空仓库到 npm 公开的 65 天弧线，内容要点：

| 维度 | 关键数据 |
|---|---|
| 时间跨度 | 65 天（2026-06-10 → 2026-08-13） |
| 提交规模 | 12,293 提交 / 5,610 合并（45.6%）/ ≈2,500 PR / 40+ 贡献者 |
| 代码体量 | 219 个 workspace 包（49 个包组）、1,372 条 Agent Note、1,078 组双语文档 |
| 峰值节奏 | 周峰值 3,542（W31）、单日峰值 887（2026-07-30） |
| 终点形态 | `npx @deepseek-ai/dsh web` 即用的 Web GUI 产品 + 3 条 npm 发布序列 |

**章节结构**（9 章）：

1. 导言与数据方法
2. 时间线与阶段划分
3. 包与能力演进
4. 架构决策与治理
5. 工程基础设施与研发实践
6. 文档、示例与发布
7. 贡献者与团队演化
8. 总结
9. 附录（含复现所用的 git 命令清单与术语表）

## 目录结构

```text
DSH-dev-history-analysis/
├── README.md                    # 本文件
├── DEVELOPMENT-HISTORY.md       # 主文档（最终交付物）
└── site/                        # 可视化网站（Vue 3 + Vite + ECharts）
    ├── scripts/extract.mjs      # 从主文档提取结构化 JSON（src/data/doc.json）
    └── src/
        ├── pages/               # 概览 / 时间线 / 包结构 / 架构 / 基建 / 文档生态 / 贡献者 / 原文
        ├── components/          # 天际线、图表、表格、mermaid、callout 等组件
        ├── lib/                 # 数据访问层与 mermaid 主题
        └── data/                # 提取出的结构化数据（domains.json 为人工整理）
```

## 可视化网站（`site/`）

基于主文档全文的交互式可视化：65 天天际线、五阶段、49 包组 sunburst、ADR/RFC/门禁表、
15 个 CI workflow、发布序列、贡献者矩阵，以及整篇 Markdown 的在线阅读器（搜索 + 目录 + mermaid 渲染）。

```bash
cd site
npm install
npm run dev        # 本地预览 → http://localhost:5173
npm run build      # 生产构建 → dist/
npm run extract    # 重新从 DEVELOPMENT-HISTORY.md 提取数据
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
- **生成方式**：多个分析 agent 并行剖析 → 产出章节草稿 → 汇总、交叉校验后合入主文档（个别数字二次核验）。

## 免责声明

- 本项目为**基于公开 git 历史的独立分析**，与 DeepSeek 及其关联方无隶属或背书关系，不代表 DeepSeek 官方立场。
- 文中统计与结论**仅反映截至 HEAD `47f943859b`（2026-08-13）的仓库快照**，不保证绝对准确；仓库后续变更可能使部分内容过时。
- 分析由自动化工具辅助完成，个别数字可能存在误差，引用前请以 `git` 实测复核。
- 本文仅供参考，**不构成任何形式的保证、建议或投资依据**。
- 本项目仅包含对 `dsh` 仓库历史的分析产物，**不包含 `dsh` 源码本身**；`dsh` 源码与使用方式请见 DeepSeek 官方发布（`npx @deepseek-ai/dsh web`）。

## 快速导航

- 想了解 `dsh` 是什么、整体开发节奏 → [主文档项目速览](DEVELOPMENT-HISTORY.md)
- 想核对具体数字与提交 → 主文档中按 hash `git show <hash>` 复核
- 想复现整套分析 → 主文档[附录](#附录)中的 git 命令清单
