<script setup>
import { ref, watch, onMounted } from 'vue'
import { initMermaid, renderMermaidSvg } from '../lib/mermaid'

const props = defineProps({
  code: { type: String, required: true },
  title: { type: String, default: '' },
})

const el = ref(null)
const error = ref('')

initMermaid()

async function render() {
  error.value = ''
  try {
    const svg = await renderMermaidSvg(props.code)
    if (el.value) el.value.innerHTML = svg
  } catch (e) {
    error.value = `mermaid 渲染失败：${e.message || e}`
  }
}

onMounted(render)
watch(() => props.code, render)
</script>

<template>
  <figure class="mmd" :class="{ 'has-title': title }">
    <figcaption v-if="title" class="mmd-title">{{ title }}</figcaption>
    <div ref="el" class="mermaid-host"></div>
    <pre v-if="error" class="mermaid-error">{{ error }}</pre>
  </figure>
</template>

<style scoped>
.mmd-title {
  font-family: var(--font-m);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--ink-4);
  text-transform: uppercase;
  margin-bottom: 2px;
}
</style>
