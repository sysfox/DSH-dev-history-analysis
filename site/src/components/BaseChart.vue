<script setup>
import { computed, inject, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  option: { type: Object, required: true },
  height: { type: String, default: '360px' },
})
const emit = defineEmits(['click'])

// 处于 ChartZoom 放大弹层内时，高度按比例放大
const zoomBig = inject('chartZoomBig', null)
const effectiveHeight = computed(() => {
  if (!zoomBig || !zoomBig.value) return props.height
  const base = parseFloat(props.height) || 320
  return `${Math.min(Math.max(base * 1.5, 440), 640)}px`
})

const el = ref(null)
let chart = null
let ro = null

onMounted(() => {
  chart = echarts.init(el.value, null, { renderer: 'canvas' })
  chart.setOption(props.option)
  chart.on('click', (p) => emit('click', p))
  ro = new ResizeObserver(() => chart && chart.resize())
  ro.observe(el.value)
})

watch(
  () => props.option,
  (o) => {
    if (chart) chart.setOption(o, { notMerge: false })
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (ro) ro.disconnect()
  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>

<template>
  <div ref="el" class="base-chart" :style="{ height: effectiveHeight }"></div>
</template>

<style scoped>
.base-chart {
  width: 100%;
}
</style>
