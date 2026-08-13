// 从 DEVELOPMENT-HISTORY.md 提取结构化 JSON，供可视化站点使用
// 运行：node scripts/extract.mjs（在 site/ 目录下）
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..', '..')
const mdPath = join(root, 'DEVELOPMENT-HISTORY.md')
const outDir = join(__dirname, '..', 'src', 'data')
mkdirSync(outDir, { recursive: true })

const md = readFileSync(mdPath, 'utf8')
const lines = md.split('\n')
const totalLines = lines.length - (lines[lines.length - 1] === '' ? 1 : 0)

const headings = []
const tables = []
const callouts = []
const codeBlocks = []
const stack = [] // 当前标题栈 {level, text}

const pathOf = () => stack.map((h) => h.text).join(' / ')

function splitRow(line) {
  const t = line.trim()
  return t.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
}

let i = 0
while (i < lines.length) {
  const line = lines[i]
  const h = line.match(/^(#{1,4})\s+(.+?)\s*$/)
  if (h) {
    const level = h[1].length
    const text = h[2].trim()
    while (stack.length && stack[stack.length - 1].level >= level) stack.pop()
    stack.push({ level, text, line: i + 1 })
    headings.push({ level, text, line: i + 1, path: pathOf() })
    i++
    continue
  }
  if (/^```/.test(line.trim())) {
    const lang = line.trim().slice(3).trim()
    const buf = []
    let j = i + 1
    while (j < lines.length && !/^```/.test(lines[j].trim())) {
      buf.push(lines[j])
      j++
    }
    codeBlocks.push({ lang: lang || 'text', code: buf.join('\n'), path: pathOf(), line: i + 1 })
    i = j + 1
    continue
  }
  if (/^>\s*\[!(\w+)\]/i.test(line)) {
    const type = line.match(/^>\s*\[!(\w+)\]/i)[1].toUpperCase()
    const buf = [line.replace(/^>\s*\[!\w+\]\s*/i, '')]
    let j = i + 1
    while (j < lines.length && /^>/.test(lines[j])) {
      buf.push(lines[j].replace(/^>\s?/, ''))
      j++
    }
    callouts.push({ type, text: buf.join('\n').trim(), path: pathOf(), line: i + 1 })
    i = j
    continue
  }
  if (line.startsWith('|')) {
    const rows = []
    const startLine = i + 1
    while (i < lines.length && lines[i].startsWith('|')) {
      rows.push(splitRow(lines[i]))
      i++
    }
    let sep = 0
    if (rows.length >= 2 && rows[1].every((c) => /^:?-{2,}:?$/.test(c.trim()))) sep = 1
    tables.push({ path: pathOf(), line: startLine, headers: rows[0] || [], rows: rows.slice(sep + 1) })
    continue
  }
  i++
}

const toNum = (v) => {
  const t = String(v).replace(/,/g, '')
  return /^-?\d+$/.test(t) ? Number(t) : v
}
const normRows = (rows) => rows.map((r) => r.map(toNum))

const findTable = (pred) => tables.find(pred)

// 65 天逐日提交数（5 列 × 13 行日期/提交对）
const dailyTable = findTable((t) => t.path.includes('65 天逐日提交数'))
let daily = []
if (dailyTable) {
  const pairs = []
  for (const row of dailyTable.rows) {
    for (let k = 0; k + 1 < row.length; k += 2) pairs.push([row[k], Number(row[k + 1])])
  }
  daily = pairs.map(([date, commits]) => ({ date: `2026-${date}`, commits }))
}

// 月度贡献矩阵（前 14 名）
const contribTable = findTable((t) => t.path.includes('月度贡献矩阵') && t.headers[0] === '贡献者')
const contributionMatrix = contribTable
  ? normRows(contribTable.rows).map((r) => ({
      name: r[0],
      jun: r[1],
      jul: r[2],
      aug: r[3],
      total: r[4],
      isTotal: /合计/.test(String(r[0])),
    }))
  : []

const out = {
  meta: { totalLines, generatedAt: new Date().toISOString() },
  headings,
  tables: tables.map((t) => ({ path: t.path, line: t.line, headers: t.headers, rows: normRows(t.rows) })),
  callouts,
  mermaid: codeBlocks.filter((c) => c.lang === 'mermaid'),
  codeBlocks: codeBlocks.filter((c) => c.lang !== 'mermaid'),
  daily,
  contributionMatrix,
}

writeFileSync(join(outDir, 'doc.json'), JSON.stringify(out, null, 1))
console.log(
  `OK: headings=${headings.length} tables=${tables.length} callouts=${callouts.length} codeBlocks=${codeBlocks.length} (mermaid=${out.mermaid.length}) daily=${daily.length} matrix=${contributionMatrix.length} lines=${totalLines}`
)
