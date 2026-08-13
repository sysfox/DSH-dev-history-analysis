<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github-dark.css'
import { doc } from '../lib/data'
import { escapeHtml, ghSlug } from '../lib/util'
import { renderMermaidSvg } from '../lib/mermaid'
import rawMd from '../../../DEVELOPMENT-HISTORY.md?raw'

const route = useRoute()
const query = ref('')
const ready = ref(false)
const activeId = ref('')
const mobilePanel = ref('')
const contentRef = ref(null)

const rawLines = rawMd.split('\n')
const lowerLines = rawLines.map((line) => line.toLowerCase())
const headings = doc.headings
const slugMap = new Map()
const usedSlugs = new Set()

for (const heading of headings) {
  const base = ghSlug(heading.text) || 'section'
  let id = base
  let suffix = 2
  while (usedSlugs.has(id)) id = `${base}-${suffix++}`
  usedSlugs.add(id)
  slugMap.set(heading.line, id)
}

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
  highlight(source, language) {
    if (language === 'mermaid') return ''
    if (language && hljs.getLanguage(language)) {
      try {
        return hljs.highlight(source, { language, ignoreIllegals: true }).value
      } catch {
        // Fall back to escaped source below.
      }
    }
    return escapeHtml(source)
  },
})

md.core.ruler.after('block', 'callouts', (state) => {
  const tokens = state.tokens
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]
    if (token.type !== 'blockquote_open') continue
    let depth = 0
    for (let j = i + 1; j < tokens.length; j += 1) {
      const current = tokens[j]
      if (current.type === 'blockquote_open') depth += 1
      else if (current.type === 'blockquote_close') {
        if (depth === 0) break
        depth -= 1
      } else if (current.type === 'inline' && depth === 0) {
        const first = current.children?.[0]
        const match = first?.type === 'text' && first.content.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING)\]\s*/i)
        if (match) {
          token.attrs = [['class', `callout callout-${match[1].toLowerCase()}`]]
          first.content = first.content.slice(match[0].length)
          if (!first.content) current.children.shift()
        }
        break
      }
    }
  }
})

md.renderer.rules.heading_open = (tokens, index, options, env) => {
  const token = tokens[index]
  const localLine = token.map ? token.map[0] + 1 : 0
  const line = localLine + (env?.lineOffset || 0)
  const id = slugMap.get(line) || `h-${line}`
  return `<h${token.tag.slice(1)} id="${id}" data-line="${line}"><a class="h-anchor" href="#${id}" aria-label="链接到本节">#</a>`
}

md.renderer.rules.fence = (tokens, index) => {
  const token = tokens[index]
  const language = (token.info || '').trim()
  if (language === 'mermaid') {
    return `<div class="mermaid-host" data-mermaid="true">${escapeHtml(token.content)}</div>`
  }
  const code = md.options.highlight(token.content, language)
  return `<div class="code-block"><span class="code-lang">${escapeHtml(language || 'text')}</span><pre><code class="hljs">${code}</code></pre></div>`
}

function createSections() {
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
      loaded: false,
      loading: false,
      el: null,
    }
  })
}

const sections = ref(createSections())

const toc = computed(() => {
  const root = []
  let currentH2 = null
  let currentH3 = null
  for (const heading of headings) {
    if (heading.level === 1) continue
    const item = { ...heading, id: slugMap.get(heading.line), children: [] }
    if (heading.level === 2) {
      currentH2 = item
      currentH3 = null
      root.push(item)
    } else if (heading.level === 3 && currentH2) {
      currentH3 = item
      currentH2.children.push(item)
    } else if (heading.level === 4 && currentH3) {
      currentH3.children.push(item)
    }
  }
  return root
})

const searchResults = computed(() => {
  const term = query.value.trim().toLowerCase()
  if (!term) return []
  const results = []
  for (let index = 0; index < lowerLines.length && results.length < 150; index += 1) {
    if (rawLines[index].trim() && lowerLines[index].includes(term)) {
      results.push({ line: index + 1, text: rawLines[index].trim().slice(0, 90) })
    }
  }
  return results
})

const stats = computed(() => ({
  lines: doc.meta.totalLines,
  headings: doc.headings.filter((heading) => heading.level >= 2).length,
  tables: doc.tables.length,
  callouts: doc.callouts.length,
  mermaid: doc.mermaid.length,
}))

