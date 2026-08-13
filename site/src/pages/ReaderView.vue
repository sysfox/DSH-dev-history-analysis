<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github-dark.css'
import { doc } from '../lib/data'
import { ghSlug, escapeHtml } from '../lib/util'
import { initMermaid, renderMermaidSvg } from '../lib/mermaid'
import rawMd from '../../../DEVELOPMENT-HISTORY.md?raw'

const route = useRoute()
const tocOpen = ref(true)
const mobilePanel = ref('')

// ---- markdown-it 实例 ----
const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
  highlight(str, lang) {
    if (lang === 'mermaid') return ''
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
      } catch {
        /* fallthrough */
      }
    }
    return escapeHtml(str)
  },
})

// callout 插件：> [!TYPE] → 带 class 的 div
md.core.ruler.after('block', 'callouts', (state) => {
  const tokens = state.tokens
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (t.type !== 'blockquote_open') continue
    let depth = 0
    for (let j = i + 1; j < tokens.length; j++) {
      const tj = tokens[j]
      if (tj.type === 'blockquote_open') depth++
      else if (tj.type === 'blockquote_close') {
        if (depth === 0) break
        depth--
      } else if (tj.type === 'inline' && depth === 0) {
        const first = tj.children?.[0]
        if (first && first.type === 'text') {
          const m = first.content.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING)\]\s*/i)
          if (m) {
            t.attrs = [['class', `callout callout-${m[1].toLowerCase()}`]]
            first.content = first.content.slice(m[0].length)
            if (!first.content) tj.children.shift()
          }
        }
        break
      }
    }
  }
})

// ---- 标题 id（ghSlug + 去重），正文与 TOC 共用 ----
const headings = doc.headings
const slugMap = new Map() // line -> id
const usedSlugs = new Set()
for (const h of headings) {
  let id = ghSlug(h.text) || 'section'
  let base = id
  let n = 2
  while (usedSlugs.has(id)) id = `${base}-${n++}`
  usedSlugs.add(id)
  slugMap.set(h.line, id)
}

const rawLines = rawMd.split('\n')
const readerSections = ref([])

function createReaderSections() {
  const starts = [0]
  let inFence = false
  rawLines.forEach((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      return
    }
    if (!inFence && index > 0 && /^##\s+/.test(line)) starts.push(index)
  })
  return starts.map((start, index) => {
    const end = starts[index + 1] ?? rawLines.length
    return {
      id: slugMap.get(start + 1) || `reader-section-${index}`,
      source: rawLines.slice(start, end).join('\n'),
      startLine: start + 1,
      endLine: end,
      estimatedHeight: Math.max(180, Math.min(24000, (end - start) * 22)),
      html: '',
      loading: false,
      loaded: false,
      el: null,
    }
  })
}

readerSections.value = createReaderSections()

const defaultHeadingOpen = md.renderer.rules.heading_open
md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
  const tok = tokens[idx]
  const line = (tok.map ? tok.map[0] + 1 : 0) + (env?.lineOffset || 0)
  const id = slugMap.get(line) || `h-${line}`
  return `<h${tok.tag.slice(1)} id="${id}" data-line="${line}"><a class="h-anchor" href="#${id}" aria-label="链接到本节">#</a>`
}

const defaultFence = md.renderer.rules.fence
md.renderer.rules.fence = (tokens, idx) => {
  const t = tokens[idx]
  const lang = (t.info || '').trim()
  if (lang === 'mermaid') {
    return `<div class="mermaid-host" data-mermaid="true">${escapeHtml(t.content)}</div>`
  }
  const code = md.options.highlight(t.content, lang)
  return `<div class="code-block"><span class="code-lang">${escapeHtml(lang || 'text')}</span><pre><code class="hljs">${code}</code></pre></div>`
}

// ---- 搜索 ----
const query = ref('')
const searchResults = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  const out = []
  for (let i = 0; i < rawLines.length && out.length < 150; i++) {
    const l = rawLines[i]
    if (l.trim() && l.toLowerCase().includes(q)) {
      out.push({ line: i + 1, text: l.trim().slice(0, 90) })
    }
  }
  return out
})

