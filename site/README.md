# dsh 开发历程 · 可视化网站

`DEVELOPMENT-HISTORY.md`（5,567 行）的可交互可视化呈现 —— DeepSeek Harness 65 天开发历程（12,293 次提交）的完整图景。

## 技术栈

Vue 3 · Vite · vue-router · ECharts · Mermaid · markdown-it · highlight.js

## 页面

| 路由 | 页面 | 内容 |
|---|---|---|
| `/` | 概览 | 65 天天际线（可点击查当日事件）、关键数字、章节地图、五阶段 |
| `/timeline` | 时间线 | 每日/每周/月度图表、阶段对比、PR 流速、提交类型、Top-8 单日、53 条关键日期时间线（可按阶段过滤）、文档 mermaid 图、65 天逐日全表 |
| `/packages` | 包结构 | 12 领域 sunburst、49 包组诞生时间线、Top-15 提交、49 组全表（可排序）、12 领域子包清单、工具层 22 包 |
| `/architecture` | 架构决策 | 治理弧线六阶段、Agent Note 分布/六个 class/归档规则、ADR 0001–0017、RFC 001–015、十二深潜、38 门禁 |
| `/infra` | 基础设施 | 48 个基建里程碑、构建三阶段、Node 矩阵、Windows 演进、123 条根 scripts 分组、15 个 workflow、9 个 vendored 包、三条发布序列 |
| `/docs` | 文档生态 | 关键规模数字、三条咬合机制、三阶段分期、目录全景、i18n 覆盖、website 演进、六个示例、发布时间线 |
| `/contributors` | 贡献者 | 月度矩阵堆叠图、Top-5 份额、agent-first 三大表征、团队扩张、排名表 |
| `/reader` | 原文 | 整篇 Markdown 忠实渲染：搜索（行级跳转）、可滚动目录 + 滚动高亮、22 幅 mermaid 直接渲染、callout/表格/代码块样式化 |

## 数据流

```text
DEVELOPMENT-HISTORY.md
        │  npm run extract（scripts/extract.mjs）
        ▼
src/data/doc.json        ← 224 标题 / 173 表格 / 37 callout / 22 mermaid / 65 天逐日 / 贡献矩阵
src/data/domains.json    ← 12 领域 × 子包清单（人工整理，与文档核对）
        │
        ▼
src/lib/data.js          ← 数据访问层（按章节路径取表、派生图表数据）
```

所有图表数据均来自主文档的 git 实测数字；`npm run extract` 可在主文档更新后重新生成。

## 开发

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 生产构建到 dist/
npm run preview    # 预览构建产物
```

## 免责声明

本网站为独立分析产物，与 DeepSeek 无隶属或背书关系；数据截至 HEAD `47f943859b`（2026-08-13），
统计口径以主文档标注为准。完整声明见主文档《附录 D：免责声明与口径说明》。
