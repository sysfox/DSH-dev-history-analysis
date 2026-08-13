<script setup>
import { computed } from 'vue'
import PageHero from '../components/PageHero.vue'
import BaseChart from '../components/BaseChart.vue'
import DataTable from '../components/DataTable.vue'
import MermaidBlock from '../components/MermaidBlock.vue'
import HashChip from '../components/HashChip.vue'
import { doc } from '../lib/data'
import { inlineMd } from '../lib/util'

const gov = doc.tables.find((t) => JSON.stringify(t.headers) === JSON.stringify(['阶段', '日期', '关键提交', '状态载体', '治理动作']))
const adr = doc.tables.find((t) => t.path.includes('ADR 0001–0017'))
const rfc = doc.tables.find((t) => t.path.includes('RFC 001–015'))
const gates = doc.tables.find((t) => t.path.includes('38 个候选叶门禁'))
const trace = doc.tables.find((t) => t.path.includes('叶门禁的决策溯源'))
const archive = doc.tables.find((t) => t.path.includes('归档规则'))
const noteStats = doc.tables.find((t) => t.line === 2253)
const classes = doc.tables.find((t) => t.line === 2268)
const lifecycle = doc.tables.find((t) => t.line === 2342)

const archMermaid = doc.mermaid.filter((m) => m.path.includes('架构决策与治理'))

// Agent Note 分布环形图（现状统计表小计列）
const noteDonut = computed(() => {
  const rows = (noteStats?.rows || []).filter((r) => !String(r[0]).includes('合计'))
  return rows.map((r) => ({
    name: String(r[0]).replace('/', ''),
    value: Number(r[7]) || 0,
  }))
})

const noteOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item', formatter: '{b}：{c}（{d}%）', backgroundColor: 'rgba(13,19,38,.97)', borderColor: '#23325a', textStyle: { color: '#e9edf9' } },
  legend: { bottom: 0, textStyle: { color: '#7f8bb0', fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
  color: ['#34d399', '#7f8bb0', '#f472b6', '#5b6790'],
  series: [
    {
      type: 'pie',
      radius: ['46%', '70%'],
      center: ['50%', '44%'],
      label: { color: '#b8c1da', fontSize: 11, formatter: '{b}\n{c}' },
      labelLine: { lineStyle: { color: '#23325a' } },
      data: noteDonut.value,
    },
  ],
}))

// 深潜卡片
const deepDives = [
  { title: '深潜一 · 微内核事件分类', tag: 'ADR 0002', text: 'Cordis 事件分发（waterfall / serial / parallel / emit）作为唯一扩展点，事件分类体系奠定微内核边界。' },
  { title: '深潜二 · Vendor Cordis 为源码', tag: 'ADR 0001', text: '底层框架以源码形式 vendor 进仓库（6/11，72688a3888）：可审计、可修改、可重新发布，而非黑盒依赖。' },
  { title: '深潜三 · 事件溯源 session', tag: 'ADR 0003', text: '会话是追加式 SessionEvent 日志，「日志即状态」；模型可见的状态必须能从日志重建。' },
  { title: '深潜四 · 能力缝三件套', tag: 'ADR 0009', text: 'Service Definition / Provider / Consumer 是可替换能力的最小完整单元，可替换性从第一天就是结构属性。' },
  { title: '深潜五 · 双 LLM 适配器', tag: 'ADR 0010', text: '第一天就上 deepseek 与 pi-ai 两个真实适配器验证「中性」词汇，避免单一实现把自家怪癖写进契约。' },
  { title: '深潜六 · 参数校验 + 错误分类', tag: 'RFC 005 · ADR 0011+0015', text: '模型边界做参数校验与统一错误分类，让模型可见的错误成为契约而非事故。' },
  { title: '深潜七 · dev invariants 断言', tag: 'RFC 005 pt3 · RFC 008 · ADR 0012', text: '运行时 invariant 断言把「注册即副作用、事件即真相」变成可检查的机器约束。' },
  { title: '深潜八 · Session 持久化抽象', tag: 'RFC 009 · ADR 0016', text: '持久化升为抽象服务：jsonl / sqlite 双后端，turn-enclosure 不变式守护轮次封闭。' },
  { title: '深潜九 · Code Mode', tag: 'RFC 012', text: '把「代码模式」做成显式状态而非隐式行为，减少模型对环境的猜测。' },
  { title: '深潜十 · 模型可见即记录', tag: '2026-07-05', text: '任何到达模型请求的输入都必须记录在会话日志中 —— 会话成为模型的完整记忆面。' },
  { title: '深潜十一 · Package-owned invariant', tag: '2026-07-19', text: 'invariant 服务由各包自持（每包 ./invariant companion），质量责任下放到能力边界。' },
  { title: '深潜十二 · 编译器面分离', tag: '2026-07-22', text: '把「编译器面」从运行时分离，类型契约由生成器产出（Typert），双面生成同一套契约。' },
]
</script>

