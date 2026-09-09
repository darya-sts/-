/** Файловый + GitHub сканер архитектуры (NestJS). */

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  mkdirSync,
} from "fs";
import { join, basename, extname, relative, resolve } from "path";
import * as yaml from "js-yaml";

export type ArchitectureNodeType =
  | "agent"
  | "bot"
  | "app"
  | "tool"
  | "workflow"
  | "service";

export type ServerInfo = {
  host?: string;
  type?: string;
  path?: string;
  container?: string;
  ports?: string[];
  health?: string;
  status?: "online" | "offline" | "unknown";
};

export type ArchitectureObject = {
  id: string;
  name: string;
  type: ArchitectureNodeType;
  description?: string;
  skills: string[];
  rules: string[];
  github?: string;
  repo?: string;
  branch?: string;
  server?: ServerInfo;
  dependencies: string[];
  sourcePath?: string;
  skillSources?: Record<string, string>;
  error?: string;
};

export type ArchitectureEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
};

export type ArchitectureGraph = {
  objects: ArchitectureObject[];
  edges: ArchitectureEdge[];
  scannedAt: string;
  errors: string[];
};

export type ArchitectureConfig = {
  scanPaths: string[];
  github: { enabled: boolean; org: string; repos: string[] };
  serverCheck: { enabled: boolean; endpoints: Record<string, string> };
};

const CONFIG_CANDIDATES = [
  "architecture.config.json",
  "config/architecture.config.json",
];

const CONFIG_FILE_NAMES = new Set([
  "agent.json",
  "bot.json",
  "config.yaml",
  "config.yml",
  "config.json",
]);

const FILE_PATTERNS = [/\.agent\.(js|ts|json)$/i, /\.bot\.(js|ts|json)$/i];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function asStringList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) => {
        if (typeof v === "string") return v;
        if (v && typeof v === "object" && "name" in (v as object))
          return String((v as { name: unknown }).name);
        return String(v);
      })
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function findProjectRoot(): string {
  // В Docker backend cwd = /app; конфиг может быть смонтирован или лежать рядом с монорепо
  const candidates = [
    process.env.ARCHITECTURE_ROOT,
    process.cwd(),
    resolve(process.cwd(), ".."),
    "/opt/my_services/forge-mill-src",
    "/workspace",
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    if (existsSync(join(c, "architecture.config.json"))) return c;
    if (existsSync(join(c, "package.json")) && existsSync(join(c, "src"))) return c;
  }
  return process.cwd();
}

export function loadArchitectureConfig(root?: string): ArchitectureConfig {
  const base = root || findProjectRoot();
  for (const rel of CONFIG_CANDIDATES) {
    const full = join(base, rel);
    if (existsSync(full)) {
      return JSON.parse(readFileSync(full, "utf8")) as ArchitectureConfig;
    }
  }
  // Также проверим volume с настройками
  const runtime = join(base, "data", "architecture.config.json");
  if (existsSync(runtime)) {
    return JSON.parse(readFileSync(runtime, "utf8")) as ArchitectureConfig;
  }
  return {
    scanPaths: ["./agents", "./bots"],
    github: { enabled: false, org: "", repos: [] },
    serverCheck: { enabled: false, endpoints: {} },
  };
}

