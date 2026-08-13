<script setup>
import { PHASES } from '../lib/data'

const props = defineProps({
  phase: { type: Number, required: true },
})
const p = PHASES[props.phase - 1]
</script>

<template>
  <span class="pbadge" :style="{ '--pc': p.color }">
    <i></i>{{ p.id }} · {{ p.name }}
  </span>
</template>

<style scoped>
.pbadge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ink-2);
  white-space: nowrap;
}
.pbadge i {
  width: 8px;
  height: 8px;
  border-radius: 2.5px;
  background: var(--pc);
}
</style>