let headingObserver = null
let sectionObserver = null
let mermaidObserver = null

function sectionForLine(line) {
  return sections.value.find((section) => line >= section.startLine && line <= section.endLine)
}

function sectionForId(id) {
  const heading = headings.find((item) => slugMap.get(item.line) === id)
  return heading ? sectionForLine(heading.line) : null
}

function setSectionEl(section, el) {
  if (!el) return
  section.el = el
  el.__readerSection = section
  if (sectionObserver) sectionObserver.observe(el)
}

function setupHeadingObserver() {
  headingObserver?.disconnect()
  if (!('IntersectionObserver' in window) || !contentRef.value) return
  headingObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) activeId.value = entry.target.id
      }
    },
    { rootMargin: '-70px 0px -70% 0px' }
  )
  contentRef.value.querySelectorAll('h2[id], h3[id], h4[id]').forEach((heading) => headingObserver.observe(heading))
}

function resolveLinks(root) {
  const normalize = (value) => value.toLowerCase().replace(/[·（）()、，。：:*/."'“”’‘<>#%]+/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
  root.querySelectorAll('a[href^="#"]').forEach((link) => {
    const target = link.getAttribute('href').slice(1)
    if (headings.some((heading) => slugMap.get(heading.line) === target)) return
    const match = headings.find((heading) => normalize(heading.text) === normalize(target))
    if (match) link.setAttribute('href', `#${slugMap.get(match.line)}`)
  })
}

async function renderMermaidHost(host) {
  if (host.dataset.rendered) return
  host.dataset.rendered = 'loading'
  const source = host.textContent || ''
  host.textContent = ''
  host.classList.add('is-pending')
  try {
    host.innerHTML = await renderMermaidSvg(source)
    host.classList.remove('is-pending')
    host.dataset.rendered = 'true'
  } catch (error) {
    host.classList.remove('is-pending')
    host.innerHTML = `<pre class="mermaid-error">mermaid 渲染失败：${escapeHtml(String(error.message || error))}</pre>`
    host.dataset.rendered = 'error'
  }
}

function observeMermaid(root) {
  const hosts = [...root.querySelectorAll('.mermaid-host[data-mermaid]')]
  if (!hosts.length) return
  if (!mermaidObserver && 'IntersectionObserver' in window) {
    mermaidObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            mermaidObserver.unobserve(entry.target)
            renderMermaidHost(entry.target)
          }
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
      resolveLinks(section.el)
      observeMermaid(section.el)
    }
    setupHeadingObserver()
  } catch (error) {
    section.html = `<p class="render-error">文档片段渲染失败：${escapeHtml(String(error.message || error))}</p>`
    section.loaded = true
  } finally {
    section.loading = false
  }
}

function setupSectionObserver() {
  sectionObserver?.disconnect()
  if (!('IntersectionObserver' in window)) {
    sections.value.forEach((section) => renderSection(section))
    return
  }
  sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) renderSection(entry.target.__readerSection)
      })
    },
    { rootMargin: '720px 0px' }
  )
  sections.value.forEach((section) => section.el && sectionObserver.observe(section.el))
}

function headingForLine(line) {
  let match = null
  for (const heading of headings) {
    if (heading.level >= 2 && heading.line <= line) match = heading
    else if (heading.line > line) break
  }
  return match
}

function flash(element) {
  element.classList.add('flash')
  window.setTimeout(() => element.classList.remove('flash'), 1600)
}

async function jumpToLine(line) {
  mobilePanel.value = ''
  const heading = headingForLine(line)
  const target = heading ? slugMap.get(heading.line) : null
  await renderSection(sectionForLine(heading?.line || line))
  await nextTick()
  const element = target ? document.getElementById(target) : null
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    flash(element)
  }
}

async function jumpToHash(hash) {
  if (!hash) return
  mobilePanel.value = ''
  await renderSection(sectionForId(hash.slice(1)))
  await nextTick()
  const element = document.getElementById(hash.slice(1))
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    flash(element)
  }
}

function onDocumentClick(event) {
  const link = event.target?.closest?.('a[href^="#"]')
  if (!link) return
  const target = link.getAttribute('href')?.slice(1)
  if (!target || !sectionForId(target)) return
  event.preventDefault()
  jumpToHash(`#${target}`)
}

