<script setup>
import { HEAD } from '../lib/data'
</script>

<template>
  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-col">
        <div class="footer-title">关于本站</div>
        <p>
          本网站是 <code>DEVELOPMENT-HISTORY.md</code>（5,567 行）的可视化呈现，数据全部提取自该文档，
          统计口径以文档标注为准（author date / master 全历史，HEAD <span class="hash">{{ HEAD.hash }}</span>，{{ HEAD.date }}）。
        </p>
      </div>
      <div class="footer-col">
        <div class="footer-title">免责声明</div>
        <p>
          本站为独立分析产物，与 DeepSeek 无隶属或背书关系；内容为 2026-08-13 时点的仓库快照分析，
          不构成任何保证。完整声明见<a href="#/reader#d-免责声明与口径说明">原文附录 D</a>。
        </p>
      </div>
      <div class="footer-col footer-meta">
        <div class="footer-title">技术栈</div>
        <p class="mono small">Vue 3 · Vite · ECharts · Mermaid · markdown-it</p>
        <p class="mono small dim">git log --format="%ad" --date=short | 全量聚合</p>
      </div>
    </div>
    <div class="container footer-bar">
      <span class="mono">12,293 commits · 65 days · 2026-06-10 → 2026-08-13</span>
      <span class="dim">DeepSeek Harness 开发历程可视化</span>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--line-soft);
  background: var(--bg-soft);
  margin-top: 40px;
}
.footer-inner {
  display: grid;
  grid-template-columns: 1.4fr 1.2fr 1fr;
  gap: 30px;
  padding-top: 34px;
  padding-bottom: 26px;
}
.footer-title {
  font-family: var(--font-m);
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--ink-4);
  text-transform: uppercase;
  margin-bottom: 8px;
}
.footer p {
  font-size: 12.5px;
  color: var(--ink-3);
  line-height: 1.8;
}
.footer .small {
  font-size: 11.5px;
}
.footer .dim {
  color: var(--ink-4);
}
.footer-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  padding-bottom: 22px;
  border-top: 1px solid var(--line-soft);
  font-size: 12px;
  color: var(--ink-4);
  flex-wrap: wrap;
  gap: 8px;
}
@media (max-width: 800px) {
  .footer-inner {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
</style>
