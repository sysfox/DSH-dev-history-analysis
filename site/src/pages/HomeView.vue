<script setup>
import { ref } from 'vue'
import Skyline from '../components/Skyline.vue'
import StatCard from '../components/StatCard.vue'
import HashChip from '../components/HashChip.vue'
import { doc, eventsByDate, TOTAL } from '../lib/data'
import { numFmt, hashTokens } from '../lib/util'

const daily = doc.daily
const selected = ref('2026-07-30')

const dayEvents = (date) => eventsByDate[date] || []
const dayCount = (date) => daily.find((d) => d.date === date)?.commits ?? 0

const chapters = [
  {
    to: '/timeline', n: '01', title: '时间线与阶段划分', fig: '65 天 · 5 阶段', figTone: 'ph4',
    desc: '逐周逐日提交密度、五个阶段的诞生与收官、单日 887 的峰值日，以及最早的栈式拆分链。',
  },
  {
    to: '/packages', n: '02', title: '包与能力演进', fig: '219 包 · 49 组', figTone: 'ph2',
    desc: '从「一切皆插件」的微内核到 12 个领域、49 个包组、三次结构性重组，能力以「缝」为单位扩张。',
  },
  {
    to: '/architecture', n: '03', title: '架构决策与治理', fig: '1,372 条 Agent Note', figTone: 'ph3',
    desc: 'ADR/RFC 双树 → Agent Note 体系：38 个门禁、运行时 invariant、非平凡变更必须带 note。',
  },
  {
    to: '/infra', n: '04', title: '工程基础设施', fig: '15 个 workflow', figTone: 'cyan',
    desc: 'pnpm 换轨、三阶段构建、15 个 CI workflow、9 个 vendored 包与三条发布序列。',
  },
  {
    to: '/docs', n: '05', title: '文档、示例与发布', fig: '215 md · 1,078 双语', figTone: 'ph5',
    desc: '「文档即产品」：docs/ 双语知识库、website 投影、示例即测试、0.0.1-rc.1 → 0.1.0-rc.5。',
  },
  {
    to: '/contributors', n: '06', title: '贡献者与团队演化', fig: '40+ 作者', figTone: 'pink',
    desc: '头号贡献者 42.4% 的份额从「单核驱动」走向「多核并行」，8 月换帅与 agent-first 底色。',
  },
]

const phases = [
  { id: 1, name: '冷启动与微内核', range: '6/10 – 6/15', commits: 101, pct: '0.8%', width: 0.8, color: 'var(--ph1)', note: '第一天就把地基立到最严：monorepo、vendored 微内核、100% 覆盖率与全套质量门禁在 6/11 一天内完成。' },
  { id: 2, name: '能力扩张', range: '6/16 – 6/30', commits: 480, pct: '3.9%', width: 3.9, color: 'var(--ph2)', note: '迁 pnpm、ACP bridge、模块化重组，能力面开始铺开；W26 是全程唯一低谷周。' },
  { id: 3, name: '子代理·工作流·沙箱', range: '7/1 – 7/15', commits: 2079, pct: '16.9%', width: 16.9, color: 'var(--ph3)', note: '能力井喷：workflow、MCP、沙箱、审批、Code Mode；7/14 单日 528 首破五百。' },
  { id: 4, name: 'Web GUI 与宿主', range: '7/16 – 7/31', commits: 6194, pct: '50.4%', width: 50.4, color: 'var(--ph4)', note: 'GUI 骨架 7/19 落位后两周贡献全程一半提交；7/30 单日 887 为全程峰值，包重组三连收官。' },
  { id: 5, name: '发布工程与公测', range: '8/1 – 8/13', commits: 3439, pct: '28.0%', width: 28.0, color: 'var(--ph5)', note: '命名契约（3,281 文件）→ vendor rescope → 9 个 release 提交 → 8/13 全家族公开到 npm。' },
]

const totalCommits = TOTAL.commits
</script>