function headingForLine(line) {
  let best = null
  for (const h of headings) {
    if (h.level >= 2 && h.line <= line) best = h
    else if (h.line > line) break
  }
  return best
}

function sectionForLine(line) {
  return readerSections.value.find((section) => line >= section.startLine && line <= section.endLine)
}

function sectionForId(id) {
  const heading = headings.find((h) => slugMap.get(h.line) === id)
  return heading ? sectionForLine(heading.line) : null
}

async function jumpToLine(line) {
  mobilePanel.value = ''
  const h = headingForLine(line)
  const id = h ? slugMap.get(h.line) : null
  await renderSection(sectionForLine(h?.line || line))
  await nextTick()
  const el = id ? document.getElementById(id) : null
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    flash(el)
  }
}

function clearSearch() {
  query.value = ''
}

function toggleMobilePanel(panel) {
  mobilePanel.value = mobilePanel.value === panel ? '' : panel
}

function flash(el) {
  el.classList.add('flash')
  setTimeout(() => el.classList.remove('flash'), 1600)
}

async function jumpToHash(hash) {
  if (!hash) return
  mobilePanel.value = ''
  await renderSection(sectionForId(hash.slice(1)))
  await nextTick()
  const el = document.getElementById(hash.slice(1))
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    flash(el)
  }
}

// ---- TOC 树 ----
const toc = computed(() => {
  const root = []
  let curH2 = null
  let curH3 = null
  for (const h of headings) {
    if (h.level === 1) continue
    const item = { ...h, id: slugMap.get(h.line), children: [] }
    if (h.level === 2) {
      curH2 = item
      curH3 = null
      root.push(item)
    } else if (h.level === 3 && curH2) {
      curH3 = item
      curH2.children.push(item)
    } else if (h.level === 4 && curH3) {
      curH3.children.push(item)
    }
  }
  return root
})

const activeId = ref('')
let observer = null
let mermaidObserver = null
let sectionObserver = null

function setupSpy() {
  observer && observer.disconnect()
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) activeId.value = e.target.id
      }
    },
    { rootMargin: '-70px 0px -70% 0px' }
  )
  const el = contentRef.value
  if (!el) return
  el.querySelectorAll('h2[id], h3[id], h4[id]').forEach((n) => observer.observe(n))
}

// ---- 渲染 ----
const contentRef = ref(null)
const rendered = ref(false)
const stats = computed(() => ({
  lines: doc.meta.totalLines,
  headings: doc.headings.filter((h) => h.level >= 2).length,
  tables: doc.tables.length,
  callouts: doc.callouts.length,
  mermaid: doc.mermaid.length,
  code: doc.codeBlocks.length,
}))

function setSectionEl(section, el) {
  if (!el) return
  section.el = el
  el.__readerSection = section
  if (sectionObserver) sectionObserver.observe(el)
}

function resolveInternalLinks(root) {
  const norm = (s) => s.toLowerCase().replace(/[·（）()、，。：:*/."'“”’‘<>#%]+/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
  root.querySelectorAll('a[href^="#"]').forEach((a) => {
    const target = a.getAttribute('href').slice(1)
    const known = headings.some((h) => slugMap.get(h.line) === target)
    if (known || document.getElementById(target)) return
    const wanted = norm(target)
    const hit = headings.find((h) => norm(h.text) === wanted)
    if (hit) a.setAttribute('href', `#${slugMap.get(hit.line)}`)
  })
}

function onContentClick(e) {
  const link = e.target?.closest?.('a[href^="#"]')
  if (!link) return
  const target = link.getAttribute('href')?.slice(1)
  if (!target || !sectionForId(target)) return
  e.preventDefault()
  jumpToHash(`#${target}`)
}

async function renderMermaidHost(host) {
  if (host.dataset.rendered) return
  host.dataset.rendered = 'loading'
  const code = host.textContent || ''
  host.textContent = ''
  host.classList.add('is-pending')
  try {
    host.innerHTML = await renderMermaidSvg(code)
    host.classList.remove('is-pending')
    host.dataset.rendered = 'true'
  } catch (e) {
    host.classList.remove('is-pending')
    host.innerHTML = `<pre class="mermaid-error">mermaid 渲染失败：${escapeHtml(String(e.message || e))}</pre>`
    host.dataset.rendered = 'error'
  }
}

function observeMermaidHosts(root) {
  const hosts = [...root.querySelectorAll('.mermaid-host[data-mermaid]')]
  if (!hosts.length) return
  if (!mermaidObserver && 'IntersectionObserver' in window) {
    mermaidObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          mermaidObserver.unobserve(entry.target)
          renderMermaidHost(entry.target)
        }
      },
      { rootMargin: '360px 0px' }
    )
  }
  if (mermaidObserver) hosts.forEach((host) => mermaidObserver.observe(host))
  else hosts.forEach((host) => renderMermaidHost(host))
}

