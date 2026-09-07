import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import type { Response } from "express";
import { MarvinStudioService } from "../application/marvin-studio.service";
import { DigestPipelineService } from "../application/digest-pipeline.service";
import {
  AnalyzeTelegramDto,
  ChatEditDto,
  GenerateDto,
  InsertMediaDto,
  UpdateArticleDto,
  UpdateSkillsDto,
} from "./dto/marvin.dto";

@Controller("api/marvinbot")
export class MarvinBotController {
  constructor(
    private readonly studio: MarvinStudioService,
    private readonly digests: DigestPipelineService,
  ) {}

  @Get("stats/dashboard")
  dashboardStats() {
    return this.digests.stats();
  }

  @Get("sources")
  listSources() {
    return this.digests.listSources();
  }

  @Post("sources")
  createSource(
    @Body() body: { username: string; title?: string; category: string; weight?: number },
  ) {
    return this.digests.createSource(body);
  }

  @Put("sources/:id")
  updateSource(
    @Param("id") id: string,
    @Body() body: Partial<{ title: string; category: string; weight: number; isActive: boolean }>,
  ) {
    return this.digests.updateSource(id, body);
  }

  @Delete("sources/:id")
  removeSource(@Param("id") id: string) {
    return this.digests.removeSource(id);
  }

  @Get("digests")
  listDigests() {
    return this.digests.listDigests();
  }

  @Post("digests/generate")
  generateDigest() {
    return this.digests.runDigestCycle();
  }

  @Get("digests/:id")
  getDigest(@Param("id") id: string) {
    return this.digests.getDigest(id);
  }

  @Post("digests/:id/select")
  selectDigestItems(@Param("id") id: string, @Body() body: { itemIds: string[] }) {
    return this.digests.selectItems(id, body.itemIds || []);
  }

  @Post("digests/:id/approve")
  approveDigest(@Param("id") id: string) {
    return this.digests.approveAndGenerate(id);
  }

  @Post("generate")
  generate(
    @Body() body: GenerateDto,
    @Headers("x-forwarded-for") fwd?: string,
    @Headers("x-real-ip") realIp?: string,
  ) {
    const clientKey = (fwd || realIp || "local").split(",")[0].trim();
    return this.studio.generate({ ...body, clientKey });
  }

  @Post("generate/stream")
  async generateStream(
    @Body() body: GenerateDto,
    @Res() res: Response,
    @Headers("x-forwarded-for") fwd?: string,
    @Headers("x-real-ip") realIp?: string,
  ) {
    const clientKey = (fwd || realIp || "local").split(",")[0].trim();
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    try {
      for await (const chunk of this.studio.generateStream({ ...body, clientKey })) {
        res.write(`event: ${chunk.event}\ndata: ${JSON.stringify(chunk.data)}\n\n`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "stream error";
      res.write(`event: error\ndata: ${JSON.stringify(message)}\n\n`);
    }
    res.end();
  }

  @Get("articles")
  listArticles() {
    return this.studio.listArticles();
  }

  @Get("articles/:id")
  getArticle(@Param("id") id: string) {
    return this.studio.getArticle(id);
  }

  @Patch("articles/:id")
  updateArticle(@Param("id") id: string, @Body() body: UpdateArticleDto) {
    return this.studio.updateArticle(id, body);
  }

  @Post("articles/:id/media")
  insertMedia(@Param("id") id: string, @Body() body: InsertMediaDto) {
    return this.studio.insertMedia(id, body);
  }

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.studio.saveUpload(file);
  }

  @Get("articles/:id/export")
  async exportArticle(
    @Param("id") id: string,
    @Query("format") format: "pdf" | "docx" = "pdf",
    @Res() res: Response,
  ) {
    const file = await this.studio.exportArticle(id, format === "docx" ? "docx" : "pdf");
    res.setHeader("Content-Type", file.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
    res.send(file.buffer);
  }

  @Put("skills")
  updateSkills(@Body() body: UpdateSkillsDto) {
    return this.studio.updateSkills(body);
  }

  @Get("skills")
  getSkills() {
    return this.studio.getSettings();
  }

  @Post("chat")
  chat(
    @Body() body: ChatEditDto,
    @Headers("x-forwarded-for") fwd?: string,
    @Headers("x-real-ip") realIp?: string,
  ) {
    const clientKey = (fwd || realIp || "local").split(",")[0].trim();
    return this.studio.chatEdit({ ...body, clientKey });
  }

  @Post("analyze-telegram")
  analyzeTelegram(@Body() body: AnalyzeTelegramDto) {
    return this.studio.analyzeTelegram(body);
  }
}