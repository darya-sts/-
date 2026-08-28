import { spawn } from "node:child_process"
import { existsSync } from "node:fs"

process.env.HOSTNAME = "0.0.0.0"
if (!process.env.PORT) {
  process.env.PORT = "3000"
}

const server = ".next/standalone/server.js"
if (!existsSync(server)) {
  console.error("Missing .next/standalone/server.js. Run npm run build first.")
  process.exit(1)
}

const child = spawn(process.execPath, [server], {
  stdio: "inherit",
  env: process.env,
})
child.on("exit", (code) => process.exit(code ?? 1))
