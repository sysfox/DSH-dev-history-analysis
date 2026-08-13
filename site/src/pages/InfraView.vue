<script setup>
import { computed } from 'vue'
import PageHero from '../components/PageHero.vue'
import BaseChart from '../components/BaseChart.vue'
import DataTable from '../components/DataTable.vue'
import MermaidBlock from '../components/MermaidBlock.vue'
import HashChip from '../components/HashChip.vue'
import ChartZoom from '../components/ChartZoom.vue'
import { doc } from '../lib/data'
import { hashTokens } from '../lib/util'

const t = (p) => doc.tables.find((x) => x.path.includes(p))
const workflows = t('15 个 workflow 全表')
const vendored = t('9 个 vendored 包')
const nodeMatrix = t('Node 版本矩阵')
const winStages = t('Windows 三段式演进')
const gitlab = t('GitLab 镜像')
const buildStages = t('三阶段构建定型')
const milestones = t('基础设施里程碑')
const sequences = t('三条发布序列')
const releaseFiles = t('发布步骤流程')

const infraMermaid = doc.mermaid.filter((m) => m.path.includes('工程基础设施'))

// scripts 索引（附录 A，12 组 123 条，名字逐字来自根 package.json）
const scriptGroups = [
  { name: '构建与清理', n: 7, scripts: ['build', 'build:lib', 'build:lib:host', 'build:lib:client', 'build:web', 'clean', 'change-scope'] },
  { name: '类型检查与 lint', n: 7, scripts: ['typecheck', 'typecheck:contracts-ready', 'lint', 'lint:contracts-ready', 'lint:fix', 'lint:fix:contracts-ready', 'duplication'] },
  { name: '测试与快照', n: 15, scripts: ['test', 'test:coverage', 'test:e2e', 'test:issue-management', 'test:snapshot', 'test:snapshot:record', 'test:snapshot:refresh', 'migrate:packed-session-fixtures', 'test:web', 'test:web:refresh', 'test:web:built', 'test:web:perf', 'test:web:perf:built', 'test:web:stress', 'test:gui'] },
  { name: '门禁调度', n: 14, scripts: ['check:all', 'check:ci', 'check:ci:linux-primary', 'check:ci:static', 'check:ci:lint:contracts-ready', 'check:ci:coverage', 'check:ci:snapshot', 'check:ci:artifacts', 'check:ci:consumers', 'check:windows-wine', 'check:ci:windows-blocking', 'check:ci:windows-complete', 'check:ci:windows-observational', 'check:node-compat'] },
  { name: '卫生与约束', n: 4, scripts: ['knip', 'publint', 'constraints', 'hygiene'] },
  { name: '文档与站点', n: 12, scripts: ['doc-typecheck', 'doc-typecheck:contracts-ready', 'docs:dev', 'docs:build', 'docs:build:mpa', 'docs:preview', 'docs:check', 'website:dev', 'website:build', 'doc-sync', 'verify-doc-refs', 'verify-doc-budgets'] },
  { name: '文档静态校验', n: 10, scripts: ['verify-md-wrap', 'verify-md-links', 'verify-doc-site-fragments', 'verify-public-repository-links', 'verify-type-equiv', 'verify-mermaid', 'verify-translation-prompt', 'verify-translation-pairing', 'resolve-translation-pairing-conflicts', 'gen-translation-brief'] },
  { name: '包/产物/配置校验', n: 15, scripts: ['verify-package-paths', 'verify-dsh-package-licenses', 'verify-config-source-ownership', 'verify-package-invariants', 'verify-built-package-invariants', 'verify-package-readme-model-experience', 'verify-package-readme-limitations', 'verify-node-next-types', 'verify-runtime-closure', 'verify-vendored-links', 'verify-cordis-config', 'verify-client-domain-graph', 'verify-export-jsdoc', 'rescope-vendor', 'rescope-vendor:check'] },
  { name: 'Agent Note / skill 校验', n: 4, scripts: ['verify-agent-note-classification', 'verify-agent-note-format', 'verify-archived-agent-notes', 'verify-skill-invocation-metadata'] },
  { name: '生成 + 校验成对', n: 21, scripts: ['gen-cordis-catalog', 'verify-cordis-catalog', 'gen-cordis-api', 'verify-cordis-api', 'gen-client-catalog', 'verify-client-catalog', 'gen-cordis-inspect-catalog', 'gen-tool-catalog', 'verify-tool-catalog', 'gen-config-catalog', 'verify-config-catalog', 'gen-doc-graphs', 'verify-doc-graphs', 'gen-persistence-catalog', 'verify-persistence-catalog', 'gen-third-party-notices', 'verify-third-party-notices', 'gen-module-graph', 'verify-module-graph', 'gen-scoped-events', 'verify-scoped-events'] },
  { name: '发布', n: 7, scripts: ['publish:npm-baseline', 'release:dsh', 'release:vendor', 'release:verify', 'release:pack', 'release:verify-packed-install', 'release:publish'] },
  { name: '运行与演示', n: 7, scripts: ['dsh', 'demo:code-mode', 'demo:cordis', 'demo:acp', 'mock:llm', 'dev:web', 'postinstall'] },
]

const scriptOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item', formatter: '{b}：{c} 条（{d}%）', backgroundColor: 'rgba(13,19,38,.97)', borderColor: '#23325a', textStyle: { color: '#e9edf9' } },
  legend: { type: 'scroll', bottom: 0, textStyle: { color: '#7f8bb0', fontSize: 10.5 }, itemWidth: 9, itemHeight: 9 },
  color: ['#4d6bfe', '#38bdf8', '#a78bfa', '#f5a524', '#34d399', '#f472b6', '#7f8bb0', '#5b6790', '#2a3a63', '#0ea5e9', '#84cc16', '#e879f9'],
  series: [
    {
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '44%'],
      label: { show: false },
      data: scriptGroups.map((g) => ({ name: g.name, value: g.n })),
    },
  ],
}))
</script>

<template>
  <div class="page">
    <div class="container">
      <PageHero
        kicker="第七章 · 工程基础设施与研发实践"
        title="工程基础设施"
        lead="从 Yarn 4 到 pnpm 的换轨、三阶段构建定型、15 个 CI workflow、9 个 vendored 包、三条发布序列 —— 支撑 12,293 次提交的工程地基。"
      />

      <!-- 里程碑时间线 -->
      <section>
        <div class="section-title">
          <h2>基础设施里程碑</h2>
          <span class="en">MILESTONES · 48 个节点</span>
        </div>
        <div class="chart-box">
          <div class="chart-title"><span>提交曲线上的基建落点（示意）</span><span class="note">详见下方全表</span></div>
          <div class="ml-list">
            <div v-for="(r, i) in (milestones?.rows || [])" :key="i" class="ml-row">
              <span class="ml-date mono">{{ r[0] }}</span>
              <span class="ml-ev">{{ r[1] }}</span>
              <span v-if="hashTokens(r[2]).length" class="ml-src">
                <HashChip v-for="(h, hi) in hashTokens(r[2])" :key="hi" :hash="h" />
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- 包管理 -->
      <section class="grid-2">
        <div>
          <div class="section-title">
            <h2>构建三阶段定型</h2>
            <span class="en">BUILD PIPELINE</span>
          </div>
          <DataTable
            v-if="buildStages"
            :headers="buildStages.headers"
            :rows="buildStages.rows"
            :mono-cols="[3]"
            :sortable="false"
          />
        </div>
        <div>
          <div class="section-title">
            <h2>Node 版本矩阵</h2>
            <span class="en">NODE MATRIX</span>
          </div>
          <DataTable
            v-if="nodeMatrix"
            :headers="nodeMatrix.headers"
            :rows="nodeMatrix.rows"
            :mono-cols="[0]"
            :sortable="false"
          />
          <div class="section-title">
            <h2>Windows 三段式演进</h2>
            <span class="en">WINDOWS</span>
          </div>
          <DataTable
            v-if="winStages"
            :headers="winStages.headers"
            :rows="winStages.rows"
            :mono-cols="[4]"
            max-height="300px"
          />
          <div class="section-title">
            <h2>GitLab 镜像</h2>
            <span class="en">GITLAB MIRROR</span>
          </div>
          <DataTable
            v-if="gitlab"
            :headers="gitlab.headers"
            :rows="gitlab.rows"
            :mono-cols="[0]"
            :sortable="false"
          />
        </div>
      </section>

      <!-- 123 scripts -->
      <section>
        <div class="section-title">
          <h2>根 scripts：123 条全索引</h2>
          <span class="en">ROOT SCRIPTS · 12 组 · 名字逐字来自根 package.json</span>
        </div>
        <div class="scripts-layout">
          <div class="chart-box">
          <ChartZoom title="根 scripts · 12 组分布">
            <BaseChart :option="scriptOption" height="320px" />
          </ChartZoom>
          </div>
          <div class="script-groups">
            <div v-for="g in scriptGroups" :key="g.name" class="script-group card">
              <div class="sg-head">
                <span class="sg-name">{{ g.name }}</span>
                <span class="sg-n num">{{ g.n }}</span>
              </div>
              <div class="sg-chips">
                <code v-for="s in g.scripts" :key="s" class="sg-chip mono">{{ s }}</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CI -->
      <section>
        <div class="section-title">
          <h2>15 个 workflow 全表</h2>
          <span class="en">CI WORKFLOWS</span>
        </div>
        <DataTable
          v-if="workflows"
          :headers="workflows.headers"
          :rows="workflows.rows"
          :mono-cols="[0]"
          max-height="480px"
          caption=".github/workflows · 实测 15 个"
        />
      </section>

      <!-- Vendoring -->
      <section class="grid-2">
        <div>
          <div class="section-title">
            <h2>9 个 vendored 包</h2>
            <span class="en">VENDORING</span>
          </div>
          <DataTable
            v-if="vendored"
            :headers="vendored.headers"
            :rows="vendored.rows"
            :mono-cols="[0, 2]"
            :num-cols="[3]"
          />
        </div>
        <div>
          <div class="section-title">
            <h2>三条发布序列</h2>
            <span class="en">RELEASE SEQUENCES</span>
          </div>
          <DataTable
            v-if="sequences"
            :headers="sequences.headers"
            :rows="sequences.rows"
            :mono-cols="[1, 2]"
            :sortable="false"
          />
          <div class="section-title">
            <h2>发布步骤流程</h2>
            <span class="en">RELEASE FILES</span>
          </div>
          <DataTable
            v-if="releaseFiles"
            :headers="releaseFiles.headers"
            :rows="releaseFiles.rows"
            :mono-cols="[0, 1]"
            :sortable="false"
          />
        </div>
      </section>

      <!-- mermaid -->
      <section>
        <div class="section-title">
          <h2>基础设施图解</h2>
          <span class="en">DIAGRAMS · 原文直接渲染</span>
        </div>
        <div class="mmd-list">
          <div v-for="m in infraMermaid" :key="m.line" class="card">
            <div class="mmd-cap">
              <span class="mono">{{ m.path.split(' / ').pop() }}</span>
              <span class="mono dim">L{{ m.line }}</span>
            </div>
            <ChartZoom :title="`mermaid · ${m.path.split(' / ').pop()}`">
              <MermaidBlock :code="m.code" />
            </ChartZoom>
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
.ml-list {
  max-height: 460px;
  overflow: auto;
}
.ml-row {
  display: grid;
  grid-template-columns: 92px 1fr auto;
  gap: 12px;
  align-items: baseline;
  padding: 7px 10px;
  border-bottom: 1px solid var(--line-soft);
  font-size: 12.5px;
}
.ml-row:hover {
  background: rgba(77, 107, 254, 0.05);
}
.ml-date {
  color: var(--ink-3);
  font-size: 11.5px;
}
.ml-ev {
  color: var(--ink-2);
}
.ml-src {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: flex-end;
  max-width: 300px;
}
.scripts-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 16px;
  align-items: start;
}
.script-groups {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.script-group {
  padding: 14px 16px;
}
.sg-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.sg-name {
  font-weight: 600;
  font-size: 13.5px;
}
.sg-n {
  color: var(--cyan);
  font-weight: 700;
}
.sg-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.sg-chip {
  font-size: 10.5px;
  color: var(--ink-3);
  background: var(--surface-2);
  border: 1px solid var(--line-soft);
  border-radius: 4px;
  padding: 1px 6px;
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
  .grid-2,
  .scripts-layout {
    grid-template-columns: 1fr;
  }
  .script-groups {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 620px) {
  .ml-row {
    grid-template-columns: 78px 1fr;
  }
  .ml-src {
    grid-column: 2;
    justify-content: flex-start;
    max-width: none;
  }
}
</style>