export function saveArchitectureConfig(config: ArchitectureConfig, root?: string): ArchitectureConfig {
  const base = root || findProjectRoot();
  const dir = join(base, "data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const full = join(dir, "architecture.config.json");
  writeFileSync(full, JSON.stringify(config, null, 2), "utf8");
  // Зеркалируем в корень, если есть права
  try {
    writeFileSync(join(base, "architecture.config.json"), JSON.stringify(config, null, 2), "utf8");
  } catch {
    // ignore
  }
  return config;
}

function parseObject(
  raw: Record<string, unknown>,
  sourcePath: string,
  fileName: string,
  dirHint: string,
): ArchitectureObject {
  try {
    const name = String(raw.name || raw.title || raw.id || fileName).trim();
    let type = String(raw.type || raw.kind || "").toLowerCase() as ArchitectureNodeType;
    const allowed: ArchitectureNodeType[] = [
      "agent",
      "bot",
      "app",
      "tool",
      "workflow",
      "service",
    ];
    if (!allowed.includes(type)) {
      const blob = `${fileName} ${dirHint} ${name}`.toLowerCase();
      if (blob.includes("bot")) type = "bot";
      else if (blob.includes("service") || blob.includes("api")) type = "service";
      else if (blob.includes("app") || blob.includes("studio")) type = "app";
      else if (blob.includes("tool")) type = "tool";
      else if (blob.includes("workflow")) type = "workflow";
      else type = "agent";
    }
    const skills = [
      ...asStringList(raw.skills),
      ...asStringList(raw.tools),
      ...asStringList(raw.capabilities),
    ];
    const rules = [
      ...asStringList(raw.rules),
      ...asStringList(raw.instructions),
      ...(typeof raw.prompt === "string" ? [raw.prompt] : asStringList(raw.prompt)),
    ];
    const githubRaw =
      (raw.github as string) || (raw.repository as string) || (raw.repo as string) || undefined;
    const dependencies = [
      ...asStringList(raw.depends_on),
      ...asStringList(raw.dependencies),
      ...asStringList(raw.calls),
      ...asStringList(raw.uses),
    ];
    let server: ServerInfo | undefined;
    const srv = raw.server || raw.deploy || raw.host;
    if (typeof srv === "string") server = { host: srv, status: "unknown" };
    else if (srv && typeof srv === "object") {
      const o = srv as Record<string, unknown>;
      server = {
        host: o.host ? String(o.host) : undefined,
        type: o.type ? String(o.type) : undefined,
        path: o.path ? String(o.path) : undefined,
        container: o.container ? String(o.container) : undefined,
        ports: Array.isArray(o.ports) ? o.ports.map(String) : undefined,
        health: o.health ? String(o.health) : undefined,
        status: "unknown",
      };
    }
    const skillSources: Record<string, string> = {};
    for (const s of skills) skillSources[s] = sourcePath;

    return {
      id: slugify(`${type}-${name}`),
      name,
      type,
      description: raw.description ? String(raw.description) : undefined,
      skills: Array.from(new Set(skills)),
      rules: Array.from(new Set(rules)),
      github: githubRaw?.startsWith("http")
        ? githubRaw
        : githubRaw
          ? `https://github.com/${githubRaw}`
          : undefined,
      repo: typeof raw.repo === "string" ? raw.repo : undefined,
      branch: raw.branch ? String(raw.branch) : undefined,
      server,
      dependencies: Array.from(new Set(dependencies)),
      sourcePath,
      skillSources,
    };
  } catch (e) {
    return {
      id: slugify(`error-${sourcePath}`),
      name: fileName,
      type: "agent",
      skills: [],
      rules: [],
      dependencies: [],
      sourcePath,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

function shouldScanFile(name: string, parentDir: string): boolean {
  const base = name.toLowerCase();
  if (base === "agent.json" || base === "bot.json") return true;
  if (FILE_PATTERNS.some((re) => re.test(name))) return true;
  // config.yaml/json — только внутри agent_*/bot_*/agents/bots
  if (CONFIG_FILE_NAMES.has(base)) {
    const parent = basename(parentDir).toLowerCase();
    return (
      shouldScanDir(parent) ||
      parent.startsWith("agent") ||
      parent.startsWith("bot") ||
      parent.includes("agent") ||
      parent.includes("bot")
    );
  }
  return false;
}

function shouldScanDir(name: string): boolean {
  return /^(agent|bot|skill)_/i.test(name) || /^(agents|bots|skills)$/i.test(name);
}

function walkDir(dir: string, out: string[], depth = 0): void {
  if (depth > 8) return;
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name === "node_modules" || name === ".git" || name === "dist" || name === ".next") continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (shouldScanDir(name) || depth < 4) walkDir(full, out, depth + 1);
    } else if (st.isFile() && shouldScanFile(name)) {
      out.push(full);
    }
  }
}

function readConfigFile(full: string): Record<string, unknown> | null {
  const ext = extname(full).toLowerCase();
  const text = readFileSync(full, "utf8");
  if (ext === ".yaml" || ext === ".yml") {
    const doc = yaml.load(text);
    return doc && typeof doc === "object" ? (doc as Record<string, unknown>) : null;
  }
  if (ext === ".json") {
    return JSON.parse(text) as Record<string, unknown>;
  }
  // .js/.ts — пытаемся вытащить JSON-подобный export default {...}
  const m = text.match(/export\s+default\s+(\{[\s\S]*\})\s*;?\s*$/);
  if (m) {
    try {
      // Небезопасный eval запрещён — только JSON-совместимый литерал
      return JSON.parse(m[1].replace(/(\w+)\s*:/g, '"$1":').replace(/'/g, '"'));
    } catch {
      return null;
    }
  }
  return null;
}

async function scanGithub(
  config: ArchitectureConfig,
  errors: string[],
): Promise<ArchitectureObject[]> {
  if (!config.github?.enabled) return [];
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  if (!token) {
    errors.push("GITHUB_TOKEN не задан — GitHub-сканирование пропущено");
    return [];
  }
  const org = config.github.org;
  const repos = config.github.repos?.length ? config.github.repos : [];
  const objects: ArchitectureObject[] = [];

  for (const repo of repos) {
    try {
      const url = `https://api.github.com/repos/${org}/${repo}/git/trees/HEAD?recursive=1`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "forge-mill-architecture",
        },
      });
      if (!res.ok) {
        errors.push(`GitHub ${org}/${repo}: HTTP ${res.status}`);
        continue;
      }
      const data = (await res.json()) as { tree?: Array<{ path: string; type: string }> };
      const files = (data.tree || []).filter(
        (t) =>
          t.type === "blob" &&
          (shouldScanFile(basename(t.path)) ||
            /\/(agent|bot)\.(json|yaml|yml)$/i.test(t.path)),
      );
      for (const f of files.slice(0, 40)) {
        try {
          const rawUrl = `https://api.github.com/repos/${org}/${repo}/contents/${f.path}`;
          const fr = await fetch(rawUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github.raw",
              "User-Agent": "forge-mill-architecture",
            },
          });
          if (!fr.ok) continue;
          const text = await fr.text();
          let parsed: Record<string, unknown> | null = null;
          if (f.path.endsWith(".json")) parsed = JSON.parse(text);
          else if (/\.ya?ml$/i.test(f.path)) {
            const doc = yaml.load(text);
            parsed = doc && typeof doc === "object" ? (doc as Record<string, unknown>) : null;
          }
          if (!parsed) continue;
          objects.push(
            parseObject(
              parsed,
              `github:${org}/${repo}/${f.path}`,
              basename(f.path),
              f.path,
            ),
          );
        } catch (e) {
          errors.push(`GitHub file ${f.path}: ${e instanceof Error ? e.message : e}`);
        }
      }
    } catch (e) {
      errors.push(`GitHub repo ${repo}: ${e instanceof Error ? e.message : e}`);
    }
  }
  return objects;
}

