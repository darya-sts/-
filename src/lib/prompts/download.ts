function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
}

export function downloadText(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const href = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = href
  link.download = filename
  link.click()
  URL.revokeObjectURL(href)
}

export function openPrintablePdf(title: string, body: string) {
  const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 40px auto; color: #111; }
    h1 { font-size: 22px; }
    p.meta { color: #5a6570; font-size: 12px; }
    pre { white-space: pre-wrap; font-size: 12px; line-height: 1.5; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <h1>Forge Mill — Prompt Studio</h1>
  <p class="meta">${escapeHtml(title)}</p>
  <pre>${escapeHtml(body)}</pre>
  <script>window.addEventListener("load", () => window.print())</script>
</body>
</html>`
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const href = URL.createObjectURL(blob)
  const popup = window.open(href, "_blank")
  if (!popup) downloadText(`${title.slice(0, 40) || "prompt"}.html`, html, "text/html")
}
