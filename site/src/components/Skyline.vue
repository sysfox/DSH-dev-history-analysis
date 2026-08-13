<script setup>
import { computed } from 'vue'
import { PHASES, phaseHexOf } from '../lib/data'

const props = defineProps({
  days: { type: Array, required: true }, // [{date:'2026-06-10', commits:2}]
  height: { type: Number, default: 190 },
  selected: { type: String, default: '' },
})
const emit = defineEmits(['select'])

const max = computed(() => Math.max(...props.days.map((d) => d.commits)))

const pct = (d) => Math.max(2, Math.round((d.commits / max.value) * 100))

// 月刻度：6 月 / 7 月 / 8 月，标签对准各自月份的中心（而非分界线）
const monthMarks = computed(() => {
  const days = props.days
  const june = days.filter((d) => d.date.startsWith('2026-06')).length
  const july = days.filter((d) => d.date.startsWith('2026-07')).length
  const aug = days.length - june - july
  return [
    { label: '6 月', at: Math.round(june / 2) },
    { label: '7 月', at: june + Math.round(july / 2) },
    { label: '8 月', at: june + july + Math.round(aug / 2) },
  ]
})

const phaseLegend = PHASES
</script>

<template>
  <div class="sky" :style="{ '--h': height + 'px' }">
    <div class="sky-bars" role="img" :aria-label="`65 天每日提交数柱状图，峰值 ${max} 次`">
      <button
        v-for="d in days"
        :key="d.date"
        class="sky-bar"
        :class="{ active: selected === d.date }"
        :style="{ height: pct(d) + '%', background: `linear-gradient(180deg, ${phaseHexOf(d.date)}, ${phaseHexOf(d.date)}cc)` }"
        :title="`${d.date} · ${d.commits} 次提交`"
        :aria-label="`${d.date}，${d.commits} 次提交`"
        @click="emit('select', d.date)"
      ></button>
    </div>
    <div class="sky-axis" aria-hidden="true">
      <span v-for="m in monthMarks" :key="m.label" :style="{ left: (m.at / days.length) * 100 + '%' }">{{ m.label }}</span>
    </div>
    <div v-if="days.length" class="sky-phases" aria-hidden="true">
      <span v-for="p in phaseLegend" :key="p.id" class="sky-phase">
        <i :style="{ background: p.color }"></i>{{ p.id }} {{ p.name }}
        <em class="mono">{{ p.range }}</em>
      </span>
    </div>
  </div>
</template>

<style scoped>
.sky {
  width: 100%;
}
.sky-bars {
  display: flex;
  align-items: flex-end;
  gap: 1.5px;
  height: var(--h);
  padding: 4px 2px 0;
  border-bottom: 1px solid var(--line);
}
.sky-bar {
  flex: 1;
  min-width: 2px;
  border: none;
  padding: 0;
  border-radius: 2px 2px 0 0;
  cursor: pointer;
  opacity: 0.82;
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.sky-bar:hover,
.sky-bar.active {
  opacity: 1;
  transform: scaleY(1.03);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.35);
  outline: none;
}
.sky-axis {
  position: relative;
  height: 22px;
  font-family: var(--font-m);
  font-size: 10.5px;
  color: var(--ink-4);
  border-bottom: 1px solid var(--line-soft);
}
.sky-axis span {
  position: absolute;
  top: 7px;
  transform: translateX(-50%);
  white-space: nowrap;
}
.sky-axis span::after {
  content: '';
  position: absolute;
  left: 50%;
  top: -8px;
  width: 1px;
  height: 7px;
  background: var(--line-soft);
}
.sky-phases {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin-top: 12px;
  padding: 0 2px;
}
.sky-phase {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ink-2);
}
.sky-phase i {
  width: 9px;
  height: 9px;
  border-radius: 2.5px;
}
.sky-phase em {
  font-style: normal;
  font-size: 10.5px;
  color: var(--ink-4);
}
</style>