function toggleMobilePanel(panel) {
  mobilePanel.value = mobilePanel.value === panel ? '' : panel
}

function clearSearch() {
  query.value = ''
}

function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function renderDocument() {
  sections.value = createSections()
  ready.value = true
  await nextTick()
  setupSectionObserver()
  await Promise.all(sections.value.slice(0, 2).map((section) => renderSection(section)))
  setupHeadingObserver()
  if (route.hash) jumpToHash(route.hash)
}

onMounted(renderDocument)

watch(
  () => route.hash,
  (hash) => {
    if (ready.value && hash) jumpToHash(hash)
  }
)

onBeforeUnmount(() => {
  headingObserver?.disconnect()
  sectionObserver?.disconnect()
  mermaidObserver?.disconnect()
})
</script>

<template>
  <div class="page reader-page">
    <header class="reader-head container">
      <div class="eyebrow">FULL TEXT · 原文阅读</div>
      <h1>DEVELOPMENT-HISTORY.md</h1>
      <p class="reader-lead">整篇文档的忠实渲染：Markdown、表格、callout 与 mermaid 图均由原文生成，可搜索、可跳转、可核对行号。</p>
      <div class="reader-stats">
        <span class="chip"><i class="dot" style="background: var(--blue)"></i>{{ stats.lines }} 行</span>
        <span class="chip"><i class="dot" style="background: var(--cyan)"></i>{{ stats.headings }} 个标题</span>
        <span class="chip"><i class="dot" style="background: var(--ph3)"></i>{{ stats.tables }} 张表格</span>
        <span class="chip"><i class="dot" style="background: var(--ph5)"></i>{{ stats.mermaid }} 幅 mermaid 图</span>
        <span class="chip"><i class="dot" style="background: var(--ph4)"></i>{{ stats.callouts }} 条 callout</span>
      </div>
    </header>

    <div class="reader-layout container">
      <aside class="reader-sidebar">
        <section class="reader-tool-card">
          <div class="search-wrap">
            <input v-model="query" type="search" class="search-box" name="reader-search" autocomplete="off" placeholder="搜索全文…" aria-label="搜索全文" aria-controls="reader-search-results" @keydown.escape="clearSearch" />
            <button v-if="query" type="button" class="search-clear" aria-label="清除搜索" @click="clearSearch">×</button>
          </div>
          <div v-if="searchResults.length" id="reader-search-results" class="search-results">
            <div class="search-count">{{ searchResults.length }} 个匹配，点击跳到所属章节</div>
            <button v-for="result in searchResults" :key="result.line" class="search-hit" @click="jumpToLine(result.line)">
              <span class="mono hit-line">L{{ result.line }}</span>
              <span class="hit-text">{{ result.text }}</span>
            </button>
            <div v-if="searchResults.length >= 150" class="search-more">仅显示前 150 条，请细化关键词</div>
          </div>
          <div v-else-if="query" class="search-empty">无匹配行</div>
        </section>

        <nav class="reader-tool-card reader-toc" aria-label="目录">
          <div class="reader-tool-head">
            <span class="tool-label mono">目录 · {{ toc.length }} 章</span>
            <button class="toc-toggle" type="button" :aria-expanded="tocOpen" aria-controls="reader-toc-list" @click="tocOpen = !tocOpen">
              {{ tocOpen ? '收起' : '展开' }}
              <span aria-hidden="true">{{ tocOpen ? '⌃' : '⌄' }}</span>
            </button>
          </div>
          <div v-show="tocOpen" id="reader-toc-list" class="toc-list">
            <template v-for="h2 in toc" :key="h2.id">
              <a :href="`#${h2.id}`" class="toc-h2" :class="{ on: activeId === h2.id }" @click.prevent="jumpToHash(`#${h2.id}`)">{{ h2.text }}</a>
              <template v-for="h3 in h2.children" :key="h3.id">
                <a :href="`#${h3.id}`" class="toc-h3" :class="{ on: activeId === h3.id }" @click.prevent="jumpToHash(`#${h3.id}`)">{{ h3.text }}</a>
                <a v-for="h4 in h3.children" :key="h4.id" :href="`#${h4.id}`" class="toc-h4" :class="{ on: activeId === h4.id }" @click.prevent="jumpToHash(`#${h4.id}`)">{{ h4.text }}</a>
              </template>
            </template>
          </div>
        </nav>
      </aside>

      <div class="reader-main-column">
        <nav class="mobile-reader-tools" aria-label="原文工具">
          <div class="mobile-tool-buttons">
            <button class="mobile-tool-button" type="button" :aria-expanded="mobilePanel === 'search'" aria-controls="mobile-reader-search" @click="toggleMobilePanel('search')"><span aria-hidden="true">⌕</span>搜索</button>
            <button class="mobile-tool-button" type="button" :aria-expanded="mobilePanel === 'toc'" aria-controls="mobile-reader-toc" @click="toggleMobilePanel('toc')"><span aria-hidden="true">☷</span>目录 · {{ toc.length }} 章</button>
          </div>
          <div v-if="mobilePanel === 'search'" id="mobile-reader-search" class="mobile-tool-panel">
            <div class="search-wrap">
              <input v-model="query" type="search" class="search-box" name="mobile-reader-search" autocomplete="off" placeholder="搜索全文…" aria-label="搜索全文" aria-controls="mobile-search-results" @keydown.escape="mobilePanel = ''" />
              <button v-if="query" type="button" class="search-clear" aria-label="清除搜索" @click="clearSearch">×</button>
            </div>
            <div v-if="searchResults.length" id="mobile-search-results" class="search-results">
              <div class="search-count">{{ searchResults.length }} 个匹配，点击跳到所属章节</div>
              <button v-for="result in searchResults" :key="result.line" class="search-hit" @click="jumpToLine(result.line)"><span class="mono hit-line">L{{ result.line }}</span><span class="hit-text">{{ result.text }}</span></button>
            </div>
            <div v-else-if="query" class="search-empty">无匹配行</div>
          </div>
          <div v-if="mobilePanel === 'toc'" id="mobile-reader-toc" class="mobile-tool-panel mobile-toc-panel">
            <div class="toc-list">
              <template v-for="h2 in toc" :key="h2.id">
                <a :href="`#${h2.id}`" class="toc-h2" :class="{ on: activeId === h2.id }" @click.prevent="jumpToHash(`#${h2.id}`)">{{ h2.text }}</a>
                <template v-for="h3 in h2.children" :key="h3.id">
                  <a :href="`#${h3.id}`" class="toc-h3" :class="{ on: activeId === h3.id }" @click.prevent="jumpToHash(`#${h3.id}`)">{{ h3.text }}</a>
                  <a v-for="h4 in h3.children" :key="h4.id" :href="`#${h4.id}`" class="toc-h4" :class="{ on: activeId === h4.id }" @click.prevent="jumpToHash(`#${h4.id}`)">{{ h4.text }}</a>
                </template>
              </template>
            </div>
          </div>
        </nav>

        <article ref="contentRef" class="reader-document" @click="onDocumentClick">
          <div v-if="!ready" class="reader-loading">正在准备原文阅读器…</div>
          <div v-else class="reader-markdown">
            <section v-for="section in sections" :key="section.id" :ref="(el) => setSectionEl(section, el)" class="reader-section" :class="{ loaded: section.loaded }" :style="{ '--section-min-height': `${section.estimatedHeight}px` }">
              <div v-if="section.html" v-html="section.html"></div>
              <div v-else class="section-loading">接近此处时加载文档片段…</div>
            </section>
          </div>
          <button class="to-top btn" type="button" @click="toTop">↑ 回到顶部</button>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reader-head {
  padding-top: 30px;
}
.reader-head h1 {
  margin-top: 10px;
  font-size: clamp(1.7rem, 4vw, 2.4rem);
}
.reader-lead {
  max-width: 760px;
  margin-top: 10px;
  color: var(--ink-2);
}
.reader-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
.reader-layout {
  display: grid;
  grid-template-columns: minmax(0, 280px) minmax(0, 1fr);
  gap: 26px;
  align-items: start;
  margin-top: 26px;
}
.reader-sidebar,
.reader-main-column {
  min-width: 0;
  width: 100%;
}
.reader-sidebar {
  position: sticky;
  top: calc(var(--nav-h) + 16px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - var(--nav-h) - 32px);
}
.reader-tool-card {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--line-soft);
  border-radius: var(--r);
  background: var(--surface);
}
.reader-toc {
  flex: 1;
  min-height: 0;
}
.reader-tool-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.tool-label {
  min-width: 0;
  color: var(--ink-4);
  font-size: 10.5px;
  letter-spacing: 0.16em;
}
.toc-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 32px;
  padding: 4px 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface-2);
  color: var(--ink-3);
  font-size: 11px;
  cursor: pointer;
}
.toc-toggle:hover {
  border-color: var(--blue);
  color: var(--ink);
}
.toc-list {
  display: flex;
  min-width: 0;
  max-height: calc(100vh - var(--nav-h) - 120px);
  flex-direction: column;
  gap: 1px;
  margin-top: 8px;
  overflow: auto;
  overflow-wrap: anywhere;
}
.toc-h2,
.toc-h3,
.toc-h4 {
  display: block;
  min-width: 0;
  border-left: 2px solid transparent;
  border-radius: 5px;
  color: var(--ink-3);
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.toc-h2 {
  padding: 4px 8px;
  color: var(--ink-2);
  font-size: 12.5px;
  font-weight: 600;
}
.toc-h3 {
  padding: 3px 8px 3px 18px;
  font-size: 12px;
}
.toc-h4 {
  padding: 3px 8px 3px 30px;
  color: var(--ink-4);
  font-size: 11px;
}
.toc-h2:hover,
.toc-h3:hover,
.toc-h4:hover,
.toc-h2.on,
.toc-h3.on,
.toc-h4.on {
  background: rgba(56, 189, 248, 0.07);
  color: var(--cyan);
  text-decoration: none;
}
.search-wrap {
  position: relative;
}
.search-box {
  width: 100%;
  min-width: 0;
  padding: 8px 38px 8px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  outline: none;
  background: var(--bg-soft);
  color: var(--ink);
  font-family: var(--font-b);
  font-size: 13px;
}
.search-box:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 2px rgba(77, 107, 254, 0.15);
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
  cursor: pointer;
}
.search-clear:hover {
  background: var(--surface-2);
  color: var(--ink);
}
.search-results {
  display: flex;
  max-height: 260px;
  flex-direction: column;
  gap: 2px;
  margin-top: 8px;
  overflow: auto;
}
.search-count,
.search-more,
.search-empty {
  padding: 5px 8px;
  color: var(--ink-4);
  font-size: 11px;
}
.search-hit {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 8px;
  align-items: baseline;
  min-width: 0;
  padding: 6px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--ink-2);
  font-family: var(--font-b);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}
