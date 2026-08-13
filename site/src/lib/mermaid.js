// 共享 mermaid 初始化与渲染（组件页与原文阅读页共用同一主题）
import mermaid from 'mermaid'

let inited = false

export function initMermaid() {
  if (inited) return
  inited = true
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'strict',
    fontFamily: '"JetBrains Mono","PingFang SC","Microsoft YaHei",monospace',
    themeVariables: {
      darkMode: true,
      background: 'transparent',
      primaryColor: '#17213c',
      primaryTextColor: '#e9edf9',
      primaryBorderColor: '#2c3c66',
      secondaryColor: '#111a30',
      tertiaryColor: '#1e2b4e',
      lineColor: '#4d6bfe',
      textColor: '#b8c1da',
      mainBkg: '#17213c',
      nodeBorder: '#2c3c66',
      clusterBkg: '#111a30',
      clusterBorder: '#23325a',
      titleColor: '#e9edf9',
      edgeLabelBackground: '#111a30',
      actorBkg: '#17213c',
      actorBorder: '#2c3c66',
      actorTextColor: '#e9edf9',
      signalColor: '#38bdf8',
      signalTextColor: '#e9edf9',
      labelBoxBkgColor: '#1e2b4e',
      labelBoxBorderColor: '#4d6bfe',
      labelTextColor: '#b8c1da',
      loopTextColor: '#b8c1da',
      noteBkgColor: '#1e2b4e',
      noteBorderColor: '#4d6bfe',
      noteTextColor: '#e9edf9',
      activationBkgColor: '#1e2b4e',
      activationBorderColor: '#2c3c66',
      sequenceNumberColor: '#b8c1da',
      sectionBkgColor: '#111a30',
      altSectionBkgColor: '#0d1326',
      sectionBkgColor2: '#111a30',
      excludeBkgColor: '#0d1326',
      taskBorderColor: '#2c3c66',
      taskBkgColor: '#1e2b4e',
      taskTextColor: '#e9edf9',
      taskTextOutsideColor: '#7f8bb0',
      taskTextClickableColor: '#38bdf8',
      activeTaskBorderColor: '#4d6bfe',
      activeTaskBkgColor: '#24335c',
      gridColor: '#18223f',
      doneTaskBkgColor: '#17213c',
      doneTaskBorderColor: '#2c3c66',
      critBorderColor: '#f5a524',
      critBkgColor: '#3a2f14',
      todayLineColor: '#f472b6',
      arrowheadColor: '#4d6bfe',
      pie1: '#4d6bfe', pie2: '#38bdf8', pie3: '#a78bfa', pie4: '#f5a524', pie5: '#34d399',
      pie6: '#f472b6', pie7: '#7f8bb0', pie8: '#5b6790',
      pieTitleTextSize: '15px',
      pieTitleTextColor: '#e9edf9',
      pieSectionTextColor: '#e9edf9',
      pieLegendTextColor: '#b8c1da',
      pieStrokeColor: '#0a0f1e',
      pieStrokeWidth: '1.5px',
      pieOuterStrokeWidth: '1.5px',
      pieOuterStrokeColor: '#0a0f1e',
      pieOpacity: '0.9',
      git0: '#4d6bfe', git1: '#38bdf8', git2: '#a78bfa', git3: '#f5a524', git4: '#34d399',
      git5: '#f472b6', git6: '#7f8bb0', git7: '#5b6790',
      commitLabelColor: '#e9edf9',
      commitLabelBackground: '#17213c',
      commitLabelFontSize: '12px',
      tagLabelColor: '#0a0f1e',
      tagLabelBackground: '#f5a524',
      tagLabelBorder: '#f5a524',
      tagLabelFontSize: '11px',
    },
  })
}

let counter = 0
export async function renderMermaidSvg(code) {
  initMermaid()
  counter += 1
  const id = `mmd-${Math.random().toString(36).slice(2, 10)}-${counter}`
  const { svg } = await mermaid.render(id, code)
  return svg
}
