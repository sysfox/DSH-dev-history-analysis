<script setup>
import { computed, ref } from 'vue'
import { inlineMd, cls } from '../lib/util'

const props = defineProps({
  headers: { type: Array, required: true },
  rows: { type: Array, required: true },
  monoCols: { type: Array, default: () => [] }, // 等宽字体列（hash/名称）
  numCols: { type: Array, default: () => [] }, // 数字右对齐列
  sortable: { type: Boolean, default: true },
  maxHeight: { type: String, default: '' },
  caption: { type: String, default: '' },
  footerRow: { type: [Array, Boolean], default: false }, // 末行高亮（合计）
  rowKey: { type: [String, Number], default: 0 }, // 行主键列（可选）
})

const sortIdx = ref(-1)
const sortDir = ref(1)

const sorted = computed(() => {
  const rows = props.rows
  if (sortIdx.value < 0) return rows
  const idx = sortIdx.value
  const dir = sortDir.value
  return [...rows].sort((a, b) => {
    const x = a[idx]
    const y = b[idx]
    const nx = Number(String(x).replace(/,/g, ''))
    const ny = Number(String(y).replace(/,/g, ''))
    if (!Number.isNaN(nx) && !Number.isNaN(ny)) return (nx - ny) * dir
    return String(x).localeCompare(String(y), 'zh-Hans-CN') * dir
  })
})

function clickHead(i) {
  if (!props.sortable) return
  if (sortIdx.value === i) sortDir.value *= -1
  else {
    sortIdx.value = i
    sortDir.value = 1
  }
}
</script>

<template>
  <figure class="dt-wrap" :style="maxHeight ? { maxHeight, overflow: 'auto' } : {}">
    <figcaption v-if="caption" class="dt-caption">{{ caption }}</figcaption>
    <table class="data dt">
      <thead>
        <tr>
          <th
            v-for="(h, i) in headers"
            :key="i"
            :class="{ 'num-th': numCols.includes(i), sortable: sortable }"
            :aria-sort="sortIdx === i ? (sortDir === 1 ? 'ascending' : 'descending') : undefined"
          >
            <button v-if="sortable" type="button" class="th-sort" @click="clickHead(i)">
              {{ h }}<span v-if="sortIdx === i" class="arr">{{ sortDir === 1 ? '▲' : '▼' }}</span>
            </button>
            <span v-else>{{ h }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(r, ri) in sorted"
          :key="rowKey === false ? ri : r[rowKey] ?? ri"
          :class="cls(footerRow && ri === sorted.length - 1 ? 'tfoot' : '')"
        >
          <td
            v-for="(c, ci) in r"
            :key="ci"
            :class="cls(monoCols.includes(ci) ? 'mono-cell' : '', numCols.includes(ci) ? 'num-cell' : '')"
            v-html="inlineMd(c)"
          ></td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>

<style scoped>
.dt-wrap {
  margin: 0;
  border: 1px solid var(--line-soft);
  border-radius: var(--r);
  background: var(--surface);
  overflow: auto;
}
.dt-caption {
  font-family: var(--font-m);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--ink-4);
  padding: 9px 14px 0;
  text-transform: uppercase;
}
table.data.dt {
  min-width: 560px;
}
</style>
