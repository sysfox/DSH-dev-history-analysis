<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import PageHero from '../components/PageHero.vue'
import BaseChart from '../components/BaseChart.vue'
import DataTable from '../components/DataTable.vue'
import HashChip from '../components/HashChip.vue'
import { doc, domains, groups, groupByName, phaseHexOf } from '../lib/data'
import { numFmt, inlineMd } from '../lib/util'

const toolTable = doc.tables.find((x) => x.path.includes('工具包') && x.path.includes('所在组'))
const pairingTable = doc.tables.find((x) => x.path.includes('能力缝（Seam）'))
const restructureHeadings = doc.headings.filter(
  (h) => h.path.includes('包与能力演进') && /^[0-9]+\/[0-9]+|三次结构性重组/.test(h.text)
)

// ---------- sunburst ----------
const sunData = computed(() =>
  domains.map((d) => ({
    name: `${d.id} ${d.name}`,
    children: d.groups.map((g) => {
      const gr = groupByName[g.name]
      return {
        name: g.name,
        value: gr ? gr.commits : 1,
        pkgCount: gr ? gr.pkgCount : g.packages.length,
        hash: gr ? String(gr.hash).replace(/`/g, '') : '',
        date: gr ? gr.date : '',
        role: gr ? gr.role : '',
        evo: gr ? gr.evo : '',
      }
    }),
  }))
)

const sunOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    backgroundColor: 'rgba(13,19,38,.97)',
    borderColor: '#23325a',
    textStyle: { color: '#e9edf9', fontSize: 12 },
    formatter: (p) => {
      const d = p.data
      if (!d.value || !d.pkgCount) return `<b>${escape(p.name)}</b>`
      let html = `<b style="color:#e9edf9">${escape(d.name)}</b><br/><span style="color:#38bdf8">${numFmt(d.value)}</span> 次提交 · <span style="color:#b8c1da">${d.pkgCount} 个子包</span>`
      if (d.date) html += `<br/><span style="color:#7f8bb0;font-size:11px">${d.date} · ${escape(d.hash)}</span>`
      if (d.role) html += `<br/><span style="font-size:11px;color:#b8c1da">${escape(d.role)}</span>`
      return html
    },
  },
  series: [
    {
      type: 'sunburst',
      radius: [0, '94%'],
      center: ['50%', '50%'],
      data: sunData.value,
      sort: null,
      label: {
        color: '#e9edf9',
        fontSize: 10.5,
        fontFamily: 'JetBrains Mono, monospace',
        rotate: 'radial',
        minAngle: 6,
      },
      emphasis: { focus: 'ancestor' },
      levels: [
        {},
        {
          r0: '16%',
          r1: '48%',
          itemStyle: { borderColor: '#0a0f1e', borderWidth: 1.5 },
          label: { fontSize: 11.5, fontWeight: 600 },
        },
        {
          r0: '48%',
          r1: '92%',
          itemStyle: { borderColor: '#0a0f1e', borderWidth: 1.2 },
        },
      ],
      itemStyle: { borderRadius: 3 },
    },
  ],
}))

function escape(s) {
  return String(s ?? '').replace(/</g, '&lt;')
}

// ---------- Top-15 ----------
const top15 = computed(() => [...groups].sort((a, b) => b.commits - a.commits).slice(0, 15))
const top15Option = computed(() => ({
  backgroundColor: 'transparent',
  grid: { left: 110, right: 48, top: 8, bottom: 8 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: 'rgba(13,19,38,.97)', borderColor: '#23325a', textStyle: { color: '#e9edf9', fontSize: 12 } },
  xAxis: { type: 'value', axisLabel: { color: '#7f8bb0', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }, splitLine: { lineStyle: { color: '#18223f' } } },
  yAxis: {
    type: 'category',
    data: top15.value.map((g) => g.name),
    axisLine: { lineStyle: { color: '#23325a' } },
    axisLabel: { color: '#b8c1da', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 },
  },
  series: [
    {
      type: 'bar',
      data: top15.value.map((g) => ({
        value: g.commits,
        itemStyle: { color: phaseHexOf(g.date), borderRadius: [0, 4, 4, 0] },
      })),
      barWidth: '64%',
      label: {
        show: true,
        position: 'right',
        color: '#7f8bb0',
        fontSize: 10.5,
        fontFamily: 'JetBrains Mono, monospace',
        formatter: (p) => numFmt(p.value),
      },
    },
  ],
}))

// ---------- 包组诞生时间线（DOM 条带） ----------
// 设计：65 天轴上容纳 49 个带标签 chip 在物理上必然重叠（chip 宽 5–8%，日期间距仅 ~1.5%），
// 因此改为「Top-12 大组 → 命名 chip（带连接线），其余 37 组 → 轴上刻度（悬停/选中显示名称）」。
const birthStart = new Date('2026-06-10').getTime()
const birthEnd = new Date('2026-08-13').getTime()
const birthSpan = birthEnd - birthStart
const birthPos = (date) => Math.min(100, Math.max(0, ((new Date(date).getTime() - birthStart) / birthSpan) * 100))
const selGroup = ref(groups[0]?.name ?? '')
const selGroupInfo = computed(() => groupByName[selGroup.value])

// 里程碑轴：标签按真实日期定位（与下方时间轴对齐）
const birthAxis = [
  { label: '06-10 建仓', date: '2026-06-10' },
  { label: '06-20 core', date: '2026-06-20' },
  { label: '07-01 hooks', date: '2026-07-01' },
  { label: '07-19 GUI 两半', date: '2026-07-19' },
  { label: '07-30 重组三连', date: '2026-07-30' },
  { label: '08-13 命名契约', date: '2026-08-13' },
].map((m) => ({ ...m, left: birthPos(m.date) }))

const top12Names = computed(() => new Set([...groups].sort((a, b) => b.commits - a.commits).slice(0, 12).map((g) => g.name)))

const stripEl = ref(null)
const stripW = ref(900) // 容器实测宽度（chip 宽度估算以 px 计，换算为 %）
let ro = null

onMounted(() => {
  if (!stripEl.value) return
  const measure = () => (stripW.value = stripEl.value.offsetWidth || 900)
  measure()
  ro = new ResizeObserver(measure)
  ro.observe(stripEl.value)
})
onBeforeUnmount(() => ro && ro.disconnect())

// Top-12 命名 chip：按日期排序 + 贪心分行（同行互不重叠），两端夹取防溢出
const CHIP_ROW_H = 32
const CHIP_TOP = 6
const chipW = (name) => 20 + name.length * 6.4 // px 估算
const chipLayout = computed(() => {
  const placed = []
  let row = 0
  let prevRight = -Infinity
  const sorted = groups.filter((g) => top12Names.value.has(g.name)).sort((a, b) => (a.date < b.date ? -1 : 1))
  for (const g of sorted) {
    const w = (chipW(g.name) / stripW.value) * 100
    const left = Math.min(Math.max(birthPos(g.date), w / 2), 100 - w / 2)
    const leftEdge = left - w / 2
    if (prevRight > -Infinity && leftEdge < prevRight) {
      row++
      prevRight = -Infinity
    }
    placed.push({ g, left, top: CHIP_TOP + row * CHIP_ROW_H })
    prevRight = left + w / 2
  }
  return { placed, rows: row + 1 }
})

// 其余组 → 轴上的刻度；同日刻度横向错开 5px
const tickLayout = computed(() => {
  const byDate = new Map()
  for (const g of groups) {
    if (top12Names.value.has(g.name)) continue
    if (!byDate.has(g.date)) byDate.set(g.date, [])
    byDate.get(g.date).push(g)
  }
  const ticks = []
  for (const [date, list] of byDate) {
    const wPct = ((list.length - 1) * 5 / stripW.value) * 100
    const base = Math.min(Math.max(birthPos(date) - wPct / 2, 0), 100 - wPct)
    list.forEach((g, i) => ticks.push({ g, left: base + ((i * 5) / stripW.value) * 100 }))
  }
  return ticks
})
const selTick = computed(() => tickLayout.value.find((t) => t.g.name === selGroup.value))

const STRIP_H = computed(() => chipLayout.value.rows * CHIP_ROW_H + CHIP_TOP + 92)

// ---------- 领域详情 ----------
const openDomain = ref(1)
const domainStats = (d) => {
  let pkgs = 0
  let commits = 0
  for (const g of d.groups) {
    pkgs += g.packages.length
    commits += groupByName[g.name]?.commits ?? 0
  }
  return { pkgs, commits }
}

// ---------- 三次结构性重组 ----------
const restructures = [
  { date: '06-20', hash: 'd02e9f1bd6', title: '模块化层级化', text: '「Reorganize packages into a modular hierarchy」——扁平落位的产品 API 包收拢为 packages/core/，模块化层级正式成型。' },
  { date: '07-30', hash: '3fc35c91ff', title: '包重组三连', text: '7/30 单日 887 提交峰值的一部分：dissolve ui/（旧 ui/ 语义溶解）、session 家族 12 包折叠入 packages/session/、guard 合并 timeout/，另将 sdk/ 更名 scaffold/。' },
  { date: '08-13', hash: 'a2d0f7f411', title: '仓库命名契约', text: 'PR #2302，3,281 个文件：task→job、bash→shell、pty→terminal 等词汇全库统一，shell/terminal/identity/jobs 等组正式落位，同日 npm 公开发布。' },
]
</script>

<template>
  <div class="page">
    <div class="container">
      <PageHero
        kicker="第五章 · 包与能力演进"
        title="包与能力"
        lead="219 个 workspace 包、49 个包组，按 12 个领域组织。能力以「缝」为单位扩张：Service Definition / Provider / Consumer 三件套，从一开始就是结构属性。"
      />

      <!-- Sunburst -->
      <section>
        <div class="section-title">
          <h2>49 个包组 · 12 个领域</h2>
          <span class="en">SUNBURST · 面积 = 路径下提交数</span>
        </div>
        <div class="chart-box">
          <div class="chart-title">
            <span>领域 → 包组</span>
            <span class="note">同一包组可跨领域出现；组提交数按 packages/&lt;组&gt;/ 路径统计</span>
          </div>
          <BaseChart :option="sunOption" height="480px" />
        </div>
      </section>

      <!-- 包组诞生时间线 -->
      <section>
        <div class="section-title">
          <h2>包组诞生时间表</h2>
          <span class="en">BIRTH ORDER · git 实测首提交</span>
        </div>
        <p class="strip-note">
          Top-12 提交大组以命名 chip 展示（连接线指向诞生日），其余 37 组为轴上刻度 —— 点击或悬停任意刻度可查看组名与详情。
        </p>
        <div class="card">
          <div class="birth-axis">
            <span
              v-for="m in birthAxis"
              :key="m.label"
              :style="{ left: m.left + '%', transform: m.left === 0 ? 'none' : 'translateX(-50%)' }"
            >{{ m.label }}</span>
          </div>
          <div ref="stripEl" class="birth-strip" :style="{ height: STRIP_H + 'px' }">
            <!-- Top-12 命名 chip（带连接线） -->
            <span
              v-for="c in chipLayout.placed"
              :key="c.g.name"
              class="bc"
              :style="{ left: c.left + '%', top: c.top + 'px', '--conn': STRIP_H - c.top - 40 + 'px' }"
            >
              <button
                class="birth-chip"
                :class="{ on: selGroup === c.g.name }"
                :title="`${c.g.name} · ${c.g.date} · ${numFmt(c.g.commits)} 提交`"
                @click="selGroup = c.g.name"
              >
                <i :style="{ background: phaseHexOf(c.g.date) }"></i>{{ c.g.name }}
              </button>
            </span>
            <!-- 其余 37 组 → 轴上刻度 -->
            <button
              v-for="t in tickLayout"
              :key="t.g.name"
              class="birth-tick"
              :class="{ on: selGroup === t.g.name }"
              :data-name="t.g.name"
              :style="{ left: t.left + '%', background: phaseHexOf(t.g.date) }"
              :title="`${t.g.name} · ${t.g.date} · ${numFmt(t.g.commits)} 提交`"
              @click="selGroup = t.g.name"
            ></button>
          </div>
          <div class="birth-detail" v-if="selGroupInfo">
            <span class="mono date">{{ selGroupInfo.date }}</span>
            <span class="bd-name mono">{{ selGroupInfo.name }}</span>
            <span class="bd-num num">{{ numFmt(selGroupInfo.commits) }} 提交</span>
            <span class="bd-pkgs num">{{ selGroupInfo.pkgCount }} 子包</span>
            <HashChip :hash="selGroupInfo.hash" />
            <p class="bd-role">{{ selGroupInfo.role }}<template v-if="selGroupInfo.evo"> · {{ selGroupInfo.evo }}</template></p>
          </div>
        </div>
      </section>

      <!-- Top-15 -->
      <section class="grid-2">
        <div>
          <div class="section-title">
            <h2>提交数 Top-15</h2>
            <span class="en">BY COMMITS · 颜色 = 诞生阶段</span>
          </div>
          <div class="chart-box">
            <BaseChart :option="top15Option" height="560px" />
          </div>
        </div>
        <div>
          <div class="section-title">
            <h2>三次结构性重组</h2>
            <span class="en">RESTRUCTURES</span>
          </div>
          <div class="re-list">
            <div v-for="(r, i) in restructures" :key="i" class="card re-card">
              <div class="re-head">
                <span class="mono re-date">{{ r.date }}</span>
                <HashChip :hash="r.hash" />
              </div>
              <h3>{{ r.title }}</h3>
              <p>{{ r.text }}</p>
            </div>
          </div>
          <div class="section-title">
            <h2>能力缝：Seam → Tool → UI</h2>
            <span class="en">THREE-CORNERED PAIRING</span>
          </div>
          <div v-if="pairingTable" class="card">
            <p class="pair-note">
              一个缝可以同时服务多个工具与多个 UI 面；反过来，一个工具只属于一个缝（没有「缝合怪」工具）。
            </p>
            <DataTable
              :headers="pairingTable.headers"
              :rows="pairingTable.rows"
              :mono-cols="[0, 1, 2]"
              :sortable="false"
            />
          </div>
        </div>
      </section>

      <!-- 49 组全表 -->
      <section>
        <div class="section-title">
          <h2>包组总表（49 组）</h2>
          <span class="en">FULL TABLE · 可排序</span>
        </div>
        <DataTable
          :headers="['包组', '首个提交', '日期', '提交数', '子包数', '职责（代表子包）', '关键演进']"
          :rows="groups.map((g) => [g.name, g.hash, g.date.slice(5), g.commits, g.pkgCount, g.role, g.evo])"
          :mono-cols="[0, 1, 2]"
          :num-cols="[3, 4]"
          max-height="520px"
        />
      </section>

      <!-- 12 领域详情 -->
      <section>
        <div class="section-title">
          <h2>12 个领域详情</h2>
          <span class="en">DOMAINS · 子包清单</span>
        </div>
        <div class="dom-list">
          <details
            v-for="d in domains"
            :key="d.id"
            class="dom card"
            :open="openDomain === d.id"
            @toggle="(ev) => { if (ev.target.open) openDomain = d.id }"
          >
            <summary>
              <span class="dom-no mono">{{ String(d.id).padStart(2, '0') }}</span>
              <span class="dom-name">{{ d.name }}</span>
              <span class="dom-scope mono">{{ d.scope }}</span>
              <span class="dom-stats num">{{ domainStats(d).pkgs }} 包 · {{ numFmt(domainStats(d).commits) }} 提交</span>
            </summary>
            <div class="dom-body">
              <p class="dom-blurb">{{ d.blurb }}</p>
              <div class="dom-milestone">
                <HashChip :hash="d.milestone.hash" />
                <span class="mono date">{{ d.milestone.date }}</span>
                <span>{{ d.milestone.text }}</span>
              </div>
              <div class="dom-groups">
                <div v-for="g in d.groups" :key="g.name" class="dom-group">
                  <div class="dom-group-head">
                    <span class="dom-group-name mono">{{ g.name }}</span>
                    <span class="dom-group-n num">{{ g.packages.length }} 包</span>
                  </div>
                  <div class="pkg-chips">
                    <span v-for="p in g.packages" :key="p" class="pkg-chip mono">{{ p }}</span>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>
      </section>

      <!-- 工具层 -->
      <section>
        <div class="section-title">
          <h2>工具层：22 个 dsh-tool-*</h2>
          <span class="en">TOOL LAYER · 一个能力缝 → 一个模型侧工具</span>
        </div>
        <DataTable
          v-if="toolTable"
          :headers="toolTable.headers"
          :rows="toolTable.rows"
          :mono-cols="[0, 1]"
          :num-cols="[]"
          caption="dsh-tools 为中枢（core 组，非 tool-* 前缀）；工具包与被消费的缝同组相邻"
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
.strip-note {
  font-size: 12.5px;
  color: var(--ink-3);
  margin: -4px 0 12px;
  line-height: 1.7;
}
.birth-axis {
  position: relative;
  height: 22px;
  border-bottom: 1px solid var(--line-soft);
}
.birth-axis span {
  position: absolute;
  top: 6px;
  font-family: var(--font-m);
  font-size: 10.5px;
  color: var(--ink-4);
  white-space: nowrap;
}
.birth-strip {
  position: relative;
  margin-top: 10px;
  border-bottom: 1px solid var(--line);
  min-height: 120px;
}
.bc {
  position: absolute;
  transform: translateX(-50%);
  z-index: 1;
}
.bc::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  width: 1px;
  height: var(--conn);
  background: linear-gradient(180deg, rgba(77, 107, 254, 0.4), rgba(77, 107, 254, 0.08));
  pointer-events: none;
}
.birth-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--ink-2);
  font-family: var(--font-m);
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  position: relative;
  z-index: 2;
}
.birth-chip:hover,
.birth-chip.on {
  border-color: var(--blue);
  color: var(--ink);
  background: rgba(77, 107, 254, 0.16);
}
.birth-chip i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.birth-tick {
  position: absolute;
  bottom: 0;
  width: 3px;
  height: 14px;
  transform: translateX(-50%);
  border: none;
  border-radius: 2px 2px 0 0;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.15s ease;
  padding: 0;
}
.birth-tick:hover {
  opacity: 1;
  height: 22px;
}
.birth-tick.on {
  opacity: 1;
  height: 26px;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
}
.birth-tick.on::after {
  content: attr(data-name);
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-family: var(--font-m);
  font-size: 10.5px;
  color: var(--ink);
  background: var(--surface-3);
  border: 1px solid var(--line);
  padding: 1px 8px;
  border-radius: 6px;
  pointer-events: none;
}
.birth-detail {
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px dashed var(--line);
  margin-top: 4px;
}
.birth-detail .date {
  color: var(--cyan);
  font-size: 13px;
}
.bd-name {
  font-size: 13.5px;
  color: var(--ink);
}
.bd-num {
  font-weight: 700;
}
.bd-pkgs {
  color: var(--ink-3);
  font-size: 13px;
}
.bd-role {
  width: 100%;
  font-size: 13px;
  color: var(--ink-3);
}
.re-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.re-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.re-date {
  color: var(--cyan);
  font-size: 12px;
}
.re-card h3 {
  margin: 6px 0 4px;
  font-size: 1.05rem;
}
.re-card p {
  font-size: 13px;
  color: var(--ink-3);
  line-height: 1.8;
}
.pair-note {
  font-size: 13px;
  color: var(--ink-3);
  margin-bottom: 10px;
}
.dom-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dom {
  padding: 0;
  overflow: hidden;
}
.dom summary {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 15px 20px;
  cursor: pointer;
  list-style: none;
  flex-wrap: wrap;
}
.dom summary::-webkit-details-marker {
  display: none;
}
.dom summary::before {
  content: '▸';
  color: var(--ink-4);
  transition: transform 0.18s ease;
  font-size: 12px;
}
.dom[open] summary::before {
  transform: rotate(90deg);
}
.dom-no {
  color: var(--ink-4);
  font-size: 12px;
}
.dom-name {
  font-family: var(--font-d);
  font-size: 1.08rem;
  font-weight: 600;
  color: var(--ink);
}
.dom-scope {
  font-size: 11px;
  color: var(--ink-4);
}
.dom-stats {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--ink-3);
}
.dom-body {
  border-top: 1px solid var(--line-soft);
  padding: 16px 20px 18px;
}
.dom-blurb {
  font-size: 13.5px;
  color: var(--ink-2);
  line-height: 1.85;
}
.dom-milestone {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 10px 0 14px;
  font-size: 13px;
  color: var(--ink-3);
  flex-wrap: wrap;
}
.dom-milestone .date {
  font-size: 11.5px;
  color: var(--ink-4);
}
.dom-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dom-group-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 6px;
}
.dom-group-name {
  font-size: 13px;
  color: var(--cyan);
}
.dom-group-n {
  font-size: 11px;
  color: var(--ink-4);
}
.pkg-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pkg-chip {
  font-size: 11px;
  color: var(--ink-2);
  background: var(--surface-2);
  border: 1px solid var(--line-soft);
  border-radius: 5px;
  padding: 1.5px 8px;
}
@media (max-width: 960px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