<template>
  <div class="page home">
    <div class="container">
      <!-- ================= Hero ================= -->
      <section class="hero">
        <div class="eyebrow">DEVELOPMENT-HISTORY.md → INTERACTIVE</div>
        <h1 class="hero-title">
          65 天，<span class="accent">{{ numFmt(totalCommits) }}</span> 次提交
        </h1>
        <p class="hero-lead">
          DeepSeek Harness 从空仓库到 npm 公开的完整弧线。本网站将 5,567 行的开发历程分析
          —— git 实测的提交密度、包结构、架构决策、工程基建与团队演化 —— 变成可交互的图表与时间线。
        </p>

        <div class="hero-sky card">
          <div class="hero-sky-head">
            <span class="mono title">每日提交数 · 2026-06-10 → 2026-08-13</span>
            <span class="mono note">点击任意一天查看当日事件</span>
          </div>
          <Skyline :days="daily" :height="210" :selected="selected" @select="(d) => (selected = d)" />
          <div class="day-panel">
            <div class="day-date mono">{{ selected }}</div>
            <div class="day-count num">{{ dayCount(selected) }} 次提交</div>
            <ul v-if="dayEvents(selected).length" class="day-events">
              <li v-for="(e, i) in dayEvents(selected)" :key="i">
                <span class="day-event">{{ e.event }}</span>
                <span v-if="hashTokens(e.source).length" class="day-src">
                  <HashChip v-for="(h, hi) in hashTokens(e.source)" :key="hi" :hash="h" />
                </span>
              </li>
            </ul>
            <div v-else class="day-empty">当日无关键事件记录，但提交仍在发生。</div>
          </div>
        </div>

        <div class="stat-strip">
          <StatCard value="12,293" label="总提交" sub="master 全历史" />
          <StatCard value="65" label="开发天数" sub="2026-06-10 → 08-13" tone="ph2" />
          <StatCard value="5,610" label="合并提交" sub="占比 45.6%" tone="pink" />
          <StatCard value="≈2,500" label="PR" sub="编号至 #2521" />
          <StatCard value="219" label="workspace 包" sub="44+ 包组" tone="ph5" />
          <StatCard value="887" label="日提交峰值" sub="2026-07-30" tone="ph4" />
        </div>
      </section>

      <!-- ================= 章节地图 ================= -->
      <section class="map-section">
        <div class="section-title">
          <h2>章节地图</h2>
          <span class="en">CHAPTER MAP · 从数字到故事</span>
        </div>
        <div class="chapter-grid">
          <router-link v-for="c in chapters" :key="c.n" :to="c.to" class="chapter-card">
            <span class="chapter-no mono">{{ c.n }}</span>
            <h3>{{ c.title }}</h3>
            <div class="chapter-fig num" :style="{ color: `var(--${c.figTone})` }">{{ c.fig }}</div>
            <p>{{ c.desc }}</p>
            <span class="chapter-go mono">进入 →</span>
          </router-link>
        </div>
      </section>

      <!-- ================= 五阶段 ================= -->
      <section>
        <div class="section-title">
          <h2>五个阶段，一条弧线</h2>
          <span class="en">PHASES · 提交占比</span>
        </div>
        <div class="phase-stack">
          <div v-for="p in phases" :key="p.id" class="phase-row" :style="{ '--pc': p.color }">
            <div class="phase-head">
              <span class="phase-name">{{ p.id }} · {{ p.name }}</span>
              <span class="phase-range mono">{{ p.range }}</span>
              <span class="phase-num num">{{ numFmt(p.commits) }}</span>
              <span class="phase-pct mono">{{ p.pct }}</span>
            </div>
            <div class="phase-track">
              <i :style="{ width: p.width + '%' }"></i>
            </div>
            <p class="phase-note">{{ p.note }}</p>
          </div>
        </div>
      </section>

      <!-- ================= 数据口径 ================= -->
      <section class="sources">
        <div class="section-title">
          <h2>数据口径</h2>
          <span class="en">METHODOLOGY</span>
        </div>
        <div class="card">
          <p>
            所有提交数、日期均为 <strong>author date（提交日期）</strong>，分析范围为 master 全历史，
            HEAD = <HashChip hash="47f943859b" />（2026-08-13 19:38，即 PR #2519 的合并提交）。
            总提交 12,293 = 6 月 581 + 7 月 8,273 + 8 月 3,439 = 五阶段 101 + 480 + 2,079 + 6,194 + 3,439，
            三路对账一致；合并提交 5,610（45.6%），仓库无任何 tag，PR 编号至 #2521。所有 commit hash 均可
            <code class="mono">git show &lt;hash&gt;</code> 复核。
          </p>
          <p class="method-meta mono">
            git log 全量抽取 → 按周/月/日聚合 → 交叉校验 → 本主文档 → 本可视化站点
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.hero {
  padding-top: 26px;
}
.hero-title {
  font-size: clamp(2.3rem, 6vw, 3.7rem);
  font-weight: 700;
  margin-top: 14px;
  letter-spacing: 0.005em;
}
.hero-title .accent {
  color: var(--blue);
  text-shadow: 0 0 34px rgba(77, 107, 254, 0.45);
}
.hero-lead {
  max-width: 760px;
  margin-top: 16px;
  color: var(--ink-2);
  font-size: 15.5px;
  line-height: 1.9;
}
.hero-sky {
  margin-top: 30px;
  padding: 16px 18px 14px;
}
.hero-sky-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.hero-sky-head .title {
  font-size: 11.5px;
  letter-spacing: 0.14em;
  color: var(--ink-4);
  text-transform: uppercase;
}
.hero-sky-head .note {
  font-size: 11px;
  color: var(--ink-4);
}
.day-panel {
  margin-top: 14px;
  border-top: 1px dashed var(--line);
  padding-top: 12px;
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 8px 18px;
  align-items: baseline;
}
.day-date {
  color: var(--cyan);
  font-size: 13px;
}
.day-count {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ink);
}
.day-events {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.day-event {
  color: var(--ink-2);
  font-size: 13px;
  margin-right: 10px;
}
.day-src {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 5px;
  vertical-align: middle;
}
.day-empty {
  color: var(--ink-4);
  font-size: 13px;
}
.stat-strip {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-top: 22px;
}

.map-section {
  margin-top: 30px;
}
.chapter-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.chapter-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 20px 16px;
  border: 1px solid var(--line-soft);
  border-radius: var(--r);
  background: linear-gradient(180deg, var(--surface), var(--bg-soft));
  color: var(--ink);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}
