<script setup>
import { ref, computed } from 'vue'
import PageHero from '../components/PageHero.vue'
import BaseChart from '../components/BaseChart.vue'
import DataTable from '../components/DataTable.vue'
import MermaidBlock from '../components/MermaidBlock.vue'
import HashChip from '../components/HashChip.vue'
import PhaseBadge from '../components/PhaseBadge.vue'
import {
  doc, weekly, monthly, phases, phaseCompare, prVelocity, topDays, keyEvents,
  eventsByDate, PHASES, PHASE_HEX,
} from '../lib/data'
import { escapeHtml, hashTokens } from '../lib/util'

const daily = doc.daily
const mermaid = doc.mermaid
const selected = ref('2026-07-30')
const phaseFilter = ref(0) // 0 = 全部

// ---------- 图表公共样式 ----------
const axisBase = {
  axisLine: { lineStyle: { color: '#23325a' } },
  axisLabel: { color: '#7f8bb0', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 },
  axisTick: { show: false },
}
const splitBase = { splitLine: { lineStyle: { color: '#18223f' } } }
const tooltipBase = {
  backgroundColor: 'rgba(13,19,38,.96)',
  borderColor: '#23325a',
  textStyle: { color: '#e9edf9', fontSize: 12 },
  confine: true,
}

// ---------- 1. 每日提交柱状图 ----------
const dayIdx = Object.fromEntries(daily.map((d, i) => [d.date, i]))
const phaseAreas = PHASES.map((p) => {
  const s = dayIdx[p.from]
  const e = dayIdx[p.to]
  return [
    { xAxis: s - 0.5, itemStyle: { color: PHASE_HEX[p.id] + '1a' } },
    { xAxis: e + 0.5 },
  ]
})

const dayPhase = (() => {
  const map = {}
  PHASES.forEach((p) => {
    daily.forEach((d) => {
      if (d.date >= p.from && d.date <= p.to) map[d.date] = p.id
    })
  })
  return map
})()

const dailyOption = computed(() => ({
  backgroundColor: 'transparent',
  grid: { left: 48, right: 14, top: 16, bottom: 26 },
  tooltip: {
    ...tooltipBase,
    trigger: 'axis',
    formatter: (ps) => {
      const d = daily[ps[0].dataIndex]
      const evs = eventsByDate[d.date] || []
      let html = `<div style="font-weight:700;color:#e9edf9;margin-bottom:4px">${d.date} · <span style="color:#38bdf8">${d.commits}</span> 次提交</div>`
      if (evs.length) html += evs.slice(0, 3).map((e) => `<div style="font-size:11.5px;color:#b8c1da">· ${escapeHtml(e.event)}</div>`).join('')
      return html
    },
  },
  xAxis: { type: 'category', data: daily.map((d) => d.date.slice(5)), axisLine: { show: false }, axisLabel: { show: false } },
  yAxis: { type: 'value', ...axisBase, ...splitBase, name: '提交', nameTextStyle: { color: '#5b6790', fontSize: 10 } },
  series: [
    {
      type: 'bar',
      data: daily.map((d) => ({ value: d.commits, itemStyle: { color: PHASE_HEX[dayPhase[d.date]] } })),
      barWidth: '72%',
      markArea: { silent: true, data: phaseAreas },
    },
  ],
}))

function onDailyClick(p) {
  const d = daily[p.dataIndex]
  if (d) selected.value = d.date
}

// ---------- 2. 逐周柱 + 累计线 ----------
const weeklyOption = computed(() => {
  let acc = 0
  const cum = weekly.map((w) => (acc += w.commits))
  return {
    backgroundColor: 'transparent',
    grid: { left: 52, right: 52, top: 20, bottom: 28 },
    tooltip: { ...tooltipBase, trigger: 'axis' },
    legend: { data: ['每周提交', '累计'], textStyle: { color: '#7f8bb0', fontSize: 11 }, top: 0, right: 0 },
    xAxis: { type: 'category', data: weekly.map((w) => w.week.replace('2026-', '')), ...axisBase },
    yAxis: [
      { type: 'value', ...axisBase, ...splitBase, name: '每周', nameTextStyle: { color: '#5b6790', fontSize: 10 } },
      { type: 'value', ...axisBase, splitLine: { show: false }, name: '累计', nameTextStyle: { color: '#5b6790', fontSize: 10 } },
    ],
    series: [
      {
        name: '每周提交',
        type: 'bar',
        data: weekly.map((w) => w.commits),
        itemStyle: { color: '#4d6bfe', borderRadius: [4, 4, 0, 0] },
        barWidth: '52%',
      },
      {
        name: '累计',
        type: 'line',
        yAxisIndex: 1,
        data: cum,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#38bdf8', width: 2 },
        itemStyle: { color: '#38bdf8' },
        areaStyle: { color: 'rgba(56,189,248,.08)' },
      },
    ],
  }
})

