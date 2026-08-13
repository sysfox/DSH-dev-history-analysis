<script setup>
import { computed, ref } from 'vue'
import { copyText } from '../lib/util'

const props = defineProps({
  hash: { type: String, required: true },
  copyable: { type: Boolean, default: true },
})

const copyState = ref('')
const clean = computed(() => String(props.hash).replace(/`/g, '').trim())

async function onClick() {
  if (!props.copyable) return
  copyState.value = (await copyText(clean.value)) ? 'success' : 'error'
  setTimeout(() => (copyState.value = ''), 1600)
}
</script>

<template>
  <code
    class="hash"
    :class="{ copyable }"
    :title="copyable ? '点击复制完整 hash' : ''"
    :tabindex="copyable ? 0 : undefined"
    :role="copyable ? 'button' : undefined"
    :aria-label="copyable ? `复制 hash ${clean}` : undefined"
    @click="onClick"
    @keydown.enter="onClick"
    @keydown.space.prevent="onClick"
  >
    {{ clean }}
    <span v-if="copyState" class="copied" aria-live="polite">
      {{ copyState === 'success' ? '✓ 已复制' : '复制失败' }}
    </span>
  </code>
</template>

<style scoped>
.hash {
  position: relative;
}
.hash.copyable {
  cursor: pointer;
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
