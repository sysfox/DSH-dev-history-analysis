<script setup>
import TopNav from './components/TopNav.vue'
import SiteFooter from './components/SiteFooter.vue'
</script>

<template>
  <TopNav />
  <router-view v-slot="{ Component }">
    <transition name="page" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
  <SiteFooter />
</template>
