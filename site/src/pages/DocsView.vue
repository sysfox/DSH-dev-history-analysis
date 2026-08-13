<script setup>
import { computed } from 'vue'
import PageHero from '../components/PageHero.vue'
import StatCard from '../components/StatCard.vue'
import DataTable from '../components/DataTable.vue'
import MermaidBlock from '../components/MermaidBlock.vue'
import HashChip from '../components/HashChip.vue'
import ChartZoom from '../components/ChartZoom.vue'
import { doc } from '../lib/data'

const t = (p) => doc.tables.find((x) => x.path.includes(p))
const numbers = t('关键规模数字')
const stage3 = t('三阶段分期')
const panorama = t('目录全景')
const i18nCov = t('双语覆盖数据')
const examples = t('六个示例叶子全表')
const releases = t('发布时间线')
const intervals = t('相邻版本间隔分析')
const siteEvo = t('站点演进时间线表')
const checkpoints = t('三条机制的落地检查点')
const readmeEvo = t('README：从一行简介到产品入口')
const wheels = t('两个发行物与四条 wheel')
const subsystems = t('subsystems 页')

const docsMermaid = doc.mermaid.filter((m) => m.path.includes('文档、示例与发布'))

const keyStats = computed(() => {
  if (!numbers) return []
  const map = {}
  for (const r of numbers.rows) map[String(r[0])] = { value: r[1], note: r[2] }
  return [
    { label: 'docs/ 子目录', ...map['docs/ 子目录'] },
    { label: 'docs/ Markdown 总数', ...map['docs/ Markdown 总数'] },
    { label: 'docs/ 双语对', ...map['docs/ 双语对'] },
    { label: '全仓库双语三元组', ...map['全仓库双语三元组'] },
    { label: 'doc-sync 叶子门禁', ...map['doc-sync 叶子门禁'] },
    { label: 'website 投影记录', ...map['website 投影记录'] },
  ]
})
</script>