// ---------- 3. 月度环形 ----------
const monthlyOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { ...tooltipBase, trigger: 'item', formatter: '{b}：{c} 提交（{d}%）' },
  legend: { bottom: 0, textStyle: { color: '#7f8bb0', fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
  color: ['#4d6bfe', '#38bdf8', '#a78bfa'],
  series: [
    {
      type: 'pie',
      radius: ['48%', '72%'],
      center: ['50%', '44%'],
      label: { color: '#b8c1da', fontSize: 11, formatter: '{b}\n{c}' },
      labelLine: { lineStyle: { color: '#23325a' } },
      data: monthly.map((m) => ({ name: m.month, value: m.commits })),
      emphasis: { scaleSize: 6 },
    },
  ],
}))

// ---------- 4. 提交类型饼图 ----------
const typeOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { ...tooltipBase, trigger: 'item', formatter: '{b}：{c}（{d}%）' },
  legend: { type: 'scroll', bottom: 0, textStyle: { color: '#7f8bb0', fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
  color: ['#f472b6', '#f5a524', '#38bdf8', '#34d399', '#a78bfa', '#7f8bb0', '#5b6790', '#2a3a63'],
  series: [
    {
      type: 'pie',
      radius: '64%',
      center: ['50%', '44%'],
      label: { color: '#b8c1da', fontSize: 11, formatter: '{b} {d}%' },
      labelLine: { lineStyle: { color: '#23325a' } },
      data: [
        { name: 'merge', value: 5609 },
        { name: 'fix', value: 2252 },
        { name: 'docs', value: 1356 },
        { name: 'test', value: 950 },
        { name: 'feat', value: 693 },
        { name: 'refactor', value: 454 },
        { name: 'ci', value: 184 },
        { name: 'other', value: 795 },
      ],
    },
  ],
}))

