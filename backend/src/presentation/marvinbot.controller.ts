import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { MarvinStudioService } from "../application/marvin-studio.service";
import {
  AnalyzeTelegramDto,
  ChatEditDto,
  GenerateDto,
  UpdateSkillsDto,
} from "./dto/marvin.dto";

@Controller("api/marvinbot")
export class MarvinBotController {
  constructor(private readonly studio: MarvinStudioService) {}

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
