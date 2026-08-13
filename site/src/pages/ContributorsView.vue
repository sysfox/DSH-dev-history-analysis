<script setup>
import { computed } from 'vue'
import PageHero from '../components/PageHero.vue'
import BaseChart from '../components/BaseChart.vue'
import DataTable from '../components/DataTable.vue'
import StatCard from '../components/StatCard.vue'
import { doc, contributorRank } from '../lib/data'

const matrix = doc.contributionMatrix.filter((m) => !m.isTotal)
const total = doc.contributionMatrix.find((m) => m.isTotal)

// 堆叠柱：14 人 × 3 月
const stackedOption = computed(() => ({
  backgroundColor: 'transparent',
  grid: { left: 110, right: 46, top: 34, bottom: 10 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: 'rgba(13,19,38,.97)', borderColor: '#23325a', textStyle: { color: '#e9edf9', fontSize: 12 } },
  legend: { data: ['6 月', '7 月', '8 月'], textStyle: { color: '#7f8bb0', fontSize: 11 }, top: 0, right: 0, itemWidth: 10, itemHeight: 10 },
  xAxis: { type: 'value', axisLabel: { color: '#7f8bb0', fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5 }, splitLine: { lineStyle: { color: '#18223f' } } },
  yAxis: {
    type: 'category',
    data: [...matrix].sort((a, b) => b.total - a.total).map((m) => m.name),
    axisLine: { lineStyle: { color: '#23325a' } },
    axisLabel: { color: '#b8c1da', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 },
  },
  series: [
    { name: '6 月', type: 'bar', stack: 't', data: [...matrix].sort((a, b) => b.total - a.total).map((m) => m.jun), itemStyle: { color: '#4d6bfe' } },
    { name: '7 月', type: 'bar', stack: 't', data: [...matrix].sort((a, b) => b.total - a.total).map((m) => m.jul), itemStyle: { color: '#38bdf8' } },
    { name: '8 月', type: 'bar', stack: 't', data: [...matrix].sort((a, b) => b.total - a.total).map((m) => m.aug), itemStyle: { color: '#a78bfa' } },
  ],
}))

// Top-5 份额环
const top5 = [...matrix].sort((a, b) => b.total - a.total).slice(0, 5)
const top5Sum = top5.reduce((s, m) => s + m.total, 0)
const shareOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item', formatter: '{b}：{c} 提交（{d}%）', backgroundColor: 'rgba(13,19,38,.97)', borderColor: '#23325a', textStyle: { color: '#e9edf9' } },
  legend: { bottom: 0, textStyle: { color: '#7f8bb0', fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
  color: ['#4d6bfe', '#38bdf8', '#a78bfa', '#f5a524', '#34d399', '#2a3a63'],
  series: [
    {
      type: 'pie',
      radius: ['44%', '68%'],
      center: ['50%', '44%'],
      label: { color: '#b8c1da', fontSize: 10.5, formatter: '{b} {d}%' },
      labelLine: { lineStyle: { color: '#23325a' } },
      data: [
        ...top5.map((m) => ({ name: m.name, value: m.total })),
        { name: '其他', value: 12293 - top5Sum },
      ],
    },
  ],
}))

const insights = [
  { k: '42.4%', v: 'Tianyi Cui 占全程提交', d: '6 月 85.5% → 7 月 48.8%：「单核驱动」走向「多核并行」' },
  { k: '713', v: '8 月榜首 Yichen Jiang', d: '发布工程阶段贡献摊薄，Tianyi Cui 682（19.8%）紧随，imccyu 453（13.2%）' },
  { k: '73.4%', v: 'Top-5 合计份额', d: '9,028 / 12,293：Tianyi Cui + Yichen Jiang + imccyu + Chinesezjc + Turtle' },
  { k: '9 人', v: '7 月月提交 ≥ 200', d: '4,036 / 822 / 627 / 372 / 353 / 331 / 326 / 231 / 211 —— 与 Web GUI 战役的并行度吻合' },
]

const agentFirst = [
  { k: '1,886', v: '提交消息提及 codex', d: '约 15% 的提交由 Codex 辅助产出' },
  { k: '210', v: 'worktree-* PR', d: 'GitHub 官方 stacked-PR 工作流' },
  { k: '209', v: 'codex-* PR', d: '「address Codex review」是 6 月高频句式' },
]
</script>