.search-hit:hover {
  background: rgba(77, 107, 254, 0.12);
}
.hit-line {
  color: var(--cyan);
  font-size: 10.5px;
}
.hit-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mobile-reader-tools {
  display: none;
}
.reader-document {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
}
.reader-section {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  min-height: var(--section-min-height);
  content-visibility: auto;
  contain-intrinsic-size: auto var(--section-min-height);
}
.reader-section.loaded {
  min-height: 0;
}
.section-loading,
.reader-loading {
  display: grid;
  min-height: 180px;
  place-items: center;
  color: var(--ink-4);
  font-family: var(--font-m);
  font-size: 11px;
}
.to-top {
  margin-top: 26px;
}
@media (max-width: 980px) {
  .reader-layout {
    display: block;
    width: 100%;
    max-width: 100%;
    margin-top: 20px;
  }
  .reader-sidebar {
    display: none;
  }
  .mobile-reader-tools {
    position: sticky;
    top: var(--nav-h);
    z-index: 40;
    display: block;
    margin: 0 -14px 18px;
    padding: 8px 14px;
    border-top: 1px solid var(--line-soft);
    border-bottom: 1px solid var(--line);
    background: rgba(10, 15, 30, 0.96);
    backdrop-filter: blur(12px);
  }
  .mobile-tool-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .mobile-tool-button {
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
  }
  .mobile-tool-button:hover,
  .mobile-tool-button[aria-expanded='true'] {
    border-color: var(--blue);
    background: rgba(77, 107, 254, 0.14);
    color: var(--ink);
  }
  .mobile-tool-button > span {
    color: var(--cyan);
    font-size: 17px;
    line-height: 1;
  }
  .mobile-tool-panel {
    max-width: 100%;
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
  .mobile-toc-panel .toc-list {
    max-height: none;
  }
}
</style>

<style>
.reader-markdown {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  color: var(--ink-2);
  font-size: 14.5px;
  line-height: 1.85;
}
.reader-markdown > :first-child {
  margin-top: 0;
}
.reader-markdown h1 {
  margin: 34px 0 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line-soft);
  color: var(--ink);
  font-size: 1.7rem;
}
.reader-markdown h2 {
  margin: 34px 0 12px;
  color: var(--ink);
  font-size: 1.35rem;
}
.reader-markdown h3 {
  margin: 26px 0 10px;
  color: var(--ink);
  font-size: 1.12rem;
}
.reader-markdown h4 {
  margin: 20px 0 8px;
  color: var(--ink);
  font-size: 1rem;
}
.reader-markdown h1[id],
.reader-markdown h2[id],
.reader-markdown h3[id],
.reader-markdown h4[id] {
  scroll-margin-top: calc(var(--nav-h) + 70px);
}
.reader-markdown .h-anchor {
  margin-right: 8px;
  opacity: 0;
  color: var(--ink-4);
  font-family: var(--font-m);
  font-size: 0.8em;
  text-decoration: none;
  user-select: none;
}
.reader-markdown h1:hover .h-anchor,
.reader-markdown h2:hover .h-anchor,
.reader-markdown h3:hover .h-anchor,
.reader-markdown h4:hover .h-anchor {
  opacity: 1;
}
.reader-markdown p {
  margin: 10px 0;
}
.reader-markdown strong {
  color: var(--ink);
}
.reader-markdown a {
  color: var(--cyan);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.reader-markdown ul,
.reader-markdown ol {
  margin: 10px 0;
  padding-left: 1.6em;
}
.reader-markdown li {
  margin: 4px 0;
}
.reader-markdown hr {
  margin: 28px 0;
  border: 0;
  border-top: 1px solid var(--line-soft);
}
.reader-markdown blockquote {
  margin: 14px 0;
  padding: 6px 16px;
  border-left: 3px solid var(--line);
  border-radius: 0 8px 8px 0;
  background: rgba(17, 26, 48, 0.5);
  color: var(--ink-3);
}
.reader-markdown table {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  margin: 14px 0;
  overflow-x: auto;
  border-collapse: collapse;
  touch-action: pan-x pan-y;
  overscroll-behavior-x: contain;
  font-size: 12.5px;
}
.reader-markdown table th {
  padding: 7px 11px;
  border: 1px solid var(--line);
  background: var(--surface-2);
  color: var(--ink-2);
  font-family: var(--font-m);
  font-size: 11px;
  white-space: nowrap;
  text-align: left;
}
.reader-markdown table td {
  padding: 6px 11px;
  border: 1px solid var(--line-soft);
  color: var(--ink-2);
  vertical-align: top;
}
.reader-markdown table tr:nth-child(even) td {
  background: rgba(23, 33, 60, 0.3);
}
.reader-markdown code {
  padding: 0.5px 5px;
  border: 1px solid rgba(56, 189, 248, 0.14);
  border-radius: 4px;
  background: rgba(56, 189, 248, 0.07);
  color: var(--cyan);
  font-family: var(--font-m);
  font-size: 0.86em;
}
.reader-markdown pre code {
  padding: 0;
  border: 0;
  background: none;
  color: #c9d4f0;
}
.reader-markdown .callout {
  margin: 16px 0;
}
.reader-markdown .mermaid-host {
  margin: 18px 0;
}
.reader-markdown .mermaid-host.is-pending {
  display: grid;
  min-height: 120px;
  place-items: center;
  color: var(--ink-4);
  font-family: var(--font-m);
  font-size: 11px;
}
.reader-markdown .mermaid-host.is-pending::before {
  content: '图表加载中…';
}
.reader-markdown .flash {
  animation: reader-flash 1.6s ease;
}
.render-error {
  color: var(--danger);
  font-family: var(--font-m);
  font-size: 12px;
}
@keyframes reader-flash {
  0% { background: rgba(77, 107, 254, 0.28); }
  100% { background: transparent; }
}
</style>