async function renderSection(section) {
  if (!section || section.loading || section.loaded) return
  section.loading = true
  try {
    section.html = md.render(section.source, { lineOffset: section.startLine - 1 })
    section.loaded = true
    await nextTick()
    if (section.el) {
      resolveInternalLinks(section.el)
      observeMermaidHosts(section.el)
    }
    setupSpy()
  } catch (e) {
    section.html = `<p class="mermaid-error">文档片段渲染失败：${escapeHtml(String(e.message || e))}</p>`
  } finally {
    section.loading = false
  }
}

function setupSectionObserver() {
  if (!('IntersectionObserver' in window)) {
    readerSections.value.forEach((section) => renderSection(section))
    return
  }
  sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) renderSection(entry.target.__readerSection)
      }
    },
    { rootMargin: '720px 0px' }
  )
  readerSections.value.forEach((section) => section.el && sectionObserver.observe(section.el))
}

async function renderDoc() {
  readerSections.value = createReaderSections()
  rendered.value = true
  await nextTick()
  const el = contentRef.value
  if (!el) return
  setupSectionObserver()
  await Promise.all(readerSections.value.slice(0, 2).map(renderSection))
  setupSpy()
  if (route.hash) jumpToHash(route.hash)
}

onMounted(() => {
  if (window.matchMedia('(max-width: 980px)').matches) tocOpen.value = false
  renderDoc()
})

watch(
  () => route.hash,
  (h) => {
    if (rendered.value && h) jumpToHash(h)
  }
)

onBeforeUnmount(() => {
  observer && observer.disconnect()
  mermaidObserver && mermaidObserver.disconnect()
  sectionObserver && sectionObserver.disconnect()
})

