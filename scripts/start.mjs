import { createReadStream, existsSync, statSync } from "node:fs"
import { createServer } from "node:http"
import { extname, join, relative, resolve, sep } from "node:path"

const root = resolve("out")
const port = Number(process.env.PORT || 43147)
const host = "0.0.0.0"

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
}

function safeFile(urlPath) {
  const decoded = decodeURIComponent((urlPath.split("?")[0] || "/").replace(/\\/g, "/"))
  const rel = decoded.replace(/^\/+/, "")
  const candidate = resolve(root, rel)
  const relToRoot = relative(root, candidate)
  if (relToRoot.startsWith("..") || relToRoot.split(sep).includes("..")) return null
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  const asIndex = join(candidate, "index.html")
  if (existsSync(asIndex) && statSync(asIndex).isFile()) return asIndex
  const html = `${candidate}.html`
  if (existsSync(html) && statSync(html).isFile()) return html
  const fallback = join(root, "404.html")
  if (existsSync(fallback)) return fallback
  return null
}

if (!existsSync(join(root, "index.html"))) {
  console.error("Missing out/index.html. Run npm run build first.")
  process.exit(1)
}

const server = createServer((req, res) => {
  const file = safeFile(req.url || "/")
  if (!file) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" })
    res.end("Not found")
    return
  }
  const type = TYPES[extname(file).toLowerCase()] || "application/octet-stream"
  res.writeHead(200, { "content-type": type })
  createReadStream(file).pipe(res)
})

server.listen(port, host, () => {
  console.log(`Serving ${root} on http://${host}:${port}`)
})
