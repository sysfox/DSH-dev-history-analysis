<script setup>
import { numFmt } from '../lib/util'

defineProps({
  value: { type: [Number, String], required: true },
  label: { type: String, required: true },
  sub: { type: String, default: '' },
  tone: { type: String, default: '' }, // 对应 --ph1..5 / --cyan 等
})
</script>

<template>
  <div class="stat">
    <div class="stat-value" :style="tone ? { color: `var(--${tone})` } : {}">
      {{ typeof value === 'number' ? numFmt(value) : value }}
    </div>
    <div class="stat-label">{{ label }}</div>
    <div v-if="sub" class="stat-sub">{{ sub }}</div>
  </div>
</template>

<style scoped>
.stat {
  padding: 14px 18px;
  border: 1px solid var(--line-soft);
  border-radius: var(--r);
  background: linear-gradient(180deg, var(--surface), var(--bg-soft));
  min-width: 0;
}
.stat-value {
  font-family: var(--font-d);
  font-size: 1.9rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  color: var(--ink);
  white-space: nowrap;
}
.stat-label {
  font-size: 12.5px;
  color: var(--ink-2);
  margin-top: 2px;
}
.stat-sub {
  font-family: var(--font-m);
  font-size: 10.5px;
  color: var(--ink-4);
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
