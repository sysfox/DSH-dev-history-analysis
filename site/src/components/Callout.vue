<script setup>
import { inlineMd } from '../lib/util'

const props = defineProps({
  type: { type: String, required: true }, // NOTE | TIP | IMPORTANT | WARNING
  text: { type: String, default: '' },
  source: { type: String, default: '' }, // 可选出处（行号）
})

const LABEL = { NOTE: 'NOTE', TIP: 'TIP', IMPORTANT: 'IMPORTANT', WARNING: 'WARNING' }
const GLYPH = { NOTE: 'ⓘ', TIP: '✦', IMPORTANT: '▲', WARNING: '⚠' }
</script>

<template>
  <aside class="callout" :class="`callout-${type.toLowerCase()}`">
    <span class="callout-tag">{{ GLYPH[type] || 'ⓘ' }} {{ LABEL[type] || type }}</span>
    <span v-html="inlineMd(text)"></span>
    <span v-if="source" class="callout-src mono">{{ source }}</span>
  </aside>
</template>

<style scoped>
.callout-src {
  display: block;
  margin-top: 4px;
  font-size: 10.5px;
  color: var(--ink-4);
}
</style>
