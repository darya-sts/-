import { Injectable, NotFoundException } from "@nestjs/common";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import PDFDocument from "pdfkit";
import { PrismaService } from "../infrastructure/prisma/prisma.service";
import {
  PROMPT_AGENTS,
  PROMPT_MODELS,
  PUBLICATION_OPTIONS,
  MEMORY_OPTIONS,
  recommendModelTier,
} from "./prompt.catalog";
import type { ComposePromptDto, CreatePromptDto, DelegatePromptDto, UpdatePromptDto } from "./prompt.dto";

function projectRoot(): string {
  return (
    process.env.PROMPTS_ROOT ||
    process.env.ARCHITECTURE_ROOT ||
    join(process.cwd(), "..")
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "prompt";
}

/** DejaVu поддерживает кириллицу (в отличие от стандартных шрифтов PDFKit). */
function resolvePdfFont(): string | null {
  const candidates = [
    process.env.PDF_FONT_PATH,
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/TTF/DejaVuSans.ttf",
    join(process.cwd(), "assets", "DejaVuSans.ttf"),
  ].filter(Boolean) as string[];
  return candidates.find((p) => existsSync(p)) || null;
}

@Injectable()
export class PromptService {
  constructor(private readonly prisma: PrismaService) {}

  catalog() {
    return {
      agents: PROMPT_AGENTS,
      models: PROMPT_MODELS,
      publications: PUBLICATION_OPTIONS,
      memoryItems: MEMORY_OPTIONS,
      defaults: {
        confirmation: "manual",
        parallelLimit: null,
        externalIntegrations: [],
      },
    };
  }

  /** Собирает структурированный промт из запроса пользователя. */
  compose(dto: ComposePromptDto) {
    const title = dto.title?.trim() || this.deriveTitle(dto.request);
    const tier = recommendModelTier(dto.request);
    const body = [
      `# ${title}`,
      "",
      "## Цель",
      dto.request.trim(),
      "",
      "## Контекст",
      "- Репозиторий: Forge Mill (Next.js + NestJS + Postgres).",
      "- Соблюдать существующую архитектуру и дизайн-систему.",
      "- Не ломать текущий функционал; добавлять точечно.",
      "",
      "## Требования к результату",
      "1. Выполни задачу полностью, без заглушек.",
      "2. Покрой проверками (build/tests/ручная проверка по ситуации).",
      "3. Закоммить и запушь изменения, если публикация через Git включена.",
      "4. Дай краткий отчёт: что сделано, где лежит артефакт.",
      "",
      "## Ограничения",
      "- Секреты не коммитить.",
      "- Комментарии в коде — на русском, где это принято в проекте.",
      "",
      `## Рекомендуемый тариф модели (подсказка)`,
      `- ${tier}`,
    ].join("\n");

    return { title, body, recommendedTier: tier };
  }

  private deriveTitle(request: string): string {
    const line = request.trim().split(/\n/)[0] || "Промт";
    return line.slice(0, 80);
  }

  async create(dto: CreatePromptDto, userId?: string) {
    return this.prisma.prompt.create({
      data: {
        title: dto.title,
        request: dto.request,
        body: dto.body,
        createdById: userId,
        status: "draft",
      },
    });
  }

  async list() {
    return this.prisma.prompt.findMany({
      orderBy: { createdAt: "desc" },
      include: { tasks: { orderBy: { createdAt: "desc" }, take: 3 } },
    });
  }

  async get(id: string) {
    const prompt = await this.prisma.prompt.findUnique({
      where: { id },
      include: { tasks: { orderBy: { createdAt: "desc" } } },
    });
    if (!prompt) throw new NotFoundException("Промт не найден");
    return prompt;
  }

  async update(id: string, dto: UpdatePromptDto) {
    await this.get(id);
    return this.prisma.prompt.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.prompt.delete({ where: { id } });
    return { ok: true };
  }

  async listTasks() {
    return this.prisma.promptTask.findMany({
      orderBy: { createdAt: "desc" },
      include: { prompt: { select: { id: true, title: true } } },
      take: 100,
    });
  }

  /** PDF с метаданными. */
  async writePdf(
    promptId: string,
    opts?: { fileName?: string; outputDir?: string; meta?: Record<string, string> },
  ): Promise<string> {
    const prompt = await this.get(promptId);
    const root = projectRoot();
    const dir = opts?.outputDir
      ? join(root, opts.outputDir)
      : join(root, "prompts", "pdf");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const fileName = (opts?.fileName || `${slugify(prompt.title)}.pdf`).replace(/[^\w.\-а-яё]+/gi, "_");
    const full = join(dir, fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);

    const fontPath = resolvePdfFont();
    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = createWriteStream(full);
      doc.pipe(stream);
      if (fontPath) {
        doc.registerFont("Body", fontPath);
        doc.font("Body");
      }
      doc.fontSize(18).text("Forge Mill — Prompt Studio", { underline: true });
      doc.moveDown();
      doc.fontSize(14).text(prompt.title);
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#444").text(`ID: ${prompt.id}`);
      doc.text(`Создан: ${prompt.createdAt.toISOString()}`);
      doc.text(`Статус: ${prompt.status}`);
      if (opts?.meta) {
        for (const [k, v] of Object.entries(opts.meta)) doc.text(`${k}: ${v}`);
      }
      doc.moveDown();
      doc.fillColor("#000").fontSize(12).text("Исходный запрос", { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10).text(prompt.request, { align: "left" });
      doc.moveDown();
      doc.fontSize(12).text("Промт", { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10).text(prompt.body, { align: "left" });
      doc.end();
      stream.on("finish", () => resolve());
      stream.on("error", reject);
    });

    return full;
  }

  /** Формирует задание Cursor + сохраняет в историю + пишет файлы по publications. */
  async delegate(promptId: string, dto: DelegatePromptDto) {
    const prompt = await this.get(promptId);
    const agents = PROMPT_AGENTS.filter((a) => dto.agents.includes(a.id));
    const model = PROMPT_MODELS.find((m) => m.id === dto.modelId);
    let roles: Record<string, string> = {};
    try {
      roles = JSON.parse(dto.agentRoles || "{}") as Record<string, string>;
    } catch {
      roles = {};
    }

    const packageMarkdown = this.buildPackageMarkdown(prompt, dto, agents, model, roles);
    const outputPaths: string[] = [];
    const root = projectRoot();
    const outDirRel = dto.outputDir || "prompts/tasks";
    const outDir = join(root, outDirRel);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    let pdfPath: string | undefined;
    const wantsPdf = dto.publications.includes("pdf");
    const wantsMd = dto.publications.includes("markdown") || dto.publications.includes("project-file");
    const wantsGit = dto.publications.includes("git");

    if (wantsPdf) {
      pdfPath = await this.writePdf(promptId, {
        fileName: dto.pdfFileName || `${slugify(prompt.title)}.pdf`,
        outputDir: "prompts/pdf",
        meta: {
          Модель: `${dto.modelTier} / ${dto.modelId}`,
          Агенты: agents.map((a) => a.name).join(", "),
          Приоритет: dto.priority || "standard",
          Память: dto.saveToMemory ? "да" : "нет",
        },
      });
      outputPaths.push(pdfPath);
    }

    const mdName = `${slugify(prompt.title)}-${Date.now()}.md`;
    const mdFull = join(outDir, mdName);
    if (wantsMd || wantsGit || dto.publications.includes("chat")) {
      writeFileSync(mdFull, packageMarkdown, "utf8");
      outputPaths.push(mdFull);
    }

    // Cursor task drop for manual pickup
    const cursorTasks = join(root, ".cursor", "tasks");
    if (!existsSync(cursorTasks)) mkdirSync(cursorTasks, { recursive: true });
    const cursorTaskPath = join(cursorTasks, mdName);
    writeFileSync(cursorTaskPath, packageMarkdown, "utf8");
    outputPaths.push(cursorTaskPath);

    const task = await this.prisma.promptTask.create({
      data: {
        promptId,
        agents: dto.agents,
        agentRoles: dto.agentRoles,
        modelTier: dto.modelTier,
        modelId: dto.modelId,
        publications: dto.publications,
        saveToMemory: dto.saveToMemory,
        memoryItems: dto.memoryItems,
        priority: dto.priority || "standard",
        deadline: dto.deadline,
        inputRef: dto.inputRef,
        packageMarkdown,
        pdfPath,
        outputPaths,
        status: wantsGit ? "ready_for_git" : "ready",
      },
    });

    await this.prisma.prompt.update({
      where: { id: promptId },
      data: { status: "delegated" },
    });

    // Memory note (локальный файл — без внешних сервисов)
    if (dto.saveToMemory) {
      const memDir = join(root, "prompts", "memory");
      if (!existsSync(memDir)) mkdirSync(memDir, { recursive: true });
      const memPath = join(memDir, `${task.id}.json`);
      const payload: Record<string, unknown> = {
        taskId: task.id,
        promptId,
        savedAt: new Date().toISOString(),
      };
      if (dto.memoryItems.includes("prompt-body")) payload.promptBody = prompt.body;
      if (dto.memoryItems.includes("models-used")) payload.model = { tier: dto.modelTier, id: dto.modelId };
      if (dto.memoryItems.includes("key-decisions")) {
        payload.keyDecisions = {
          agents: dto.agents,
          publications: dto.publications,
          priority: dto.priority || "standard",
        };
      }
      if (dto.memoryItems.includes("agent-output")) {
        payload.agentOutput = "Будет дополнено после выполнения задания Cursor.";
      }
      writeFileSync(memPath, JSON.stringify(payload, null, 2), "utf8");
      outputPaths.push(memPath);
    }

    return {
      task,
      packageMarkdown,
      outputPaths,
      gitHint: wantsGit
        ? "Выбрана публикация в Git: закоммитьте файлы из outputPaths (cloud agent сделает commit+push при выполнении задания)."
        : null,
      chatPreview: dto.publications.includes("chat") ? packageMarkdown : null,
    };
  }

  private buildPackageMarkdown(
    prompt: { id: string; title: string; request: string; body: string },
    dto: DelegatePromptDto,
    agents: { id: string; name: string }[],
    model: { id: string; name: string; tier: string } | undefined,
    roles: Record<string, string>,
  ): string {
    const agentLines = agents
      .map((a) => `- **${a.name}** (\`${a.id}\`): ${roles[a.id] || "роль не указана"}`)
      .join("\n");
    return [
      `# Cursor Task: ${prompt.title}`,
      "",
      `promptId: \`${prompt.id}\``,
      `priority: **${dto.priority || "standard"}**`,
      dto.deadline ? `deadline: ${dto.deadline}` : null,
      dto.inputRef ? `input: ${dto.inputRef}` : null,
      "",
      "## Модель",
      `- Tier: **${dto.modelTier}**`,
      `- Model: \`${dto.modelId}\`${model ? ` (${model.name})` : ""}`,
      "",
      "## Агенты",
      agentLines || "- (не выбраны)",
      "",
      "## Публикация",
      dto.publications.map((p) => `- ${p}`).join("\n") || "- chat",
      "",
      "## Память",
      dto.saveToMemory
        ? `- Сохранить: ${dto.memoryItems.join(", ") || "базовый контекст"}`
        : "- Не сохранять",
      "",
      "## Подтверждение",
      "- Режим: **ручное подтверждение** параметров перед стартом (уже получено).",
      "",
      "## Промт",
      "",
      prompt.body,
      "",
      "## Исходный запрос пользователя",
      "",
      prompt.request,
      "",
      "## Инструкция исполнителю Cursor",
      "1. Выполни промт выше выбранными агентами/моделью.",
      "2. Опубликуй результат согласно списку publications.",
      "3. Верни краткий отчёт: статус, модель, пути артефактов, память.",
    ]
      .filter((x) => x !== null)
      .join("\n");
  }

  /** Прочитать PDF как buffer для HTTP download. */
  readPdfFile(fullPath: string): Buffer {
    if (!existsSync(fullPath)) throw new NotFoundException("PDF не найден");
    return readFileSync(fullPath);
  }
}
