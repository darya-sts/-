import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { basename } from "path";
import { CurrentUser, type AuthUser } from "../auth/auth.decorators";
import {
  ComposePromptDto,
  CreatePromptDto,
  DelegatePromptDto,
  UpdatePromptDto,
} from "./prompt.dto";
import { PromptService } from "./prompt.service";

@Controller("api/prompts")
export class PromptController {
  constructor(private readonly prompts: PromptService) {}

  @Get("catalog")
  catalog() {
    return this.prompts.catalog();
  }

  @Get("tasks")
  tasks() {
    return this.prompts.listTasks();
  }

  @Post("compose")
  compose(@Body() body: ComposePromptDto) {
    return this.prompts.compose(body);
  }

  @Get()
  list() {
    return this.prompts.list();
  }

  @Post()
  create(@Body() body: CreatePromptDto, @CurrentUser() user: AuthUser) {
    return this.prompts.create(body, user.id);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.prompts.get(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdatePromptDto) {
    return this.prompts.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.prompts.remove(id);
  }

  @Post(":id/pdf")
  async pdf(
    @Param("id") id: string,
    @Body() body: { fileName?: string; outputDir?: string },
    @Res() res: Response,
  ) {
    const full = await this.prompts.writePdf(id, body);
    const buf = this.prompts.readPdfFile(full);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${basename(full)}"`);
    res.send(buf);
  }

  @Post(":id/delegate")
  delegate(@Param("id") id: string, @Body() body: DelegatePromptDto) {
    return this.prompts.delegate(id, body);
  }
}
