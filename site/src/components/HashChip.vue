<script setup>
import { computed, ref } from 'vue'
import { copyText } from '../lib/util'

const props = defineProps({
  hash: { type: String, required: true },
  copyable: { type: Boolean, default: true },
})

const copied = ref(false)
const clean = computed(() => String(props.hash).replace(/`/g, '').trim())

async function onClick() {
  if (!props.copyable) return
  copied.value = await copyText(clean.value)
  setTimeout(() => (copied.value = false), 1200)
}
</script>

<template>
  <code class="hash" :title="copyable ? '点击复制完整 hash' : ''" tabindex="0" @click="onClick" @keydown.enter="onClick">
    {{ clean }}
    <span v-if="copied" class="copied">✓ 已复制</span>
  </code>
</template>

<style scoped>
.hash {
  position: relative;
}
.copied {
  position: absolute;
  top: -22px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-3);
  border: 1px solid var(--line);
  color: var(--green);
  font-size: 10.5px;
  padding: 1px 8px;
  border-radius: 5px;
  white-space: nowrap;
  pointer-events: none;
}
</style>