async function checkServers(
  objects: ArchitectureObject[],
  config: ArchitectureConfig,
): Promise<void> {
  if (!config.serverCheck?.enabled) return;
  const endpoints = config.serverCheck.endpoints || {};
  await Promise.all(
    objects.map(async (obj) => {
      const url = endpoints[obj.name] || obj.server?.health;
      if (!url || !obj.server) {
        if (obj.server) obj.server.status = "unknown";
        return;
      }
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(t);
        obj.server.status = res.ok ? "online" : "offline";
      } catch {
        obj.server.status = "offline";
      }
    }),
  );
}

function buildGraph(objects: ArchitectureObject[], errors: string[]): ArchitectureGraph {
  const byName = new Map<string, ArchitectureObject>();
  for (const o of objects) {
    byName.set(o.name.toLowerCase(), o);
    byName.set(o.id.toLowerCase(), o);
  }
  const edges: ArchitectureEdge[] = [];
  const types = new Set<ArchitectureNodeType>();
  for (const o of objects) {
    types.add(o.type);
    edges.push({
      id: `cat-${o.type}-${o.id}`,
      source: `cat-${o.type}`,
      target: o.id,
      label: "contains",
    });
    for (const dep of o.dependencies) {
      const t = byName.get(dep.toLowerCase());
      if (t && t.id !== o.id) {
        edges.push({
          id: `dep-${o.id}-${t.id}`,
          source: o.id,
          target: t.id,
          label: "depends on",
        });
      }
    }
  }
  for (const type of types) {
    edges.push({ id: `root-${type}`, source: "root", target: `cat-${type}`, label: "group" });
  }
  return { objects, edges, scannedAt: new Date().toISOString(), errors };
}

let cache: ArchitectureGraph | null = null;

export async function runArchitectureScan(configOverride?: ArchitectureConfig): Promise<ArchitectureGraph> {
  const root = findProjectRoot();
  const config = configOverride || loadArchitectureConfig(root);
  const errors: string[] = [];
  const objects: ArchitectureObject[] = [];
  const seen = new Set<string>();

  for (const rawPath of config.scanPaths || []) {
    const abs = resolve(rawPath.startsWith("/") ? rawPath : join(root, rawPath));
    if (!existsSync(abs)) {
      errors.push(`Путь не найден: ${rawPath}`);
      continue;
    }
    const files: string[] = [];
    const st = statSync(abs);
    if (st.isFile()) files.push(abs);
    else walkDir(abs, files);

    for (const file of files) {
      try {
        const raw = readConfigFile(file);
        if (!raw) {
          errors.push(`Не удалось разобрать: ${file}`);
          objects.push({
            id: slugify(`error-${file}`),
            name: basename(file),
            type: "agent",
            skills: [],
            rules: [],
            dependencies: [],
            sourcePath: file,
            error: "parse failed",
          });
          continue;
        }
        const obj = parseObject(raw, relative(root, file) || file, basename(file), file);
        if (seen.has(obj.id)) continue;
        seen.add(obj.id);
        objects.push(obj);
      } catch (e) {
        errors.push(`${file}: ${e instanceof Error ? e.message : e}`);
        objects.push({
          id: slugify(`error-${file}`),
          name: basename(file),
          type: "agent",
          skills: [],
          rules: [],
          dependencies: [],
          sourcePath: file,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  const gh = await scanGithub(config, errors);
  for (const o of gh) {
    if (!seen.has(o.id)) {
      seen.add(o.id);
      objects.push(o);
    }
  }

  await checkServers(objects, config);
  cache = buildGraph(objects, errors);
  return cache;
}

export function getCachedArchitecture(): ArchitectureGraph | null {
  return cache;
}
