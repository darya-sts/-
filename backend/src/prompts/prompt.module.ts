import { Module } from "@nestjs/common";
import { PrismaService } from "../infrastructure/prisma/prisma.service";
import { PromptController } from "./prompt.controller";
import { PromptService } from "./prompt.service";

@Module({
  controllers: [PromptController],
  providers: [PrismaService, PromptService],
  exports: [PromptService],
})
export class PromptModule {}