<template>
  <div class="page">
    <div class="container">
      <PageHero
        kicker="第八章 · 文档、示例与发布"
        title="文档生态与发布"
        lead="「文档即产品」被做成三条咬合的机制：docs/ 是分层的双语知识库，website/ 只投影不复制，examples/ 把「示例即测试」制度化。8/13 三级公开把 dsh 全家桶送上 npm。"
      />

      <!-- 关键规模 -->
      <section>
        <div class="section-title">
          <h2>关键规模数字</h2>
          <span class="en">SCALE</span>
        </div>
        <div class="stat-grid">
          <StatCard v-for="s in keyStats" :key="s.label" :value="s.value" :label="s.label" :sub="s.note" />
        </div>
      </section>

      <!-- 三条机制 -->
      <section>
        <div class="section-title">
          <h2>三条咬合的机制</h2>
          <span class="en">THREE MECHANISMS</span>
        </div>
        <div class="mech-grid">
          <div class="card mech">
            <div class="mech-no mono">A</div>
            <h3>docs/ 双语知识库</h3>
            <p>分层：AGENTS 指令 → architecture 地图 → subsystems 参考 → cookbook how-to → user 指南。英文为事实权威、中文为等权对应，近三十个 doc-sync 门禁机械校验配对、结构、预算与链接。</p>
          </div>
          <div class="card mech">
            <div class="mech-no mono">B</div>
            <h3>website/ 投影站点</h3>
            <p>不复制文档：website/docs.ts 发布清单 + 投影器 + VitePress 构建。站点只保留配置与清单，Markdown 全部留在 docs/ 各自的层级里，任何漂移由投影器与构建门禁兜底。</p>
          </div>
          <div class="card mech">
            <div class="mech-no mono">C</div>
            <h3>examples/ 示例即测试</h3>
            <p>六个可运行 cordis.yml 叶子，每个都有无密钥 Loader 冒烟与有密钥 e2e 两类冒烟，直接针对 postmortem 0001 的 ACP 默认导出丢失事故。</p>
          </div>
        </div>
        <DataTable
          v-if="checkpoints"
          :headers="checkpoints.headers"
          :rows="checkpoints.rows"
          :mono-cols="[1]"
          :sortable="false"
          style="margin-top: 14px"
        />
      </section>

      <!-- 三阶段分期 -->
      <section>
        <div class="section-title">
          <h2>文档生态三阶段</h2>
          <span class="en">PHASES · 建立 → 制度化 → 收口</span>
        </div>
        <DataTable
          v-if="stage3"
          :headers="stage3.headers"
          :rows="stage3.rows"
          :mono-cols="[1]"
          :sortable="false"
        />
      </section>

      <!-- 目录全景 + i18n -->
      <section class="grid-2">
        <div>
          <div class="section-title">
            <h2>docs/ 目录全景</h2>
            <span class="en">TREE · 实测 2026-08-13</span>
          </div>
          <DataTable
            v-if="panorama"
            :headers="panorama.headers"
            :rows="panorama.rows"
            :mono-cols="[0]"
            :num-cols="[1, 2, 3]"
            :sortable="false"
          />
        </div>
        <div>
          <div class="section-title">
            <h2>双语覆盖数据</h2>
            <span class="en">I18N COVERAGE</span>
          </div>
          <DataTable
            v-if="i18nCov"
            :headers="i18nCov.headers"
            :rows="i18nCov.rows"
            :mono-cols="[0]"
            :num-cols="[1, 2, 3]"
            :sortable="false"
          />
          <div class="section-title">
            <h2>subsystems 参考页</h2>
            <span class="en">46 PAGES</span>
          </div>
          <DataTable
            v-if="subsystems"
            :headers="subsystems.headers"
            :rows="subsystems.rows"
            :mono-cols="[0]"
            max-height="360px"
          />
        </div>
      </section>

      <!-- website 投影 -->
      <section>
        <div class="section-title">
          <h2>website 站点演进</h2>
          <span class="en">SITE EVOLUTION · 从复制到投影</span>
        </div>
        <DataTable
          v-if="siteEvo"
          :headers="siteEvo.headers"
          :rows="siteEvo.rows"
          :mono-cols="[1]"
          max-height="400px"
        />
      </section>

      <!-- examples + wheel -->
      <section class="grid-2">
        <div>
          <div class="section-title">
            <h2>六个示例叶子</h2>
            <span class="en">EXAMPLES</span>
          </div>
          <DataTable
            v-if="examples"
            :headers="examples.headers"
            :rows="examples.rows"
            :mono-cols="[0, 1]"
            :sortable="false"
          />
        </div>
        <div>
          <div class="section-title">
            <h2>Python SDK 两个发行物</h2>
            <span class="en">PYTHON · 四条 wheel</span>
          </div>
          <DataTable
            v-if="wheels"
            :headers="wheels.headers"
            :rows="wheels.rows"
            :mono-cols="[0]"
            :sortable="false"
          />
          <div class="section-title">
            <h2>README 演进</h2>
            <span class="en">FROM ONE LINE TO PRODUCT ENTRY</span>
          </div>
          <DataTable
            v-if="readmeEvo"
            :headers="readmeEvo.headers"
            :rows="readmeEvo.rows"
            :mono-cols="[1]"
            max-height="340px"
          />
        </div>
      </section>

      <!-- 发布时间线 -->
      <section>
        <div class="section-title">
          <h2>发布时间线：0.0.1-rc.1 → 0.1.0-rc.5</h2>
          <span class="en">RELEASES · 9 个 release(dsh) 提交</span>
        </div>
        <DataTable
          v-if="releases"
          :headers="releases.headers"
          :rows="releases.rows"
          :mono-cols="[1, 2]"
          :sortable="false"
        />
        <div class="section-title">
          <h2>相邻版本间隔分析</h2>
          <span class="en">INTERVALS</span>
        </div>
        <DataTable
          v-if="intervals"
          :headers="intervals.headers"
          :rows="intervals.rows"
          :mono-cols="[1]"
          :num-cols="[1]"
          :sortable="false"
        />
      </section>

      <!-- mermaid -->
      <section>
        <div class="section-title">
          <h2>文档生态图解</h2>
          <span class="en">DIAGRAMS · 原文直接渲染</span>
        </div>
        <div class="mmd-list">
          <div v-for="m in docsMermaid" :key="m.line" class="card">
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
.stat-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}
.mech-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.mech {
  position: relative;
}
.mech-no {
  position: absolute;
  top: 14px;
  right: 16px;
  font-size: 1.5rem;
  font-weight: 700;
  color: rgba(77, 107, 254, 0.25);
}
.mech h3 {
  font-size: 1.08rem;
  margin-bottom: 8px;
}
.mech p {
  font-size: 13px;
  color: var(--ink-3);
  line-height: 1.85;
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
@media (max-width: 980px) {
  .stat-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .mech-grid {
    grid-template-columns: 1fr;
  }
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
