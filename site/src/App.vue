<script setup>
import TopNav from './components/TopNav.vue'
import ReadingProgress from './components/ReadingProgress.vue'
import SiteFooter from './components/SiteFooter.vue'
</script>

<template>
  <a class="skip-link" href="#main-content">跳到主要内容</a>
  <TopNav />
  <ReadingProgress />
  <main id="main-content">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>
  <SiteFooter />
</template>

<style scoped>
.skip-link {
  position: fixed;
  top: 8px;
  left: 12px;
  z-index: 500;
  padding: 8px 12px;
  border-radius: 7px;
  background: var(--cyan);
  color: var(--bg);
  font-weight: 700;
  transform: translateY(-160%);
  transition: transform 0.16s ease;
}
.skip-link:focus {
  transform: none;
  text-decoration: none;
}
</style>
