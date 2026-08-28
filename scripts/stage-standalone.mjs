import { cpSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const root = ".next/standalone"
mkdirSync(join(root, ".next"), { recursive: true })
cpSync("public", join(root, "public"), { recursive: true })
cpSync(".next/static", join(root, ".next", "static"), { recursive: true })
