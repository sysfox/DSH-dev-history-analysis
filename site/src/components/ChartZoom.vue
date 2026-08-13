<script setup>
// 图表放大查看：包裹任意图表（ECharts / mermaid / 自定义 SVG），
// 悬停出现「放大」按钮；无内置点击交互的图表可直接点击图表本身打开大图弹层。
// 弹层内会重新渲染一份插槽内容（ECharts 重新 init、mermaid 重新 render），
// 并通过 provide('chartZoomBig') 告知内部图表放大尺寸。
import { nextTick, onBeforeUnmount, provide, ref, watch } from 'vue'

const props = defineProps({
  title: { type: String, default: '图表' },
  // 图表自身已有点击交互（选中某天 / 钻取节点）时置 true，避免抢占点击
  clickable: { type: Boolean, default: false },
})

const open = ref(false)
provide('chartZoomBig', open)

const closeBtn = ref(null)
let previousFocus = null

function openModal() {
  previousFocus = document.activeElement
  open.value = true
  nextTick(() => closeBtn.value && closeBtn.value.focus())
}
function close() {
  open.value = false
  nextTick(() => previousFocus?.focus?.())
}
function onWrapClick() {
  if (!props.clickable) openModal()
}
function onKey(e) {
  if (e.key === 'Escape') close()
}

watch(open, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
  if (v) window.addEventListener('keydown', onKey)
  else window.removeEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="chart-zoom" :class="{ 'is-clickable': clickable }" @click="onWrapClick">
    <slot />
    <button
      class="zoom-btn"
      type="button"
      :title="`放大查看：${title}`"
      :aria-label="`放大查看：${title}`"
      @click.stop="openModal"
    >
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M15 3h6v6" />
        <path d="M9 21H3v-6" />
        <path d="M21 3l-7 7" />
        <path d="M3 21l7-7" />
      </svg>
      <span class="zoom-btn-label">放大</span>
    </button>

    <Teleport to="body">
      <div v-if="open" class="zoom-overlay" @click.self="close">
        <div class="zoom-panel" role="dialog" aria-modal="true" :aria-label="`放大查看：${title}`">
          <header class="zoom-head">
            <span class="zoom-title">{{ title }}</span>
             <button ref="closeBtn" class="zoom-close" type="button" aria-label="关闭图表弹层" title="关闭（Esc）" @click="close">✕</button>
          </header>
          <div class="zoom-body">
            <slot />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.chart-zoom {
  position: relative;
}
.zoom-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 6;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 40px;
  padding: 7px 10px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  background: rgba(10, 15, 30, 0.72);
  color: #cbd5e1;
  font-size: 12px;
  font-family: inherit;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transform: translateY(-2px);
  transition: opacity 0.18s ease, transform 0.18s ease, border-color 0.18s ease, color 0.18s ease;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.chart-zoom:hover .zoom-btn,
.zoom-btn:focus-visible {
  opacity: 1;
  transform: none;
}
.zoom-btn:hover {
  color: #fff;
  border-color: rgba(77, 107, 254, 0.65);
}
@media (hover: none) {
  .zoom-btn {
    opacity: 1;
    transform: none;
  }
}
@media (max-width: 480px) {
  .zoom-btn-label {
    display: none;
  }
}

/* ---- 弹层 ---- */
.zoom-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(3, 7, 18, 0.8);
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);
  animation: zoom-fade 0.16s ease;
}
.zoom-panel {
  width: min(94vw, 1240px);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: #0d1428;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
  overflow: hidden;
  animation: zoom-pop 0.18s cubic-bezier(0.2, 0.9, 0.3, 1.15);
}
.zoom-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  flex: none;
}
.zoom-title {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.zoom-close {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  flex: none;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease;
}
.zoom-close:hover {
  color: #fff;
  border-color: rgba(77, 107, 254, 0.7);
  background: rgba(77, 107, 254, 0.12);
}
.zoom-body {
  padding: 18px;
  overflow: auto;
}

/* mermaid svg 在放大弹层内自适应宽度（svg 自带 viewBox，可等比缩放） */
.zoom-body svg {
  max-width: 100%;
  height: auto;
}

@keyframes zoom-fade {
  from {
    opacity: 0;
  }
}
@keyframes zoom-pop {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
}
</style>
