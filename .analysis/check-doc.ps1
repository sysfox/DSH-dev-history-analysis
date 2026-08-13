$ErrorActionPreference = 'Continue'
$lines = Get-Content 'DEVELOPMENT-HISTORY.md' -Encoding utf8
$tableLines = ($lines | Where-Object { $_ -match '^\|' }).Count
$note  = ($lines | Select-String -Pattern '\[!NOTE\]').Count
$tip   = ($lines | Select-String -Pattern '\[!TIP\]').Count
$imp   = ($lines | Select-String -Pattern '\[!IMPORTANT\]').Count
$warn  = ($lines | Select-String -Pattern '\[!WARNING\]').Count
$mermaid = ($lines | Select-String -Pattern '^```mermaid').Count
$fences = ($lines | Select-String -Pattern '^```').Count
# paragraph length check: exclude table rows, code blocks, list items, blockquotes, headings
$inCode = $false; $cur = @(); $long = @()
foreach ($l in $lines) {
  if ($l -match '^```') { $inCode = -not $inCode; continue }
  if ($inCode) { continue }
  if ($l.Trim() -eq '') { if ($cur.Count -gt 8) { $long += "$($cur.Count)行段: $($cur[0].Substring(0,[Math]::Min(50,$cur[0].Length)))..." }; $cur = @() }
  elseif ($l -match '^(\s*[|#>*-]|\s*\d+\.|\s*$)') { $cur = @() }
  else { $cur += $l }
}
"bytes: $((Get-Item 'DEVELOPMENT-HISTORY.md').Length)"
"lines: $($lines.Count)"
"table-lines: $tableLines"
"callouts: NOTE=$note TIP=$tip IMPORTANT=$imp WARNING=$warn"
"mermaid-blocks: $mermaid"
"code-fence-pairs: $([int]($fences/2))"
"long-prose-paragraphs(>8行): $($long.Count)"
$long | Select-Object -First 25
