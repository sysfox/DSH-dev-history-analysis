## 总结

### 65 天弧线：五个关键词

回顾 2026-06-10 至 08-13 的 65 天，DeepSeek Harness 的开发历程可以概括为五句话：

1. **第一天就把地基立到最严**：monorepo、vendored 微内核、100% 覆盖率、全套卫生门禁在 6/11 一天内完成——不是先跑起来再补质量，而是先立质量再长能力。
2. **能力以"缝"为单位扩张**：每引入一类能力（bash、fs、web、subagent、workflow……）都遵循 Service Definition / Provider / Consumer 三件套，可替换性从一开始就是结构属性而非事后抽象。
3. **治理随规模演进**：从 ADR/RFC 双树到 Agent Note 统一体系，从散文约定到 doc-sync/verify-* 机器 gate、运行时 invariant 断言与冻结归档，7/19 后"非平凡变更必须带 Agent Note"成为仓库宪法。
4. **7 月中旬的产品形态跃迁**：Web GUI 骨架（apps/web、packages/client、packages/host）在 7/19 一天内落位，之后两周贡献了全程近半的提交量，产品从"示例与 TUI"走向"浏览器应用 + 宿主"。
5. **8 月收口为发布工程**：命名契约统一词汇 → vendor rescope 防 npm 名 squat → 三条发布序列（dsh / vendor / native+Python）私域试跑 → 8/13 全部公开，同日 README 附上预览论文链接。

### 关键数字快照（截至 2026-08-13）

| 维度 | 数字 |
|---|---|
| 提交 / 合并 / PR | 12,293 / 5,610 / ≈2,500 |
| 周峰值 / 日峰值 | 3,542（W31）/ 887（7/30） |
| workspace 包 / 包组 | 219 / 44+ |
| Agent Notes | 1,372（含归档 285） |
| 双语文档 | 215 个 md + 1,078 组 zh 翻译 |
| CI workflows | 15 个（.github/workflows） |
| 发布序列 | 3 条（dsh / vendor / native） |
| 版本线 | 0.0.1-rc.1 → 0.1.0-rc.5（8/13 公开） |

### 可复用的工程经验

- **质量门禁是 agent 协作的黏合剂**：当开发主力是 AI agent 时，可机器检查的 gate 比任何散文约定都可靠——这是本仓库全部治理机制的出发点。
- **"文档即产品"与"示例即测试"**：docs 提交占 12%，双语配对有机械门禁；每个示例 cordis.yml 都有无密钥冒烟 + 有密钥 e2e，直接回应了 postmortem 0001（ACP 默认导出丢失）。
- **发布序列的依赖推理**：vendor + native 必须先公开（dsh 包 peer/dependency 着它们），再用 workspace protocol 钉死版本——发布顺序本身是一份依赖图。
- **命名契约是公开前的必要税**：3,281 个文件的词汇统一（task→job、bash→shell、pty→terminal）在发布当天完成，避免把混乱术语固化进公开 API。

### 展望（文档写作时点）

截至 8/13，仓库以 12,293 次提交、约 2,500 个 PR、40+ 贡献者、219 个 workspace 包的体量定格在**公开预览起点**。README 首行即为：

> DeepSeek Harness is currently in *developer preview* and is iterating rapidly. **THERE WILL BE COMPATIBILITY-BREAKING CHANGES.**

后续演进方向（基于 8 月收尾时的可见脉络）：slot/typert 生成器的 UI 普及、self-modification 动态插件运行时、Python SDK 的 PyPI 公开、Web GUI 的插件生态（`dsh-plugin` topic）——而这些已经是下一段 git 历史的故事了。