// 回到顶部
function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="page reader-page">
    <div class="container reader-head">
      <div class="eyebrow">FULL TEXT · 原文阅读</div>
      <h1>DEVELOPMENT-HISTORY.md</h1>
      <p class="lead">
        整篇文档的忠实渲染：Markdown、表格、callout 与 mermaid 图全部由原文直接生成，可搜索、可跳转、可核对行号。
      </p>
      <div class="reader-stats">
        <span class="chip"><i class="dot" style="background: var(--blue)"></i>{{ stats.lines }} 行</span>
        <span class="chip"><i class="dot" style="background: var(--cyan)"></i>{{ stats.headings }} 个标题</span>
        <span class="chip"><i class="dot" style="background: var(--ph3)"></i>{{ stats.tables }} 张表格</span>
        <span class="chip"><i class="dot" style="background: var(--ph5)"></i>{{ stats.mermaid }} 幅 mermaid 图</span>
        <span class="chip"><i class="dot" style="background: var(--ph4)"></i>{{ stats.callouts }} 条 callout</span>
      </div>
    </div>

    <div class="reader-body container">
      <!-- 移动端工具栏：脱离桌面侧栏，始终贴在站点导航下方 -->
      <div class="reader-mobile-nav">
        <div class="mobile-nav-actions">
          <button
            class="mobile-nav-button"
            type="button"
            :aria-expanded="mobilePanel === 'search'"
            aria-controls="mobile-reader-search"
            @click="toggleMobilePanel('search')"
          >
            <span aria-hidden="true">⌕</span>搜索
          </button>
          <button
            class="mobile-nav-button"
            type="button"
            :aria-expanded="mobilePanel === 'toc'"
            aria-controls="mobile-reader-toc"
            @click="toggleMobilePanel('toc')"
          >
            <span aria-hidden="true">☷</span>目录 · {{ toc.length }} 章
          </button>
        </div>
        <div v-if="mobilePanel === 'search'" id="mobile-reader-search" class="mobile-nav-panel">
          <div class="search-wrap">
            <input
              v-model="query"
              type="search"
              class="search-box"
              name="mobile-reader-search"
              autocomplete="off"
              placeholder="搜索全文…"
              aria-label="搜索全文"
              aria-controls="mobile-search-results"
              @keydown.escape="mobilePanel = ''"
            />
            <button v-if="query" type="button" class="search-clear" aria-label="清除搜索" @click="clearSearch">×</button>
          </div>
          <div v-if="searchResults.length" id="mobile-search-results" class="search-results">
            <div class="search-count">{{ searchResults.length }} 个匹配，点击跳到所属章节</div>
            <button v-for="r in searchResults" :key="r.line" class="search-hit" @click="jumpToLine(r.line)">
              <span class="mono hit-line">L{{ r.line }}</span>
              <span class="hit-text">{{ r.text }}</span>
            </button>
            <div v-if="searchResults.length >= 150" class="search-more">仅显示前 150 条，请细化关键词</div>
          </div>
          <div v-else-if="query" class="search-empty">无匹配行</div>
        </div>
        <div v-if="mobilePanel === 'toc'" id="mobile-reader-toc" class="mobile-nav-panel mobile-toc-panel">
          <div class="toc-scroll">
            <template v-for="h2 in toc" :key="h2.id">
              <a :href="`#${h2.id}`" class="toc-h2" :class="{ on: activeId === h2.id }" @click.prevent="jumpToHash(`#${h2.id}`)">
                {{ h2.text }}
              </a>
              <template v-for="h3 in h2.children" :key="h3.id">
                <a :href="`#${h3.id}`" class="toc-h3" :class="{ on: activeId === h3.id }" @click.prevent="jumpToHash(`#${h3.id}`)">
                  {{ h3.text }}
                </a>
                <a
                  v-for="h4 in h3.children"
                  :key="h4.id"
                  :href="`#${h4.id}`"
                  class="toc-h4"
                  :class="{ on: activeId === h4.id }"
                  @click.prevent="jumpToHash(`#${h4.id}`)"
                >
                  {{ h4.text }}
                </a>
              </template>
            </template>
          </div>
        </div>
      </div>

      <!-- 侧栏：搜索 + TOC -->
      <aside class="reader-side">
        <div class="side-card">
           <div class="search-wrap">
             <input
               v-model="query"
               type="search"
               class="search-box"
               name="reader-search"
               autocomplete="off"
               placeholder="搜索全文…"
               aria-label="搜索全文"
               aria-controls="search-results"
               @keydown.escape="clearSearch"
             />
             <button v-if="query" type="button" class="search-clear" aria-label="清除搜索" @click="clearSearch">×</button>
           </div>
           <div v-if="searchResults.length" class="search-results">
             <div id="search-results" class="search-count">{{ searchResults.length }} 个匹配，点击跳到所属章节</div>
             <button v-for="r in searchResults" :key="r.line" class="search-hit" @click="jumpToLine(r.line)">
              <span class="mono hit-line">L{{ r.line }}</span>
              <span class="hit-text">{{ r.text }}</span>
            </button>
            <div v-if="searchResults.length >= 150" class="search-more">仅显示前 150 条，请细化关键词</div>
          </div>
          <div v-else-if="query" class="search-empty">无匹配行</div>
        </div>
        <nav class="toc side-card" aria-label="目录">
          <div class="toc-head">
            <div class="toc-title mono">目录 · {{ toc.length }} 章</div>
            <button
              class="toc-toggle"
              type="button"
              :aria-expanded="tocOpen"
              aria-controls="reader-toc-scroll"
              @click="tocOpen = !tocOpen"
            >
              {{ tocOpen ? '收起' : '展开' }}
              <svg viewBox="0 0 16 16" aria-hidden="true" :class="{ rotated: !tocOpen }">
                <path d="m4 6 4 4 4-4" />
              </svg>
            </button>
          </div>
          <div v-show="tocOpen" id="reader-toc-scroll" class="toc-scroll">
            <template v-for="h2 in toc" :key="h2.id">
              <a :href="`#${h2.id}`" class="toc-h2" :class="{ on: activeId === h2.id }" @click.prevent="jumpToHash(`#${h2.id}`)">
                {{ h2.text }}
              </a>
              <template v-for="h3 in h2.children" :key="h3.id">
                <a :href="`#${h3.id}`" class="toc-h3" :class="{ on: activeId === h3.id }" @click.prevent="jumpToHash(`#${h3.id}`)">
                  {{ h3.text }}
                </a>
                <a
                  v-for="h4 in h3.children"
                  :key="h4.id"
                  :href="`#${h4.id}`"
                  class="toc-h4"
                  :class="{ on: activeId === h4.id }"
                  @click.prevent="jumpToHash(`#${h4.id}`)"
                >
                  {{ h4.text }}
                </a>
              </template>
            </template>
          </div>
        </nav>
      </aside>

      <!-- 正文 -->
      <main ref="contentRef" class="reader-main">
        <div v-if="rendered" class="md-body" @click="onContentClick">
          <section
            v-for="section in readerSections"
            :key="section.id"
            :ref="(el) => setSectionEl(section, el)"
            class="md-section"
            :class="{ loaded: section.loaded }"
            :data-section-id="section.id"
            :style="{ '--section-min-height': `${section.estimatedHeight}px` }"
          >
            <div v-if="section.html" v-html="section.html"></div>
            <div v-else class="section-loading">文档片段将在接近视口时加载…</div>
          </section>
        </div>
        <div v-else class="reading">正在渲染 5,567 行…</div>
        <button class="to-top btn" @click="toTop">↑ 回到顶部</button>
      </main>
    </div>
  </div>
