// 文档数据访问层：doc.json 由 scripts/extract.mjs 生成
import doc from '../data/doc.json'
import domains from '../data/domains.json'

export { doc, domains }

export const TOTAL = { commits: 12293, merges: 5610, days: 65, packages: 219, groups: 49 }
export const HEAD = { hash: '47f943859b', date: '2026-08-13 19:38' }

export const PHASES = [
  { id: 1, name: '冷启动与微内核', range: '6/10 – 6/15', from: '2026-06-10', to: '2026-06-15', color: 'var(--ph1)' },
  { id: 2, name: '能力扩张', range: '6/16 – 6/30', from: '2026-06-16', to: '2026-06-30', color: 'var(--ph2)' },
  { id: 3, name: '子代理·工作流·沙箱', range: '7/1 – 7/15', from: '2026-07-01', to: '2026-07-15', color: 'var(--ph3)' },
  { id: 4, name: 'Web GUI 与宿主', range: '7/16 – 7/31', from: '2026-07-16', to: '2026-07-31', color: 'var(--ph4)' },
  { id: 5, name: '发布工程与公测', range: '8/1 – 8/13', from: '2026-08-01', to: '2026-08-13', color: 'var(--ph5)' },
]

export const PHASE_HEX = { 1: '#4d6bfe', 2: '#38bdf8', 3: '#a78bfa', 4: '#f5a524', 5: '#34d399' }

export const phaseOf = (date) => PHASES.find((p) => date >= p.from && date <= p.to) || PHASES[0]
export const phaseHexOf = (date) => PHASE_HEX[phaseOf(date).id]

export const findTable = (pred) => doc.tables.find(pred)

// ---- 关键日期时间线（53 行事件）----
export const keyEvents = (() => {
  const t = findTable((x) => x.path.includes('关键日期时间线'))
  if (!t) return []
  return t.rows.map((r) => ({ date: String(r[0]), event: String(r[1]), source: String(r[2] ?? '') }))
})()

export const eventsByDate = (() => {
  const m = {}
  for (const e of keyEvents) (m[e.date] ??= []).push(e)
  return m
})()

// ---- 包组总表（49 组）----
export const groups = (() => {
  const t = findTable((x) => x.path.includes('包组总表'))
  if (!t) return []
  return t.rows.map((r) => ({
    name: String(r[0]),
    hash: String(r[1]),
    date: `2026-${String(r[2])}`,
    commits: Number(r[3]) || 0,
    pkgCount: Number(r[4]) || 0,
    role: String(r[5]),
    evo: String(r[6]),
  }))
})()

export const groupByName = Object.fromEntries(groups.map((g) => [g.name, g]))

// ---- 逐周 / 月度 / 阶段 ----
export const weekly = (() => {
  const t = findTable((x) => x.path.includes('逐周全景表'))
  if (!t) return []
  return t.rows.map((r) => ({
    week: String(r[0]),
    range: String(r[1]),
    commits: Number(r[2]),
    delta: String(r[3]),
    rep: String(r[4]),
    note: String(r[5]),
  }))
})()

export const monthly = (() => {
  const t = findTable((x) => x.path.includes('提交量月度分布'))
  if (!t) return []
  return t.rows.map((r) => ({ month: String(r[0]), commits: Number(r[1]), pct: String(r[2]), theme: String(r[3]) }))
})()

export const phases = (() => {
  const t = findTable((x) => x.path === 'DeepSeek Harness 开发历程 / 时间线与阶段划分 / 阶段划分')
  if (!t) return []
  return t.rows.map((r) => ({
    name: String(r[0]),
    range: String(r[1]),
    commits: Number(r[2]),
    milestones: String(r[3]),
    note: String(r[4]),
  }))
})()

export const phaseCompare = (() => {
  const t = findTable((x) => x.path.includes('阶段总览对比表'))
  if (!t) return []
  return t.rows.map((r) => ({
    phase: String(r[0]),
    commits: Number(r[1]),
    pct: String(r[2]),
    merges: Number(r[3]),
    mergePct: String(r[4]),
    peak: String(r[5]),
    prRange: String(r[6]),
  }))
})()

export const prVelocity = (() => {
  const t = findTable((x) => x.path.includes('PR 编号跨度与流速'))
  if (!t) return []
  return t.rows.map((r) => ({
    phase: String(r[0]),
    range: String(r[1]),
    span: Number(r[2]),
    days: String(r[3]),
    rate: Number(String(r[4]).replace(/[^\d.]/g, '')),
  }))
})()

export const topDays = (() => {
  const t = findTable((x) => x.path.includes('单日提交 Top-8'))
  if (!t) return []
  return t.rows.map((r) => ({ rank: String(r[0]), date: `2026-${String(r[1])}`, commits: Number(r[2]), event: String(r[3]) }))
})()

// ---- 贡献者 ----
export const contributorRank = (() => {
  const t = findTable((x) => x.path.includes('贡献者排名表'))
  if (!t) return []
  return t.rows.map((r) => ({
    rank: Number(r[0]),
    name: String(r[1]),
    active: String(r[2]),
    commits: Number(r[3]),
    note: String(r[4] ?? ''),
  }))
})()

// ---- 表查找助手（页面内使用）----
export const tByPath = (part) => findTable((x) => x.path.includes(part))
