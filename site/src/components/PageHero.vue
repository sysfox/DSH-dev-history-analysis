<script setup>
defineProps({
  kicker: { type: String, default: '' }, // 章节眉题，如 第四章 / 时间线
  title: { type: String, required: true },
  lead: { type: String, default: '' },
})
</script>

<template>
  <section class="page-hero">
    <div class="container">
      <div class="eyebrow">{{ kicker }}</div>
      <h1>{{ title }}</h1>
      <p v-if="lead" class="lead">{{ lead }}</p>
      <slot />
    </div>
  </section>
</template>

<style scoped>
.page-hero {
  padding: 46px 0 10px;
}
.page-hero h1 {
  font-size: clamp(1.9rem, 4.6vw, 2.9rem);
  font-weight: 700;
  margin-top: 12px;
  letter-spacing: 0.01em;
}
.page-hero .lead {
  margin-top: 14px;
  max-width: 820px;
  color: var(--ink-2);
  font-size: 15px;
  line-height: 1.9;
}
</style>