</template>

<style scoped>
.reader-head {
  padding-top: 30px;
}
.reader-head h1 {
  font-size: clamp(1.7rem, 4vw, 2.4rem);
  margin-top: 10px;
}
.reader-head .lead {
  color: var(--ink-2);
  margin-top: 10px;
  max-width: 760px;
}
.reader-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.reader-body {
  display: grid;
  grid-template-columns: minmax(0, 292px) minmax(0, 1fr);
  gap: 26px;
  margin-top: 26px;
  align-items: start;
}
.reader-mobile-nav {
  display: none;
}
.reader-side {
  min-width: 0;
  position: sticky;
  top: calc(var(--nav-h) + 16px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - var(--nav-h) - 32px);
}
.side-card {
  border: 1px solid var(--line-soft);
  border-radius: var(--r);
  background: var(--surface);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.search-box {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--bg-soft);
  color: var(--ink);
  font-size: 13px;
  font-family: var(--font-b);
}
.search-wrap {
  position: relative;
}
.search-clear {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--ink-3);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.search-clear:hover {
  color: var(--ink);
  background: var(--surface-2);
}
.search-count {
  padding: 3px 8px 5px;
  color: var(--ink-4);
  font-family: var(--font-m);
  font-size: 10.5px;
}
.search-box:focus {
  outline: none;
  border-color: var(--blue);
}
.search-results {
  max-height: 260px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.search-hit {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 8px;
  align-items: baseline;
  padding: 5px 8px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--ink-2);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  font-family: var(--font-b);
}
.search-hit:hover {
  background: rgba(77, 107, 254, 0.12);
}
.hit-line {
  color: var(--cyan);
  font-size: 10.5px;
}
.hit-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.search-more,
.search-empty {
  font-size: 11.5px;
  color: var(--ink-4);
  padding: 6px 8px;
}
.toc {
  flex: 1;
  min-height: 0;
}
.toc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.toc-title {
  font-size: 10.5px;
  letter-spacing: 0.16em;
  color: var(--ink-4);
  padding: 0 4px;
}
.toc-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 32px;
  padding: 4px 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface-2);
  color: var(--ink-3);
  font-size: 11px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.toc-toggle:hover {
  border-color: var(--blue);
  color: var(--ink);
  background: rgba(77, 107, 254, 0.12);
}
.toc-toggle svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  transition: transform 0.15s ease;
}
.toc-toggle svg.rotated {
  transform: rotate(-90deg);
}
.toc-scroll {
  min-width: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-right: 2px;
}
.toc-h2,
.toc-h3,
.toc-h4 {
  display: block;
  color: var(--ink-3);
  border-radius: 5px;
  padding: 3px 8px;
  font-size: 12.5px;
  line-height: 1.5;
  border-left: 2px solid transparent;
  overflow-wrap: anywhere;
}
.toc-h2 {
  color: var(--ink-2);
  font-weight: 600;
  margin-top: 4px;
}
.toc-h3 {
  padding-left: 18px;
  font-size: 12px;
}
.toc-h4 {
  padding-left: 30px;
  font-size: 11px;
  color: var(--ink-4);
}
.toc-h2:hover,
.toc-h3:hover,
.toc-h4:hover {
  color: var(--ink);
  text-decoration: none;
  background: var(--surface-2);
}
.toc-h2.on,
.toc-h3.on,
.toc-h4.on {
  color: var(--cyan);
  border-left-color: var(--cyan);
  background: rgba(56, 189, 248, 0.07);
}
.reader-main {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  overflow-x: hidden;
}
.md-section {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  min-height: var(--section-min-height);
  content-visibility: auto;
  contain-intrinsic-size: auto var(--section-min-height);
}
.md-section.loaded {
  min-height: 0;
}
.section-loading {
  display: grid;
  min-height: 180px;
  place-items: center;
  color: var(--ink-4);
  font-family: var(--font-m);
  font-size: 11px;
}
.reading {
  color: var(--ink-4);
  font-family: var(--font-m);
  padding: 40px 0;
}
.to-top {
  margin-top: 26px;
}
</style>