// ---------- 5. PR 编号流速 ----------
const velocityOption = computed(() => ({
  backgroundColor: 'transparent',
  grid: { left: 44, right: 40, top: 24, bottom: 30 },
  tooltip: { ...tooltipBase, trigger: 'axis' },
  xAxis: { type: 'category', data: prVelocity.map((v) => `阶段${v.phase}`), ...axisBase },
  yAxis: { type: 'value', ...axisBase, ...splitBase, name: '日均编号', nameTextStyle: { color: '#5b6790', fontSize: 10 } },
  series: [
    {
      type: 'bar',
      data: prVelocity.map((v, i) => ({
        value: v.rate,
        itemStyle: { color: PHASE_HEX[i + 1], borderRadius: [4, 4, 0, 0] },
      })),
      barWidth: '48%',
      label: { show: true, position: 'top', color: '#b8c1da', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', formatter: '{c}' },
    },
  ],
}))

// ---------- 6. 阶段合并/非合并堆叠 ----------
const mergeSplitOption = computed(() => ({
  backgroundColor: 'transparent',
  grid: { left: 52, right: 30, top: 24, bottom: 30 },
  tooltip: { ...tooltipBase, trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { data: ['合并提交', '非合并提交'], textStyle: { color: '#7f8bb0', fontSize: 11 }, top: 0, right: 0, itemWidth: 10, itemHeight: 10 },
  xAxis: { type: 'category', data: phaseCompare.filter((p) => p.phase !== '合计').map((p) => `阶段${p.phase}`), ...axisBase },
  yAxis: { type: 'value', ...axisBase, ...splitBase, name: '提交', nameTextStyle: { color: '#5b6790', fontSize: 10 } },
  series: [
    {
      name: '合并提交',
      type: 'bar',
      stack: 't',
      data: phaseCompare.filter((p) => p.phase !== '合计').map((p) => p.merges),
      itemStyle: { color: '#f472b6' },
    },
    {
      name: '非合并提交',
      type: 'bar',
      stack: 't',
      data: phaseCompare.filter((p) => p.phase !== '合计').map((p) => p.commits - p.merges),
      itemStyle: { color: '#2a3a63' },
    },
  ],
}))

// ---------- 关键日期时间线 ----------
const filteredEvents = computed(() =>
  phaseFilter.value === 0
    ? keyEvents
    : keyEvents.filter((e) => {
        const ph = PHASES[phaseFilter.value - 1]
        return e.date >= ph.from && e.date <= ph.to
      })
)

// 包组诞生时间表
const birthRows = computed(() => {
  const t = doc.tables.find((x) => x.path.includes('包组诞生时间表'))
  return t ? t.rows : []
})

// 65 天逐日表
const dailyRows = computed(() => {
  const rows = []
  for (let i = 0; i < daily.length; i += 5) {
    rows.push(
      daily.slice(i, i + 5).flatMap((d) => [d.date.slice(5), d.commits])
    )
  }
  return rows
})

// mermaid 图（按章节过滤）
const timelineMermaid = mermaid.filter((m) => m.path.includes('可视化：mermaid 图'))
</script>

<template>
  <div class="page">
    <div class="container">
      <PageHero
        kicker="第四章 · 时间线与阶段划分"
        title="时间线"
        lead="65 天里提交密度的起伏就是项目的呼吸：首周 67 次提交搭出微内核，W31 单周 3,542 冲上峰值，7/30 单日 887 定格。五个阶段、十周节奏、关键日期与最早的栈式拆分链，全部来自 git 实测。"
      />

      <!-- 每日柱状图 -->
      <section>
        <div class="section-title">
          <h2>每日提交：65 天天际线</h2>
          <span class="en">DAILY · 点击柱子查看当日事件</span>
        </div>
        <div class="chart-box">
          <div class="chart-title"><span>提交数 / 日</span><span class="note">背景色块为五个阶段</span></div>
          <BaseChart :option="dailyOption" height="340px" @click="onDailyClick" />
        </div>
        <div class="day-detail card">
          <div class="dd-head">
            <span class="dd-date mono">{{ selected }}</span>
            <span class="dd-count num">{{ daily.find((d) => d.date === selected)?.commits ?? 0 }} 次提交</span>
            <PhaseBadge v-if="dayPhase[selected]" :phase="dayPhase[selected]" />
          </div>
          <ul v-if="(eventsByDate[selected] || []).length" class="dd-list">
            <li v-for="(e, i) in eventsByDate[selected]" :key="i">
              <span class="dd-event">{{ e.event }}</span>
              <HashChip v-if="isHash(e.source)" :hash="e.source" />
            </li>
          </ul>
          <p v-else class="dd-empty">当日无关键事件记录。</p>
        </div>
      </section>

      <!-- 逐周 + 月度 -->
      <section class="grid-2">
        <div>
          <div class="section-title">
            <h2>逐周节奏</h2>
            <span class="en">WEEKLY · 10 周</span>
          </div>
          <div class="chart-box">
            <BaseChart :option="weeklyOption" height="300px" />
          </div>
        </div>
        <div>
          <div class="section-title">
            <h2>月度分布</h2>
            <span class="en">MONTHLY</span>
          </div>
          <div class="chart-box">
            <BaseChart :option="monthlyOption" height="300px" />
          </div>
        </div>
      </section>

      <!-- 阶段对比 + PR 流速 -->
      <section class="grid-2">
        <div>
          <div class="section-title">
            <h2>阶段提交构成</h2>
            <span class="en">PHASE · 合并 / 非合并</span>
          </div>
          <div class="chart-box">
            <BaseChart :option="mergeSplitOption" height="300px" />
          </div>
        </div>
        <div>
          <div class="section-title">
            <h2>PR 编号流速</h2>
            <span class="en">PR RATE · 日均</span>
          </div>
          <div class="chart-box">
            <BaseChart :option="velocityOption" height="300px" />
          </div>
        </div>
      </section>

      <!-- 提交类型 -->
      <section>
        <div class="section-title">
          <h2>提交类型分布</h2>
          <span class="en">CONVENTIONAL COMMITS</span>
        </div>
        <div class="chart-box">
          <div class="chart-title">
            <span>12,293 次提交，按 subject 前缀统计</span>
            <span class="note">docs + test（2,306）是 feat（693）的 3 倍以上 —— 「文档与测试随代码同行」</span>
          </div>
          <BaseChart :option="typeOption" height="380px" />
        </div>
      </section>

      <!-- 阶段总览表 -->
      <section>
        <div class="section-title">
          <h2>阶段总览对比</h2>
          <span class="en">PHASE OVERVIEW</span>
        </div>
        <DataTable
          :headers="['阶段', '提交数', '占比', '合并提交', '合并占比', '日峰值', 'PR 区间']"
          :rows="phaseCompare.map((p) => [p.phase, p.commits, p.pct, p.merges, p.mergePct, p.peak, p.prRange])"
          :num-cols="[1, 3]"
          :mono-cols="[5, 6]"
          :footer-row="true"
        />
      </section>

      <!-- 单日 Top-8 -->
      <section>
        <div class="section-title">
          <h2>单日提交 Top-8</h2>
          <span class="en">TOP DAYS</span>
        </div>
        <div class="topday-grid">
          <div v-for="t in topDays" :key="t.date" class="topday card" :class="{ hot: t.rank === '1' }">
            <span class="topday-rank mono">{{ t.rank }}</span>
            <span class="topday-date mono">{{ t.date.slice(5) }}</span>
            <span class="topday-num num">{{ t.commits }}</span>
            <span class="topday-ev">{{ t.event }}</span>
          </div>
        </div>
      </section>

      <!-- 关键日期时间线 -->
      <section>
        <div class="section-title">
          <h2>关键日期时间线</h2>
          <span class="en">KEY DATES · 65 天中的转折点</span>
        </div>
        <div class="filter-row">
          <button class="chip filter-chip" :class="{ on: phaseFilter === 0 }" @click="phaseFilter = 0">全部</button>
          <button
            v-for="p in PHASES"
            :key="p.id"
            class="chip filter-chip"
            :class="{ on: phaseFilter === p.id }"
            @click="phaseFilter = p.id"
          >
            <i class="dot" :style="{ background: p.color }"></i>阶段{{ p.id }}
          </button>
        </div>
        <div class="kv-list">
          <div v-for="(e, i) in filteredEvents" :key="i" class="kv-row">
            <span class="kv-date mono">{{ e.date }}</span>
            <span class="kv-dot" :style="{ background: PHASE_HEX[dayPhase[e.date]] }"></span>
            <span class="kv-event">{{ e.event }}</span>
            <span v-if="hashTokens(e.source).length" class="kv-src">
              <HashChip v-for="(h, hi) in hashTokens(e.source)" :key="hi" :hash="h" />
            </span>
          </div>
        </div>
      </section>

      <!-- mermaid 图 -->
      <section>
        <div class="section-title">
          <h2>文档中的 mermaid 图</h2>
          <span class="en">MERMAID · 原文直接渲染</span>
        </div>
        <div class="mmd-list">
          <div v-for="(m, i) in timelineMermaid" :key="i" class="card">
            <div class="mmd-cap">
              <span class="mono">{{ m.path.split(' / ').pop() }}</span>
              <span class="mono dim">L{{ m.line }}</span>
            </div>
            <MermaidBlock :code="m.code" />
          </div>
        </div>
      </section>

      <!-- 65 天逐日表 -->
      <section>
        <div class="section-title">
          <h2>65 天逐日提交数</h2>
          <span class="en">APPENDIX · 全量数据</span>
        </div>
        <DataTable
          :headers="['日期', '提交', '日期', '提交', '日期', '提交', '日期', '提交', '日期', '提交']"
          :rows="dailyRows"
          :num-cols="[1, 3, 5, 7, 9]"
          :mono-cols="[0, 2, 4, 6, 8]"
          max-height="420px"
          caption="git log --format='%ad' --date=short 按日聚合 · 合计 12,293"
        />
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
.day-detail {
  margin-top: 14px;
}
.dd-head {
  display: flex;
  align-items: baseline;
  gap: 16px;
  flex-wrap: wrap;
}
.dd-date {
  color: var(--cyan);
  font-size: 14px;
}
.dd-count {
  font-size: 1.4rem;
  font-weight: 700;
}
.dd-list {
  list-style: none;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.dd-event {
  color: var(--ink-2);
  font-size: 13.5px;
  margin-right: 10px;
}
.dd-empty {
  margin-top: 8px;
  color: var(--ink-4);
  font-size: 13px;
}
.topday-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.topday {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 4px 10px;
  align-items: baseline;
  padding: 14px 16px;
}
.topday-rank {
  grid-row: span 2;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--ink-4);
}
.topday.hot .topday-rank {
  color: var(--ph4);
}
.topday-date {
  font-size: 12px;
  color: var(--ink-3);
}
.topday-num {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ink);
  justify-self: end;
}
.topday-ev {
  grid-column: 2 / 4;
  font-size: 12px;
  color: var(--ink-3);
}
.filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.filter-chip {
  cursor: pointer;
  border-color: var(--line);
  transition: all 0.15s ease;
}
.filter-chip.on {
  border-color: var(--blue);
  color: var(--ink);
  background: rgba(77, 107, 254, 0.15);
}
.kv-list {
  border: 1px solid var(--line-soft);
  border-radius: var(--r);
  background: var(--surface);
  overflow: hidden;
}
.kv-row {
  display: grid;
  grid-template-columns: 96px 12px 1fr auto;
  gap: 10px;
  align-items: baseline;
  padding: 8px 16px;
  border-bottom: 1px solid var(--line-soft);
  font-size: 13px;
}.kv-row:last-child {
  border-bottom: none;
}
.kv-row:hover {
  background: rgba(77, 107, 254, 0.06);
}
.kv-date {
  color: var(--ink-3);
  font-size: 12px;
}
.kv-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.kv-event {
  color: var(--ink-2);
}
.kv-src {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: flex-end;
  max-width: 420px;
}
.mmd-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.mmd-cap {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--ink-3);
}
.mmd-cap .dim {
  color: var(--ink-4);
}

@media (max-width: 960px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
  .topday-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 560px) {
  .topday-grid {
    grid-template-columns: 1fr;
  }
}
</style>
