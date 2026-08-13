// 通用工具
export const numFmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-US') : String(n ?? ''))

// 行内 markdown 简化渲染：`code` 与 **bold**
export const inlineMd = (s) =>
  String(s ?? '')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

// GitHub 风格锚点（与正文内部链接兼容）
export const ghSlug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[·（）()、，。：:*/."'“”’‘<>#%]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export const cls = (...xs) => xs.filter(Boolean).join(' ')

export const copyText = async (t) => {
  try {
    await navigator.clipboard.writeText(t)
    return true
  } catch {
    return false
  }
}

// 从出处单元格中抽取全部 hash 令牌（处理「`a`、`b`；`c`」等多 hash 混合文本）
export const hashTokens = (s) => (String(s ?? '').match(/[0-9a-f]{8,40}/gi) || [])