<style>
/* 正文 markdown 排版（非 scoped：作用于 v-html 内容） */
.md-body {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  color: var(--ink-2);
  font-size: 14.5px;
  line-height: 1.85;
}
.md-body > :first-child {
  margin-top: 0;
}
.md-body h1 {
  font-size: 1.7rem;
  margin: 34px 0 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line-soft);
  color: var(--ink);
}
.md-body h2 {
  font-size: 1.35rem;
  margin: 34px 0 12px;
  color: var(--ink);
}
.md-body h3 {
  font-size: 1.12rem;
  margin: 26px 0 10px;
  color: var(--ink);
}
.md-body h4 {
  font-size: 1rem;
  margin: 20px 0 8px;
  color: var(--ink);
}
.md-body h1[id],
.md-body h2[id],
.md-body h3[id],
.md-body h4[id] {
  scroll-margin-top: calc(var(--nav-h) + 20px);
}
.md-body .h-anchor {
  opacity: 0;
  color: var(--ink-4);
  font-family: var(--font-m);
  font-size: 0.8em;
  margin-right: 8px;
  text-decoration: none;
  user-select: none;
}
.md-body h1:hover .h-anchor,
.md-body h2:hover .h-anchor,
.md-body h3:hover .h-anchor,
.md-body h4:hover .h-anchor {
  opacity: 1;
}
.md-body p {
  margin: 10px 0;
}
.md-body strong {
  color: var(--ink);
}
.md-body a {
  color: var(--cyan);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.md-body ul,
.md-body ol {
  margin: 10px 0;
  padding-left: 1.6em;
}
.md-body li {
  margin: 4px 0;
}
.md-body li > ul,
.md-body li > ol {
  margin: 4px 0;
}
.md-body hr {
  border: none;
  border-top: 1px solid var(--line-soft);
  margin: 28px 0;
}
.md-body blockquote {
  border-left: 3px solid var(--line);
  margin: 14px 0;
  padding: 6px 16px;
  color: var(--ink-3);
  background: rgba(17, 26, 48, 0.5);
  border-radius: 0 8px 8px 0;
}
.md-body blockquote p {
  margin: 6px 0;
}
.md-body table {
  border-collapse: collapse;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  margin: 14px 0;
  font-size: 12.5px;
  display: block;
  overflow-x: auto;
  touch-action: pan-x pan-y;
  overscroll-behavior-x: contain;
}
.md-body table th {
  background: var(--surface-2);
  color: var(--ink-2);
  font-family: var(--font-m);
  font-size: 11px;
  font-weight: 600;
  padding: 7px 11px;
  border: 1px solid var(--line);
  white-space: nowrap;
  text-align: left;
}
.md-body table td {
  padding: 6px 11px;
  border: 1px solid var(--line-soft);
  color: var(--ink-2);
  vertical-align: top;
}
.md-body table tr:nth-child(even) td {
  background: rgba(23, 33, 60, 0.3);
}
.md-body code {
  font-family: var(--font-m);
  font-size: 0.86em;
  color: var(--cyan);
  background: rgba(56, 189, 248, 0.07);
  border: 1px solid rgba(56, 189, 248, 0.14);
  border-radius: 4px;
  padding: 0.5px 5px;
}
.md-body pre code {
  color: #c9d4f0;
  background: none;
  border: none;
  padding: 0;
}
.md-body .callout {
  margin: 16px 0;
}
.md-body .mermaid-host {
  margin: 18px 0;
}
.md-body .mermaid-host.is-pending {
  min-height: 120px;
  display: grid;
  place-items: center;
  color: var(--ink-4);
  font-family: var(--font-m);
  font-size: 11px;
}
.md-body .mermaid-host.is-pending::before {
  content: '图表加载中…';
}
.md-body .flash {
  animation: reader-flash 1.6s ease;
}
@keyframes reader-flash {
  0% {
    background: rgba(77, 107, 254, 0.28);
  }
  100% {
    background: transparent;
  }
}
@media (max-width: 980px) {
  .reader-body {
    display: block !important;
    width: 100%;
    max-width: 100%;
  }
  .reader-mobile-nav {
    position: sticky;
    top: var(--nav-h);
    z-index: 40;
    display: block;
    margin: 0 -14px;
    padding: 8px 14px;
    border-top: 1px solid var(--line-soft);
    border-bottom: 1px solid var(--line);
    background: rgba(10, 15, 30, 0.96);
    backdrop-filter: blur(12px);
  }
  .mobile-nav-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .mobile-nav-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-width: 0;
    min-height: 40px;
    padding: 7px 10px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface-2);
    color: var(--ink-2);
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }
  .mobile-nav-button:hover,
  .mobile-nav-button[aria-expanded='true'] {
    border-color: var(--blue);
    background: rgba(77, 107, 254, 0.14);
    color: var(--ink);
  }
  .mobile-nav-button > span {
    color: var(--cyan);
    font-size: 17px;
    line-height: 1;
  }
  .mobile-nav-panel {
    margin-top: 8px;
    padding: 10px;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: var(--surface);
    box-shadow: 0 12px 28px rgba(2, 6, 18, 0.35);
  }
  .mobile-toc-panel {
    max-height: min(52vh, 420px);
    overflow: auto;
  }
  .mobile-toc-panel .toc-scroll {
    max-height: none;
  }
  .reader-side,
  .reader-main {
    width: 100%;
    max-width: 100%;
  }
  .reader-side {
    display: none;
    position: static;
    max-height: none;
  }
  .reader-main {
    margin-top: 18px;
  }
  .toc-scroll {
    max-height: 320px;
  }
}
</style>
