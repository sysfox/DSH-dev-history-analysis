<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const progress = ref(0)
let frame = 0

function update() {
  if (frame) return
  frame = requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    progress.value = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    frame = 0
  })
}

onMounted(() => {
  window.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update)
  update()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', update)
  window.removeEventListener('resize', update)
  if (frame) cancelAnimationFrame(frame)
})
</script>

<template>
  <div class="reading-progress" aria-hidden="true">
    <span :style="{ transform: `scaleX(${progress})` }"></span>
  </div>
</template>

<style scoped>
.reading-progress {
  position: fixed;
  top: var(--nav-h);
  left: 0;
  right: 0;
  z-index: 101;
  height: 2px;
  pointer-events: none;
  background: rgba(23, 33, 60, 0.7);
}
.reading-progress span {
  display: block;
  width: 100%;
  height: 100%;
  transform-origin: left center;
  background: linear-gradient(90deg, var(--blue), var(--cyan));
  transition: transform 0.12s linear;
}
</style>
