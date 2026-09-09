function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

const KEYWORDS = new Set([
  "export",
  "import",
  "from",
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "async",
  "await",
  "class",
  "type",
  "interface",
  "new",
  "true",
  "false",
  "null",
  "undefined",
  "typeof",
  "void",
  "extends",
  "implements",
  "public",
  "private",
  "readonly",
  "services",
  "ports",
])

export function highlightCode(code: string) {
  let html = ""
  let i = 0
  while (i < code.length) {
    if (code.startsWith("//", i)) {
      const end = code.indexOf("\n", i)
      const slice = end === -1 ? code.slice(i) : code.slice(i, end)
      html += `<span class="tok-comment">${escapeHtml(slice)}</span>`
      i += slice.length
      continue
    }
    const quote = code[i]
    if (quote === '"' || quote === "'" || quote === "`") {
      let j = i + 1
      while (j < code.length) {
        if (code[j] === "\\") {
          j += 2
          continue
        }
        if (code[j] === quote) {
          j += 1
          break
        }
        j += 1
      }
      html += `<span class="tok-str">${escapeHtml(code.slice(i, j))}</span>`
      i = j
      continue
    }
    if (/\d/.test(code[i] ?? "") && (i === 0 || /[^\w]/.test(code[i - 1] ?? ""))) {
      let j = i
      while (j < code.length && /[\d.]/.test(code[j] ?? "")) j += 1
      html += `<span class="tok-num">${escapeHtml(code.slice(i, j))}</span>`
      i = j
      continue
    }
    if (/[A-Za-z_$]/.test(code[i] ?? "")) {
      let j = i
      while (j < code.length && /[\w$]/.test(code[j] ?? "")) j += 1
      const token = code.slice(i, j)
      if (KEYWORDS.has(token)) html += `<span class="tok-kw">${escapeHtml(token)}</span>`
      else if (/^[A-Z]/.test(token)) html += `<span class="tok-type">${escapeHtml(token)}</span>`
      else html += escapeHtml(token)
      i = j
      continue
    }
    html += escapeHtml(code[i] ?? "")
    i += 1
  }
  return html
}