<template>
  <div class="page">
    <div class="container">
      <PageHero
        kicker="第九章 · 贡献者与团队演化"
        title="贡献者"
        lead="40+ 位署名贡献者，12 位提交数过百。Tianyi Cui 从建仓第一天主导到发布日（约 43%），团队扩张节奏与提交曲线高度吻合 —— 7 月下旬随 Web GUI 战役大批涌入。"
      />

      <!-- 洞察 -->
      <section>
        <div class="section-title">
          <h2>贡献结构观察</h2>
          <span class="en">INSIGHTS</span>
        </div>
        <div class="insight-grid">
          <div v-for="s in insights" :key="s.k" class="card insight">
            <div class="insight-k num">{{ s.k }}</div>
            <div class="insight-v">{{ s.v }}</div>
            <div class="insight-d">{{ s.d }}</div>
          </div>
        </div>
      </section>

      <!-- 堆叠柱 -->
      <section>
        <div class="section-title">
          <h2>月度提交矩阵：前 14 名</h2>
          <span class="en">STACKED · 按 %an 精确匹配</span>
        </div>
        <div class="chart-box">
          <BaseChart :option="stackedOption" height="460px" />
        </div>
      </section>

      <!-- Top-5 份额 + agent-first -->
      <section class="grid-2">
        <div>
          <div class="section-title">
            <h2>Top-5 份额</h2>
            <span class="en">SHARE · 9,028 / 12,293</span>
          </div>
          <div class="chart-box">
            <BaseChart :option="shareOption" height="320px" />
          </div>
        </div>
        <div>
          <div class="section-title">
            <h2>agent-first 的三大表征</h2>
            <span class="en">AGENT-FIRST</span>
          </div>
          <div class="af-grid">
            <div v-for="s in agentFirst" :key="s.k" class="card af-card">
              <div class="af-k num">{{ s.k }}</div>
              <div class="af-v">{{ s.v }}</div>
              <div class="af-d">{{ s.d }}</div>
            </div>
          </div>
          <div class="card af-quote">
            <p>
              「这个代码库主要由 coding agent 开发，agent 遵守机器强制 gate 远比散文约定可靠」
              —— ADR 0007 明言，100% 覆盖率、doc-sync、verify-*、Agent Note 强制制度全部由此而生。
            </p>
          </div>
        </div>
      </section>

      <!-- 团队扩张 -->
      <section>
        <div class="section-title">
          <h2>团队扩张轨迹</h2>
          <span class="en">GROWTH</span>
        </div>
        <div class="growth-steps">
          <div class="card growth">
            <span class="mono g-date">6 月</span>
            <h3>小团队精耕</h3>
            <p>约 5–6 人：Tianyi Cui、Hypatia May、imccyu、Yichen Jiang、Huanqi Cao、Dudu-0223</p>
          </div>
          <div class="card growth">
            <span class="mono g-date">7 月初</span>
            <h3>首批新血</h3>
            <p>kingwl（6/30）、Turtle（7/9）、pku-xht（7/13）加入</p>
          </div>
          <div class="card growth">
            <span class="mono g-date">7 月下旬</span>
            <h3>Web GUI 战役涌入</h3>
            <p>Chinesezjc（7/21）、_Kerman（7/22）、creatixchu（7/24）等大批加入，对应 W30 2,169 → W31 3,542 的提交井喷</p>
          </div>
          <div class="card growth">
            <span class="mono g-date">组织</span>
            <h3>deepseek-ai → deepseek-harness</h3>
            <p>6 月中旬属 deepseek-ai 组织，约 6/27 迁至 deepseek-harness（首个 PR #115 于 6/27 合入）</p>
          </div>
        </div>
      </section>

      <!-- 排名表 -->
      <section>
        <div class="section-title">
          <h2>贡献者排名表</h2>
          <span class="en">RANKING · 按作者邮箱归一</span>
        </div>
        <DataTable
          :headers="['#', '贡献者', '活跃区间', '提交数', '备注']"
          :rows="contributorRank.map((c) => [c.rank, c.name, c.active, c.commits, c.note])"
          :num-cols="[3]"
          :mono-cols="[1, 2]"
          max-height="520px"
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
.insight-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.insight {
  padding: 16px 18px;
}
.insight-k {
  font-size: 1.9rem;
  font-weight: 700;
  color: var(--blue);
}
.insight-v {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
  margin-top: 2px;
}
.insight-d {
  font-size: 12px;
  color: var(--ink-3);
  margin-top: 6px;
  line-height: 1.7;
}
.af-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}
.af-card {
  padding: 14px 16px;
}
.af-k {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ph2);
}
.af-v {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink);
  margin-top: 2px;
}
.af-d {
  font-size: 11px;
  color: var(--ink-3);
  margin-top: 5px;
  line-height: 1.65;
}
.af-quote {
  margin-top: 12px;
  font-size: 13px;
  color: var(--ink-2);
  line-height: 1.8;
  border-left: 3px solid var(--ph3);
}
.growth-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.growth .g-date {
  font-size: 11px;
  color: var(--cyan);
  letter-spacing: 0.1em;
}
.growth h3 {
  font-size: 1rem;
  margin: 4px 0 6px;
}
.growth p {
  font-size: 12.5px;
  color: var(--ink-3);
  line-height: 1.75;
}
@media (max-width: 980px) {
  .insight-grid {
    grid-template-columns: 1fr 1fr;
  }
  .grid-2 {
    grid-template-columns: 1fr;
  }
  .growth-steps {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 560px) {
  .insight-grid,
  .growth-steps,
  .af-grid {
    grid-template-columns: 1fr;
  }
}
</style>