<template>
  <div class="page">
    <div class="container">
      <PageHero
        kicker="第六章 · 架构决策与治理"
        title="架构决策与治理"
        lead="从 6/11 的 ADR/RFC 双树，到 7/19 的 Agent Note 强制制度：因为「agent 遵守机器强制 gate 远比散文约定可靠」，治理机制一路向可机器检查收敛。"
      />

      <!-- 治理弧线 -->
      <section>
        <div class="section-title">
          <h2>治理弧线的六个阶段</h2>
          <span class="en">GOVERNANCE ARC</span>
        </div>
        <div v-if="gov" class="gov-steps">
          <div v-for="(r, i) in gov.rows" :key="i" class="gov-step card">
            <div class="gov-idx mono">{{ String(i + 1).padStart(2, '0') }}</div>
            <div class="gov-date mono">{{ r[1] }}</div>
            <h3>{{ r[0] }}</h3>
            <p class="gov-action">{{ r[4] }}</p>
            <div class="gov-meta">
              <span class="mono dim">载体：{{ r[3] }}</span>
              <HashChip v-if="r[2]" :hash="r[2]" />
            </div>
          </div>
        </div>
        <div class="card" style="margin-top: 16px">
          <div class="mmd-cap">
            <span class="mono">治理演进弧线（mermaid timeline）</span>
            <span class="mono dim">原文 L2042</span>
          </div>
          <MermaidBlock :code="archMermaid.find((m) => m.line === 2042)?.code || ''" />
        </div>
      </section>

      <!-- Agent Note 体系 -->
      <section class="grid-2">
        <div>
          <div class="section-title">
            <h2>Agent Note 分布</h2>
            <span class="en">NOTES · 现状统计（8/13 实测）</span>
          </div>
          <div class="chart-box">
            <div class="chart-title">
              <span>按 lifecycle 小计</span>
              <span class="note">全库口径 1,372 条；本表口径 1,366（8/13 目录实测）</span>
            </div>
            <BaseChart :option="noteOption" height="300px" />
          </div>
        </div>
        <div>
          <div class="section-title">
            <h2>六个 class 闭集</h2>
            <span class="en">CLASSES · 路径编码</span>
          </div>
          <div class="class-grid">
            <div v-for="(c, i) in (classes?.rows || [])" :key="i" class="card class-card">
              <code class="mono">{{ c[0] }}</code>
              <p>{{ c[1] }}</p>
              <span class="mono q">{{ c[2] }}</span>
            </div>
          </div>
          <div class="section-title">
            <h2>lifecycle 流转</h2>
            <span class="en">LIFECYCLE</span>
          </div>
          <DataTable
            v-if="lifecycle"
            :headers="['lifecycle', '强制章节', '允许的时态', '标题禁忌']"
            :rows="lifecycle.rows"
            :mono-cols="[0]"
            :sortable="false"
          />
        </div>
      </section>

      <!-- 归档规则 -->
      <section>
        <div class="section-title">
          <h2>归档规则</h2>
          <span class="en">ARCHIVE · 冻结与 SHA-256 封印</span>
        </div>
        <DataTable
          v-if="archive"
          :headers="archive.headers"
          :rows="archive.rows.map((r) => [r[0], inlineMd(r[1])])"
          :sortable="false"
          :mono-cols="[0]"
        />
      </section>

      <!-- ADR / RFC -->
      <section class="grid-2">
        <div>
          <div class="section-title">
            <h2>ADR 0001–0017</h2>
            <span class="en">ARCHITECTURE DECISION RECORDS</span>
          </div>
          <DataTable
            v-if="adr"
            :headers="adr.headers"
            :rows="adr.rows"
            :mono-cols="[0, 3]"
            max-height="440px"
          />
        </div>
        <div>
          <div class="section-title">
            <h2>RFC 001–015</h2>
            <span class="en">REQUESTS FOR COMMENTS</span>
          </div>
          <DataTable
            v-if="rfc"
            :headers="rfc.headers"
            :rows="rfc.rows"
            :mono-cols="[0, 4]"
            max-height="440px"
          />
        </div>
      </section>

      <!-- 深潜 -->
      <section>
        <div class="section-title">
          <h2>十二个深潜</h2>
          <span class="en">DEEP DIVES · 核心决策清单</span>
        </div>
        <div class="deep-grid">
          <div v-for="(d, i) in deepDives" :key="i" class="card deep-card">
            <div class="deep-head">
              <span class="deep-idx mono">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="deep-tag mono">{{ d.tag }}</span>
            </div>
            <h3>{{ d.title }}</h3>
            <p>{{ d.text }}</p>
          </div>
        </div>
      </section>

      <!-- 门禁 -->
      <section>
        <div class="section-title">
          <h2>38 个候选叶门禁</h2>
          <span class="en">GATES · doc-sync 家族</span>
        </div>
        <DataTable
          v-if="gates"
          :headers="gates.headers"
          :rows="gates.rows"
          :mono-cols="[0, 2]"
          max-height="480px"
          caption="run-gates.ts 的叶 gate 集合；本地廉价检查走 git hooks，穷尽集走 CI 与调度器"
        />
        <div class="section-title">
          <h2>叶门禁的决策溯源</h2>
          <span class="en">GATE → NOTE 溯源</span>
        </div>
        <DataTable
          v-if="trace"
          :headers="trace.headers"
          :rows="trace.rows"
          :mono-cols="[0, 2]"
          max-height="420px"
        />
      </section>

      <!-- 治理自动化 mermaid -->
      <section>
        <div class="section-title">
          <h2>治理自动化图解</h2>
          <span class="en">AUTOMATION DIAGRAMS</span>
        </div>
        <div class="mmd-list">
          <div v-for="m in archMermaid.filter((x) => x.line !== 2042)" :key="m.line" class="card">
            <div class="mmd-cap">
              <span class="mono">{{ m.path.split(' / ').pop() }}</span>
              <span class="mono dim">L{{ m.line }}</span>
            </div>
            <MermaidBlock :code="m.code" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 22px;
}
.gov-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.gov-step {
  position: relative;
  padding: 18px 18px 14px;
}
.gov-idx {
  position: absolute;
  top: 14px;
  right: 16px;
  font-size: 1.4rem;
  font-weight: 700;
  color: rgba(77, 107, 254, 0.25);
}
.gov-date {
  font-size: 11.5px;
  color: var(--cyan);
}
.gov-step h3 {
  margin: 6px 0 6px;
  font-size: 1.05rem;
}
.gov-action {
  font-size: 12.5px;
  color: var(--ink-3);
  line-height: 1.7;
}
.gov-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.gov-meta .dim {
  font-size: 10.5px;
  color: var(--ink-4);
}
.mmd-cap {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--ink-3);
  margin-bottom: 2px;
}
.mmd-cap .dim {
  color: var(--ink-4);
}
.mmd-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.class-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 8px;
}
.class-card {
  padding: 14px 16px;
}
.class-card code {
  color: var(--cyan);
  font-size: 12.5px;
}
.class-card p {
  font-size: 12.5px;
  color: var(--ink-2);
  margin: 6px 0 4px;
  line-height: 1.7;
}
.class-card .q {
  font-size: 10.5px;
  color: var(--ink-4);
}
.deep-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.deep-card {
  padding: 16px 18px;
}
.deep-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.deep-idx {
  color: var(--ink-4);
  font-size: 12px;
}
.deep-tag {
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--violet);
}
.deep-card h3 {
  font-size: 1rem;
  margin-bottom: 6px;
}
.deep-card p {
  font-size: 12.5px;
  color: var(--ink-3);
  line-height: 1.75;
}
@media (max-width: 960px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
  .gov-steps,
  .deep-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 620px) {
  .gov-steps,
  .deep-grid,
  .class-grid {
    grid-template-columns: 1fr;
  }
}
</style>