.chapter-card:hover {
  text-decoration: none;
  transform: translateY(-3px);
  border-color: var(--blue);
  box-shadow: var(--shadow);
}
.chapter-no {
  font-size: 11px;
  letter-spacing: 0.22em;
  color: var(--ink-4);
}
.chapter-card h3 {
  font-size: 1.18rem;
}
.chapter-fig {
  font-size: 1.05rem;
  font-weight: 600;
}
.chapter-card p {
  font-size: 13px;
  color: var(--ink-3);
  line-height: 1.75;
  flex: 1;
}
.chapter-go {
  font-size: 11.5px;
  letter-spacing: 0.18em;
  color: var(--ink-4);
}

.phase-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.phase-head {
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
}
.phase-name {
  font-family: var(--font-d);
  font-size: 1.02rem;
  font-weight: 600;
  color: var(--ink);
}
.phase-range {
  font-size: 11.5px;
  color: var(--ink-4);
}
.phase-num {
  font-weight: 700;
  color: var(--ink);
}
.phase-pct {
  font-size: 11.5px;
  color: var(--ink-4);
}
.phase-track {
  height: 10px;
  border-radius: 6px;
  background: var(--surface-2);
  overflow: hidden;
  margin-top: 6px;
}
.phase-track i {
  display: block;
  height: 100%;
  background: var(--pc);
  border-radius: 6px;
  min-width: 4px;
}
.phase-note {
  font-size: 13px;
  color: var(--ink-3);
  margin-top: 6px;
  line-height: 1.75;
}

.sources {
  margin-top: 20px;
}
.method-meta {
  margin-top: 12px;
  font-size: 11.5px;
  color: var(--ink-4);
  letter-spacing: 0.08em;
}

@media (max-width: 980px) {
  .stat-strip {
    grid-template-columns: repeat(3, 1fr);
  }
  .chapter-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .day-panel {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
@media (max-width: 620px) {
  .stat-strip,
  .chapter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
