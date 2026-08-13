## 附录

### A. 复现本分析所用的 git 命令

以下命令均可直接在仓库根目录执行，用于复核本文档中的任意事实：

```bash
# 总量与时间跨度
git log --oneline | wc -l                       # 12,293 提交
git log --reverse --format="%h %ad %s" --date=short | head -1   # 首提交 b67e81ac97 2026-06-10
git log --format="%h %ad %s" --date=short | head -1            # 末提交 47f943859b 2026-08-13

# 贡献者
git shortlog -sne --all                          # 提交数排名（含合并）
git log --format="%ad" --date=format:"%Y-%m" | sort | uniq -c   # 月度提交分布

# 每周/每日密度
git log --format="%ad" --date=short | sort | uniq -c            # 每日提交数

# 提交类型
git log --format="%s" | grep -oP '^[a-z]+(?=:)' | sort | uniq -c # conventional-commit 前缀分布

# 里程碑核验
git show 72688a3888 --stat                       # vendor Cordis
git show a6a3807a07 --stat                       # GUI 骨架（apps/web + client + host 诞生）
git show a2d0f7f411 --stat | tail -1             # 命名契约：3281 files changed
git show 8c1e8d9890 --stat | tail -1             # 公开：222 files changed

# PR 与栈式工作流
git log --merges --format="%s" | grep -c "from deepseek"        # PR 合并数
git log --merges --format="%s" | grep "worktree" | wc -l        # worktree-* PR 数
git log --merges --format="%s" | grep "codex" | wc -l           # codex-* PR 数

# 发布序列
git log --format="%h %ad %s" --date=short --grep="release(dsh)" # 9 个 release 提交
git log --format="%h %ad %s" --date=short --grep="release(vendor)"  # vendor 发布
```

### B. 数据文件与章节源

| 路径 | 内容 |
|---|---|
| `DEVELOPMENT-HISTORY.md` | 本文档（最终交付物，仓库根目录） |
| `.analysis/sections/*.md` | 9 个章节源文件（含各分析 agent 原始产出） |
| `.analysis/packages-first-commit.txt` | 44+ 包组首个提交与提交数 |
| `.analysis/workspace-packages.txt` | 219 个 workspace 包名清单 |
| `.analysis/contrib-monthly.txt` | 月度贡献矩阵 |
| `.analysis/root-scripts.txt` | 根 package.json 全部 scripts |
| `.analysis/workflows.txt` | 15 个 CI workflow 文件名 |

### C. 术语表

| 术语 | 含义 |
|---|---|
| dsh | DeepSeek Harness 的命令行名（`npx @deepseek-ai/dsh web`） |
| Cordis | 底层插件框架（vendored 源码）；设计见 *A Programming Paradigm for Spatiotemporal Composability* |
| 微内核（microkernel） | 纯 Cordis 事件分发（waterfall/serial/parallel/emit）作为唯一扩展点的架构 |
| 能力缝（capability seam） | Service Definition / Service Provider / Consumer 三件套，可替换能力的最小完整单元 |
| Session / Turn / Step | 会话（追加式事件日志）/ 一轮交互（零或多步）/ 一次模型请求加其工具调用 |
| 事件溯源（event sourcing） | Session 是追加式 `SessionEvent` 日志即唯一事实源，"日志即状态" |
| Agent Note | 仓库的决策记录体系（.agents/notes/），7/19 由 RFC 更名而来 |
| doc-sync | 文档门禁家族（run-gates.ts 的 doc-sync 模式，38 个候选 gate） |
| invariant | 运行时断言插件（dsh-invariants + 每包 ./invariant companion） |
| Branded ID | `Branded<B>` 零成本名义类型（SessionId/CallId 等） |
| Typert | 类型图生成器/加载器/运行时注册表（为 client/host 双面生成契约） |
| stacked-PR | GitHub 官方依赖 PR 栈（仓库用 worktree-* 分支实施） |
| rescope | 把 vendored 包改名 `@deepseek-ai/cordis` 等的机器流程 |
| 命名契约 | 8/13 全库词汇统一重构（task→job、bash→shell、pty→terminal 等，3,281 文件） |

### D. 免责声明与口径说明

- 本文档所有统计均基于 master 分支 git 历史；**未包含**未合并分支、rebase 丢弃的提交与 force-push 覆盖的历史。
- 提交数含 merge commit；按 author date 而非 committer date 聚合。
- 包组提交数统计的是 `packages/<组>/` 路径下的全部提交（含组内子包）。
- 少量数据存在口径差异时，以文中标注为准（如命名契约文件数按 `git show` 实测 3,281）。
- 各章节中标注"（待考）"的条目为 git 历史无法直接确认的信息，读者可依上下文自行验证。
