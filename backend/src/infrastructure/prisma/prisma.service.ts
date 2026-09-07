import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_RULES,
  DEFAULT_SKILLS,
  DEFAULT_TELEGRAM_SOURCES,
} from "../../domain/settings/defaults";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    const count = await this.marvinSettings.count();
    if (count === 0) {
      await this.marvinSettings.create({
        data: {
          skills: JSON.stringify(DEFAULT_SKILLS),
          rules: JSON.stringify(DEFAULT_RULES),
          telegramSources: JSON.stringify(DEFAULT_TELEGRAM_SOURCES),
        },
      });
    }
  }
}
