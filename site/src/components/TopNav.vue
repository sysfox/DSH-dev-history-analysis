<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const mobileOpen = ref(false)
const links = [
  { to: '/', label: '概览', en: 'OVERVIEW' },
  { to: '/timeline', label: '时间线', en: 'TIMELINE' },
  { to: '/packages', label: '包结构', en: 'PACKAGES' },
  { to: '/architecture', label: '架构决策', en: 'ARCHITECTURE' },
  { to: '/infra', label: '基础设施', en: 'INFRA' },
  { to: '/docs', label: '文档生态', en: 'DOCS' },
  { to: '/contributors', label: '贡献者', en: 'CONTRIBUTORS' },
  { to: '/reader', label: '原文', en: 'SOURCE' },
]

watch(() => route.path, () => {
  mobileOpen.value = false
})
</script>

<template>
  <header class="topnav">
    <div class="container topnav-inner">
      <router-link to="/" class="brand" aria-label="回到概览">
        <span class="brand-sky" aria-hidden="true">
          <i v-for="(h, i) in [28, 42, 20, 60, 34, 80, 46, 68, 30, 52]" :key="i" :style="{ height: h + '%' }"></i>
        </span>
        <span class="brand-text">
          <b>dsh 开发历程</b>
          <small>DEVELOPMENT-HISTORY · 可视化</small>
        </span>
      </router-link>
      <button
        class="nav-toggle"
        type="button"
        :aria-expanded="mobileOpen"
        aria-controls="site-navigation"
        :aria-label="mobileOpen ? '关闭站点导航' : '打开站点导航'"
        @click="mobileOpen = !mobileOpen"
      >
        <span></span><span></span><span></span>
      </button>
      <nav id="site-navigation" class="nav-links" :class="{ open: mobileOpen }" aria-label="站点导航">
        <router-link
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="nav-link"
          :class="{ active: route.path === l.to }"
          :aria-current="route.path === l.to ? 'page' : undefined"
        >
          <span class="zh">{{ l.label }}</span>
          <span class="en">{{ l.en }}</span>
        </router-link>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.topnav {
  position: fixed;
  inset: 0 0 auto 0;
  height: var(--nav-h);
  z-index: 100;
  background: rgba(10, 15, 30, 0.82);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line-soft);
}
.topnav-inner {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 26px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--ink);
  flex: none;
}
.brand:hover {
  text-decoration: none;
}
.brand-sky {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 26px;
  width: 40px;
  padding: 2px 3px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
}
.brand-sky i {
  flex: 1;
  background: linear-gradient(180deg, var(--cyan), var(--blue));
  border-radius: 1.5px 1.5px 0 0;
  min-height: 3px;
  opacity: 0.9;
}
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.brand-text b {
  font-family: var(--font-d);
  font-size: 15.5px;
  letter-spacing: 0.02em;
}
.brand-text small {
  font-family: var(--font-m);
  font-size: 9.5px;
  letter-spacing: 0.14em;
  color: var(--ink-4);
}
.nav-links {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;
}
.nav-links::-webkit-scrollbar {
  display: none;
}
.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: 6px 13px;
  border-radius: 8px;
  color: var(--ink-3);
  border: 1px solid transparent;
  white-space: nowrap;
  min-height: 40px;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.nav-link .zh {
  font-size: 13.5px;
  line-height: 1.3;
}
.nav-link .en {
  font-family: var(--font-m);
  font-size: 8.5px;
  letter-spacing: 0.18em;
  color: var(--ink-4);
  line-height: 1.2;
}
.nav-link:hover {
  color: var(--ink);
  text-decoration: none;
  background: var(--surface-2);
}
.nav-link.active {
  color: var(--ink);
  border-color: rgba(77, 107, 254, 0.5);
  background: rgba(77, 107, 254, 0.12);
}
.nav-link.active .en {
  color: var(--blue);
}

@media (max-width: 900px) {
  .brand-text small {
    display: none;
  }
  .topnav-inner {
    gap: 12px;
  }
  .nav-link {
    padding: 6px 9px;
  }
  .nav-link .en {
    display: none;
  }
}

.nav-toggle {
  display: none;
  width: 40px;
  height: 40px;
  margin-left: auto;
  padding: 9px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-2);
  color: var(--ink-2);
  cursor: pointer;
}
.nav-toggle span {
  display: block;
  height: 2px;
  margin: 4px 0;
  border-radius: 2px;
  background: currentColor;
}

@media (max-width: 760px) {
  .topnav-inner {
    gap: 8px;
  }
  .brand-text b {
    font-size: 14px;
  }
  .nav-toggle {
    display: block;
  }
  .nav-links {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    display: none;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: rgba(17, 26, 48, 0.98);
    box-shadow: var(--shadow);
  }
  .nav-links.open {
    display: flex;
  }
  .nav-link {
    align-items: flex-start;
    padding: 9px 12px;
  }
  .nav-link .en {
    display: block;
  }
}

@media (max-width: 420px) {
  .brand-text {
    display: none;
  }
  .brand-sky {
    width: 42px;
  }
}
</style>
